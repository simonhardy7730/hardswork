// Questions de présélection (oui/non) proposées par métier. Les offres stockent seulement les identifiants.
export type ScreeningQ = { id: string; fr: string; nl: string };

export const SCREENING_QUESTIONS: ScreeningQ[] = [
  { id: "permis_b", fr: "Avez-vous le permis B ?", nl: "Heb je rijbewijs B?" },
  { id: "vehicule", fr: "Disposez-vous d'un véhicule ?", nl: "Beschik je over een voertuig?" },
  { id: "caces", fr: "Avez-vous un CACES / certificat de cariste valide ?", nl: "Heb je een geldig heftruckattest?" },
  { id: "travail_be", fr: "Avez-vous le droit de travailler en Belgique ?", nl: "Mag je in België werken?" },
  { id: "horaires", fr: "Acceptez-vous les horaires de pause / week-end / nuit ?", nl: "Aanvaard je ploegen-, weekend- of nachtwerk?" },
  { id: "debout", fr: "Pouvez-vous travailler debout et porter des charges ?", nl: "Kan je urenlang recht staan en lasten dragen?" },
  { id: "experience", fr: "Avez-vous au moins 1 an d'expérience dans ce métier ?", nl: "Heb je minstens 1 jaar ervaring in dit beroep?" },
  { id: "langue", fr: "Parlez-vous suffisamment français ou néerlandais pour travailler ?", nl: "Spreek je voldoende Frans of Nederlands om te werken?" },
  { id: "soudure_tig", fr: "Savez-vous souder en TIG ?", nl: "Kan je TIG-lassen?" },
  { id: "soudure_mig", fr: "Savez-vous souder en MIG/MAG ?", nl: "Kan je MIG/MAG-lassen?" },
  { id: "cariste_frontal", fr: "Conduisez-vous un chariot frontal ?", nl: "Bestuur je een frontheftruck?" },
  { id: "cariste_retractable", fr: "Conduisez-vous un chariot rétractable ?", nl: "Bestuur je een reachtruck?" },
  { id: "adr", fr: "Avez-vous un certificat ADR (matières dangereuses) ?", nl: "Heb je een ADR-attest (gevaarlijke stoffen)?" },
  { id: "chauffeur_cap", fr: "Avez-vous le CAP / certificat d'aptitude professionnelle chauffeur ?", nl: "Heb je het getuigschrift van vakbekwaamheid (code 95)?" },
  { id: "echafaudage", fr: "Avez-vous une formation montage d'échafaudages ?", nl: "Heb je een opleiding steigerbouw?" },
  { id: "securite", fr: "Disposez-vous d'un certificat de sécurité (VCA, secourisme, etc.) ?", nl: "Heb je een veiligheidsattest (VCA, EHBO, ...)?" },
];

const BY_ID = new Map(SCREENING_QUESTIONS.map((q) => [q.id, q]));

/** Suggestions par secteur (valeurs de l'enum sector). */
export const SECTOR_SUGGESTIONS: Record<string, string[]> = {
  logistique: ["caces", "cariste_frontal", "cariste_retractable", "horaires", "debout"],
  transport: ["permis_b", "chauffeur_cap", "adr", "horaires", "travail_be"],
  construction: ["experience", "securite", "echafaudage", "debout", "travail_be"],
  industrie: ["soudure_tig", "soudure_mig", "horaires", "securite", "travail_be"],
  nettoyage: ["horaires", "debout", "vehicule", "travail_be"],
  securite: ["horaires", "securite", "travail_be", "langue"],
  commerce: ["horaires", "langue", "experience", "travail_be"],
  horeca: ["horaires", "debout", "experience", "travail_be"],
  administratif: ["langue", "experience", "permis_b", "travail_be"],
};

export function questionsFor(ids: unknown): ScreeningQ[] {
  if (!Array.isArray(ids)) return [];
  return ids.map((i) => BY_ID.get(String(i))).filter((q): q is ScreeningQ => !!q);
}

/** Ne garde que des identifiants connus (max 5). */
export function sanitizeScreeningIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return Array.from(new Set(ids.map(String))).filter((i) => BY_ID.has(i)).slice(0, 5);
}

/** Réponses { id: true|false } filtrées sur les questions demandées. */
export function sanitizeAnswers(raw: unknown, ids: string[]): Record<string, boolean> | null {
  if (!raw || typeof raw !== "object" || ids.length === 0) return null;
  const out: Record<string, boolean> = {};
  for (const id of ids) {
    const v = (raw as Record<string, unknown>)[id];
    if (typeof v === "boolean") out[id] = v;
  }
  return Object.keys(out).length ? out : null;
}
