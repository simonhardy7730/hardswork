import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * Un lien de réseau social → son image de couverture, à analyser comme une photo.
 * Les réseaux ne donnent officiellement accès qu'à cette image (oEmbed ou balise og:image),
 * pas à la vidéo : pour toutes les tenues d'une vidéo, l'utilisateur dépose la vidéo elle-même.
 *
 * Sécurité : seuls des sites connus sont interrogés, et les images ne sont téléchargées
 * que depuis leurs serveurs d'images (pas de requête vers une adresse arbitraire).
 */

type Source = { name: string; oembed?: (url: string) => string };

const SOURCES: Array<[RegExp, Source]> = [
  [/(^|\.)tiktok\.com$/, { name: "TikTok", oembed: (u) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}` }],
  [/(^|\.)youtube\.com$|^youtu\.be$/, { name: "YouTube", oembed: (u) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}` }],
  [/(^|\.)pinterest\.[a-z.]+$|^pin\.it$/, { name: "Pinterest" }],
  [/(^|\.)instagram\.com$/, { name: "Instagram" }],
];

/** Serveurs d'images autorisés pour le téléchargement de la couverture. */
const IMAGE_HOSTS = /(^|\.)(tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|ibyteimg\.com|ytimg\.com|pinimg\.com|cdninstagram\.com|fbcdn\.net)$/;

const MAX_IMAGE_BYTES = 6_000_000;
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; SosilookBot/1.0)", "Accept-Language": "fr-FR,fr;q=0.9" };

const ALL_OUTFITS =
  "Depuis un lien, on ne récupère que l'image de couverture. Pour analyser toutes les tenues d'une vidéo, enregistre-la (ou fais un enregistrement d'écran) et dépose-la ici.";

function fail(error: string, status = 422) {
  return NextResponse.json({ error }, { status });
}

const isSourceHost = (h: string) => SOURCES.some(([re]) => re.test(h));
const isImageHost = (h: string) => IMAGE_HOSTS.test(h);

/**
 * Suit les redirections une à une (3 au plus) en vérifiant que chaque destination
 * reste en https sur un hôte autorisé : on ne contacte jamais une adresse arbitraire.
 */
async function safeFetch(url: string, allowed: (host: string) => boolean, ms = 8000): Promise<Response> {
  let current = new URL(url);
  for (let hop = 0; hop < 4; hop++) {
    if (current.protocol !== "https:" || !allowed(current.hostname.toLowerCase())) {
      throw new Error(`Hôte refusé : ${current.hostname}`);
    }
    const res = await fetch(current, { headers: HEADERS, redirect: "manual", signal: AbortSignal.timeout(ms), cache: "no-store" });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current);
      continue;
    }
    return res;
  }
  throw new Error("Trop de redirections");
}

/** Lit l'image og:image d'une page (Pinterest, Instagram). */
async function ogImage(pageUrl: string): Promise<string | null> {
  const res = await safeFetch(pageUrl, isSourceHost);
  if (!res.ok) return null;
  const html = (await res.text()).slice(0, 500_000);
  const m =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  return m ? m[1].replace(/&amp;/g, "&") : null;
}

export async function POST(req: Request) {
  let raw: string;
  try {
    raw = String(((await req.json()) as { url?: unknown }).url ?? "").trim();
  } catch {
    return fail("Requête invalide.", 400);
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fail("Ce lien n'est pas valide. Copie-le depuis le bouton « Partager » de l'application.", 400);
  }
  const host = url.hostname.toLowerCase();
  const source = SOURCES.find(([re]) => re.test(host))?.[1];
  if (url.protocol !== "https:" || !source) {
    return fail("Pour l'instant, on lit les liens TikTok, YouTube, Pinterest et Instagram.", 400);
  }

  try {
    let thumbnail: string | null = null;
    let title: string | undefined;
    if (source.oembed) {
      const res = await safeFetch(source.oembed(url.toString()), isSourceHost);
      if (res.ok) {
        const data = (await res.json()) as { thumbnail_url?: string; title?: string };
        thumbnail = data.thumbnail_url ?? null;
        title = data.title;
      }
    } else {
      thumbnail = await ogImage(url.toString());
    }
    if (!thumbnail) {
      return fail(
        `${source.name} n'a pas donné d'image pour ce lien (publication privée, supprimée, ou accès refusé). Fais une capture d'écran ou enregistre la vidéo, puis dépose-la ici.`,
      );
    }

    const imgUrl = new URL(thumbnail);
    if (imgUrl.protocol !== "https:" || !isImageHost(imgUrl.hostname.toLowerCase())) {
      return fail(`L'image de ce lien ${source.name} n'a pas pu être récupérée. Fais une capture d'écran et dépose-la ici.`);
    }
    const img = await safeFetch(imgUrl.toString(), isImageHost);
    const type = img.headers.get("content-type")?.split(";")[0] ?? "";
    if (!img.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) {
      return fail(`L'image de ce lien ${source.name} n'a pas pu être récupérée. Fais une capture d'écran et dépose-la ici.`);
    }
    const bytes = Buffer.from(await img.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) return fail("L'image de ce lien est trop lourde.", 413);

    return NextResponse.json({
      image: `data:${type};base64,${bytes.toString("base64")}`,
      title,
      notice: ALL_OUTFITS,
    });
  } catch (err) {
    console.error(err);
    return fail(`${source.name} ne répond pas pour l'instant. Réessaie, ou fais une capture d'écran et dépose-la ici.`, 502);
  }
}
