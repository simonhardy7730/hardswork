/**
 * Version démo 100 % navigateur : le vrai site (même interface, mêmes calculs).
 * - /api/analyze : la photo est VRAIMENT analysée par Claude, via la capacité `sample`
 *   de la page publiée (mêmes consignes que le site). Si la page ne peut pas envoyer
 *   d'image mais peut envoyer du texte, l'utilisateur décrit la pièce et Claude
 *   analyse la description. Sinon, on retombe sur l'analyse d'exemple, en disant pourquoi.
 * - /api/search : exécutée dans la page, en mode démo (offres d'exemple construites
 *   à partir de la pièce, liens vers une vraie recherche Google Shopping).
 */
import { createRoot } from "react-dom/client";
import { z } from "zod";
import Home from "@/app/page";
import { POST as analyzeDemo } from "@/app/api/analyze/route";
import { POST as search } from "@/app/api/search/route";
import { SYSTEM_PROMPT, tidy } from "@/lib/analyze";
import { PhotoAnalysisSchema, type AnalyzeResponse } from "@/lib/types";

type SampleFn = {
  json: (input: string, options?: { images?: Blob }) => Promise<unknown>;
  limits: () => Promise<{ images?: unknown }>;
};
type ClaudeRuntime = { use: (name: string) => Promise<unknown> };

const SCHEMA = JSON.stringify(z.toJSONSchema(PhotoAnalysisSchema));

const OPEN_IN_BROWSER = "Ouvre le lien dans un navigateur (Chrome ou Safari, sur claude.ai), connecté à ton compte Claude, puis réessaie.";

/** La capacité « sample » (avec ou sans images), ou la raison pour laquelle elle manque. */
type SampleAccess = { sample: SampleFn; images: boolean; reason?: undefined } | { sample: null; reason: string };

let accessPromise: Promise<SampleAccess> | null = null;
function getSample(): Promise<SampleAccess> {
  const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude;
  if (!runtime) {
    return Promise.resolve({ sample: null, reason: `La page est ouverte en dehors de Claude. ${OPEN_IN_BROWSER}` });
  }
  accessPromise ??= (runtime.use("sample") as Promise<SampleFn | null>)
    .then(async (s): Promise<SampleAccess> => {
      if (!s) {
        return { sample: null, reason: `Cette application ne laisse pas encore la page utiliser Claude. ${OPEN_IN_BROWSER}` };
      }
      const limits = await s.limits().catch(() => null);
      return { sample: s, images: Boolean(limits?.images) };
    })
    .catch(() => ({ sample: null, reason: `Claude n'a pas répondu. ${OPEN_IN_BROWSER}` }));
  return accessPromise;
}

/** L'analyse d'exemple, avec la raison affichée à l'utilisateur. */
async function exampleWithNotice(req: Request, notice: string, canDescribe = false): Promise<Response> {
  const res = await analyzeDemo(req);
  if (!res.ok) return res;
  return json({ ...((await res.json()) as AnalyzeResponse), notice, canDescribe });
}

const NO_IMAGES =
  "Depuis cette page, ton compte Claude ne permet pas encore d'envoyer une photo. Décris-la en une phrase ci-dessous : Claude l'analysera à partir de ta description.";

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(",");
  const type = /data:([^;]+)/.exec(head)?.[1] ?? "image/jpeg";
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type });
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function analyze(req: Request): Promise<Response> {
  const body = (await req.clone().json()) as { image?: string; hint?: string };
  const access = await getSample();
  if (!access.sample) return exampleWithNotice(req, access.reason);
  const sample = access.sample;
  if (!body.image) return analyzeDemo(req);

  const hint = body.hint?.trim().slice(0, 600);
  // Pas d'image possible : sans description, on la demande ; avec, on l'analyse.
  if (!access.images && !hint) return exampleWithNotice(req, NO_IMAGES, true);

  const source = access.images
    ? `L'image jointe est la photo envoyée par l'utilisateur.${hint ? ` Précision de l'utilisateur : ${hint}` : ""}`
    : `L'utilisateur n'a pas pu t'envoyer sa photo. Voici sa description de ce qu'elle montre : « ${hint} ».
Travaille à partir de cette description. S'il décrit plusieurs pièces portées ensemble, c'est une tenue (is_outfit = true).
Ne propose une marque que si elle est citée ou si un détail décrit la désigne clairement ; sinon mets null.
Pour "pin", place chaque pièce à sa position habituelle sur une personne debout vue de face
(lunettes y≈0.1, haut et veste y≈0.3 à 0.4, montre ou sac y≈0.5, pantalon y≈0.65, chaussures y≈0.93 ; x≈0.5).`;

  const prompt = `${SYSTEM_PROMPT}

${source}

Réponds uniquement avec un objet JSON conforme à ce schéma JSON (tous les champs sont obligatoires) :
${SCHEMA}`;

  try {
    const raw = await sample.json(prompt, access.images ? { images: dataUrlToBlob(body.image) } : undefined);
    const parsed = PhotoAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: "L'analyse n'a pas donné un résultat lisible. Réessaie, ou essaie une photo plus nette." }, 500);
    }
    const analysis = tidy(parsed.data);
    if (!analysis.contains_fashion || analysis.items.length === 0) {
      return json({ error: "On ne voit pas d'article de mode sur cette photo. Essaie de cadrer la pièce." }, 422);
    }
    return json({
      items: analysis.items,
      isOutfit: analysis.is_outfit && analysis.items.length > 1,
      demo: false,
      notice: access.images ? undefined : "Analyse faite par Claude à partir de ta description (la photo n'a pas pu lui être envoyée).",
    } satisfies AnalyzeResponse);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    // Pas d'autorisation, ou Claude indisponible dans cette vue : on montre l'exemple, en disant pourquoi.
    if (code === "not_granted") {
      return exampleWithNotice(req, "L'autorisation d'utiliser Claude n'a pas été donnée. Recharge la page, envoie une photo et accepte la demande d'autorisation.");
    }
    if (code === "sampling_disabled") {
      return exampleWithNotice(req, "Claude n'est pas disponible pour les pages publiées sur ton compte (ou ton organisation).");
    }
    if (code === "images_unavailable") return exampleWithNotice(req, NO_IMAGES, true);
    if (["not_declared", "capability_disabled", "capability_removed"].includes(code ?? "")) {
      return exampleWithNotice(req, `Cette vue ne permet pas d'utiliser Claude. ${OPEN_IN_BROWSER}`);
    }
    const messages: Record<string, string> = {
      rate_limited: "Trop de photos d'un coup : attends un peu avant de réessayer.",
      image_rejected: "Cette image n'a pas pu être lue. Essaie une autre photo (JPEG ou PNG).",
      refused: "Cette photo n'a pas pu être analysée. Essaie une autre photo.",
      invalid_json: "L'analyse n'a pas donné un résultat lisible. Réessaie.",
      session_expired: "Ta session a expiré : reconnecte-toi à Claude puis réessaie.",
    };
    return json({ error: messages[code ?? ""] ?? "L'analyse n'a pas abouti. Réessaie dans un instant." }, 500);
  }
}

const ROUTES: Record<string, (req: Request) => Promise<Response>> = {
  "/api/analyze": analyze,
  "/api/search": search,
};

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
  const route = ROUTES[url];
  if (!route) return realFetch(input, init);
  if (url === "/api/search") await new Promise((r) => setTimeout(r, 600)); // comme une vraie recherche
  return route(new Request(`https://demo.sosilook${url}`, init));
};

// Prépare la capacité dès le chargement (ne demande rien à l'utilisateur).
void getSample();

createRoot(document.getElementById("sosilook-root")!).render(<Home />);
