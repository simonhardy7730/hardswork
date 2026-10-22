// Lecture GRATUITE du texte des CV (PDF avec texte, Word). Pas d'IA, pas d'OCR : une photo ou un scan reste « non lu ».
// Le texte est mis en cache (table cv_text_cache, serveur uniquement) pour ne lire chaque fichier qu'une fois.
import { createClient as createAdmin } from "@supabase/supabase-js";
import { asCv, type CvData } from "@/lib/candidate/cv";

const BUCKET = "candidate-documents";
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_CHARS = 20000;
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

/** Texte d'un CV déjà déposé (chemin du bucket). null = lecture impossible pour l'instant (on réessaiera). */
export async function cvTextFor(path: string, limitNew: { left: number }): Promise<string | null> {
  const db = admin();
  const { data: hit } = await db.from("cv_text_cache").select("body").eq("path", path).maybeSingle();
  if (hit) return (hit.body as string) || null;
  if (limitNew.left <= 0) return null; // on étale les lectures : pas plus de quelques nouveaux fichiers par affichage
  limitNew.left--;
  try {
    const { data: file, error } = await db.storage.from(BUCKET).download(path);
    if (error || !file) return null;
    if (file.size > MAX_BYTES) { await db.from("cv_text_cache").upsert({ path, body: "" }); return null; }
    const text = (await extractText(Buffer.from(await file.arrayBuffer()), path)).replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
    await db.from("cv_text_cache").upsert({ path, body: text });
    return text || null;
  } catch (e) {
    console.error("cvTextFor:", (e as Error).message);
    return null;
  }
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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

/** Ce qu'on retient du texte d'un CV : rien d'autre que des correspondances simples avec l'offre. */
export function analyzeCv(text: string, requiredLicenses: string[], titleWords: string[], sector?: string | null) {
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
  return { licenses, titleHits, sectorHits, years };
}
