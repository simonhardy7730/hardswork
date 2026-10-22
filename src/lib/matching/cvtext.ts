// Lecture GRATUITE du texte des CV (PDF avec texte, Word). Pas d'IA, pas d'OCR : une photo ou un scan reste « non lu ».
// Le texte est mis en cache (table cv_text_cache, serveur uniquement) pour ne lire chaque fichier qu'une fois.
import { createClient as createAdmin } from "@supabase/supabase-js";
import { asCv, type CvData } from "@/lib/candidate/cv";

const BUCKET = "candidate-documents";
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_CHARS = 20000;
export const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const admin = () => createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

/** CV structuré (créé sur Wolko ou mini-CV du formulaire) → texte à analyser comme un CV déposé. */
export function cvToText(cv: CvData): string {
  return [cv.headline, cv.summary, ...cv.experiences.flatMap((e) => [e.role, e.company, e.details]), ...cv.education.flatMap((e) => [e.title, e.school]), ...cv.skills].filter(Boolean).join(". ");
}

export async function extractText(buf: Buffer, name: string): Promise<string> {
  const n = name.toLowerCase();
  if (n.endsWith(".wolko.json")) { // mini-CV créé en postulant (« je n'ai pas de CV »)
    try { const d = JSON.parse(buf.toString("utf8")) as { cv?: unknown }; return cvToText(asCv(d?.cv)); } catch { return ""; }
  }
  if (n.endsWith(".pdf")) {
    const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await pdfText(pdf, { mergePages: true });
    return String(text ?? "");
  }
  if (n.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value ?? "";
  }
  return ""; // .doc ancien, photos, etc. : non lisibles gratuitement
}

export type CvRead = { state: "ok"; text: string } | { state: "empty" } | { state: "pending" } | { state: "error" };
const tidy = (t: string) => t.replace(/[ \t\u00a0]+/g, " ").replace(/\s*\n\s*/g, "\n").trim().slice(0, MAX_CHARS);

/** Texte d'un CV déjà déposé (chemin du bucket). empty = fichier sans texte (photo, scan) ; pending = pas encore lu (on réessaiera). */
export async function cvTextFor(path: string, limitNew: { left: number }): Promise<CvRead> {
  const db = admin();
  const { data: hit } = await db.from("cv_text_cache").select("body").eq("path", path).maybeSingle();
  if (hit) return (hit.body as string) ? { state: "ok", text: hit.body as string } : { state: "empty" };
  if (limitNew.left <= 0) return { state: "pending" }; // on étale les lectures : pas plus de quelques nouveaux fichiers par affichage
  limitNew.left--;
  try {
    const { data: file, error } = await db.storage.from(BUCKET).download(path);
    if (error || !file) return { state: "error" };
    if (file.size > MAX_BYTES) { await db.from("cv_text_cache").upsert({ path, body: "" }); return { state: "empty" }; }
    const text = tidy(await extractText(Buffer.from(await file.arrayBuffer()), path));
    await db.from("cv_text_cache").upsert({ path, body: text });
    return text ? { state: "ok", text } : { state: "empty" };
  } catch (e) {
    console.error("cvTextFor:", (e as Error).message);
    return { state: "error" };
  }
}

/** Mots-clés par secteur (valeurs de l'enum sector) : « le CV parle de ce domaine », sans prétendre que c'est le même poste. */
export const SECTOR_KEYWORDS: Record<string, string[]> = {
  nettoyage: ["nettoy", "entretien", "menage", "hygiene", "autolaveuse", "lavage", "proprete", "schoonmaak"],
  logistique: ["cariste", "entrepot", "picking", "magasin", "preparat", "manutention", "expedition", "stock", "logisti"],
  transport: ["chauffeur", "livraison", "camion", "transport", "tournee", "ADR".toLowerCase()],
  construction: ["batiment", "chantier", "macon", "peintre", "electricien", "plomb", "carrel", "menuisier", "couvreur", "echafaud"],
  industrie: ["production", "usine", "operateur", "soudure", "machine", "montage", "ligne de", "conducteur de"],
  securite: ["gardiennage", "securite", "agent de", "surveillance", "controle d'acces"],
  medical: ["infirm", "aide soignant", "soins", "patient", "maison de repos", "aide-soignant"],
  commerce: ["vente", "vendeu", "caisse", "magasin", "client", "rayon", "commerc"],
  horeca: ["restaurant", "serveu", "cuisin", "bar", "hotel", "horeca", "plongeur", "commis"],
  administratif: ["administrat", "secretar", "accueil", "bureau", "encodage", "facturation", "comptab", "saisie", "call center", "assistante"],
};

export type CvExp = { role: string; from: string; to: string; months: number; rel: "same" | "domain" | "other" };

const MONTHS_PARSE = /(\d{1,2})[\/.](\d{4})|\b(19\d{2}|20\d{2})\b/;
const END_WORDS = /aujourd['’]?\s*hui|actuel(?:lement)?|present|présent|ce jour|en cours|heden|nu/i;
const RANGE = /(?:du\s+|de\s+|depuis\s+|van\s+)?((?:\d{1,2}[\/.])?(?:19|20)\d{2})\s*(?:à|a|au|-|–|—|->|tot|till)\s*(aujourd['’]?\s*hui|actuel(?:lement)?|pr[ée]sent|ce jour|en cours|(?:\d{1,2}[\/.])?(?:19|20)\d{2})/gi;

function ym(x: string, now: Date, isEnd: boolean): { y: number; m: number } | null {
  if (END_WORDS.test(x)) return { y: now.getFullYear(), m: now.getMonth() + 1 };
  const m = x.match(MONTHS_PARSE);
  if (!m) return null;
  if (m[1]) return { y: Number(m[2]), m: Math.min(12, Math.max(1, Number(m[1]))) };
  return { y: Number(m[3]), m: isEnd ? 12 : 1 }; // année seule : on prend le cas le plus généreux (année pleine)
}

/** Expériences repérées par leurs dates (« 10/2020 à 09/2025 »), avec leur pertinence pour l'offre. Aucune IA : dates + mots-clés. */
export function parseExperiences(text: string, titleWords: string[], sector: string | null | undefined, now = new Date(), offerKw: { stem: string; word: string }[] = []): CvExp[] {
  const out: CvExp[] = [];
  const kws = SECTOR_KEYWORDS[sector ?? ""] ?? [];
  let m: RegExpExecArray | null;
  RANGE.lastIndex = 0;
  while ((m = RANGE.exec(text)) && out.length < 12) {
    const a = ym(m[1], now, false), b = ym(m[2], now, true);
    if (!a || !b) continue;
    const months = (b.y - a.y) * 12 + (b.m - a.m) + 1;
    if (months < 1 || months > 12 * 45 || a.y < 1965 || a.y > now.getFullYear()) continue;
    // Intitulé : texte avant les dates, sur la même ligne (ou 70 caractères), après la dernière ponctuation forte.
    const before = text.slice(Math.max(0, m.index - 90), m.index);
    const line = before.split("\n").pop() ?? "";
    let role = (line.length > 3 ? line : before).split(/[.;:•|]/).pop()!.replace(/^[\s\-–—]+|[\s\-–—(]+$/g, "").slice(-70).trim();
    if (!role) role = before.split("\n").filter(Boolean).slice(-2).join(" ").trim().slice(-70);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 220);
    const zone = norm(`${role} ${after}`);
    const same = titleWords.some((w) => new RegExp(`(^|[^a-z])${w}`).test(zone));
    const dom = kws.some((w) => zone.includes(w)) || offerKw.filter((k) => new RegExp(`(^|[^a-z])${k.stem}`).test(zone)).length >= 2;
    out.push({ role: role || "—", from: m[1].replace(/^(du|de|depuis|van)\s+/i, ""), to: /^\d/.test(m[2]) ? m[2] : "aujourd'hui", months, rel: same ? "same" : dom ? "domain" : "other" });
  }
  return out;
}

/** Ce qu'on retient du texte d'un CV : rien d'autre que des correspondances simples avec l'offre. */
export function analyzeCv(text: string, requiredLicenses: string[], titleWords: string[], sector?: string | null, now = new Date(), offerKw: { stem: string; word: string }[] = []) {
  const t = norm(text);
  const licenses = requiredLicenses.filter((r) => {
    const k = norm(r).trim();
    if (!k) return false;
    if (k.length <= 2) return new RegExp(`(permis|rijbewijs)\\s*(de\\s*conduire)?\\s*:?\\s*(cat\\w*\\.?\\s*)?${k}(?![a-z0-9])`).test(t);
    return t.includes(k);
  });
  const titleHits = titleWords.filter((w) => new RegExp(`(^|[^a-z])${w}`).test(t));
  const sectorHits = (SECTOR_KEYWORDS[sector ?? ""] ?? []).filter((w) => t.includes(w));
  const m = t.match(/(\d{1,2})\s*(?:ans?|jaar)\s*(?:d['’ ]\s*)?(?:experience|ervaring)/);
  const years = m ? Math.min(40, Number(m[1])) : null;
  const common = offerKw.filter((k) => new RegExp(`(^|[^a-z])${k.stem}`).test(t)).map((k) => k.word).slice(0, 8);
  return { licenses, titleHits, sectorHits, years, common, exps: parseExperiences(text, titleWords, sector, now, offerKw) };
}
