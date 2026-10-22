// Complétion du profil candidat : calculée à partir des données réelles, jamais codée en dur.
// Seules les informations utiles aux recruteurs comptent. Une candidature déposée n'est PAS un critère.
// Les champs non pertinents pour la situation du candidat sont écartés du calcul (ni points, ni pénalité).

export interface CompletionInput {
  fullName: string;
  phone: string | null;
  city: string | null;
  sectors: string[];
  trades: string[];
  tradeOther: string | null;
  jobTypes: string[];
  experienceYears: number | null;
  isStudent: boolean;
  licenses: string[];
  hasCaces: boolean;
  /** Nombre de créneaux hebdomadaires de disponibilité renseignés (jours/plages) */
  recurringSlots: number;
  hasCv: boolean;
}

export type CompletionKey = "identity" | "city" | "trades" | "jobTypes" | "availability" | "experience" | "licenses" | "cv";

export interface CompletionItem {
  key: CompletionKey;
  done: boolean;
  weight: number;
  /** Où le compléter */
  href: string;
}

/** Secteurs où permis / qualifications sont couramment demandés : ailleurs, ce champ n'est pas pénalisant. */
const LICENSE_SECTORS = ["transport", "logistique", "construction", "industrie"];

export function completionItems(i: CompletionInput): CompletionItem[] {
  const items: CompletionItem[] = [
    { key: "identity", done: !!i.fullName.trim() && !!(i.phone ?? "").trim(), weight: 10, href: "/candidat/compte" },
    { key: "city", done: !!(i.city ?? "").trim(), weight: 15, href: "/candidat/compte" },
    { key: "trades", done: i.trades.length > 0 || i.sectors.length > 0 || !!(i.tradeOther ?? "").trim(), weight: 20, href: "/candidat/compte" },
    { key: "jobTypes", done: i.jobTypes.length > 0, weight: 10, href: "/candidat/compte" },
    { key: "availability", done: i.recurringSlots > 0, weight: 10, href: "/candidat/compte" },
    { key: "cv", done: i.hasCv, weight: 25, href: "/candidat/cv" },
  ];
  // Expérience : pas demandée à un étudiant (premier job) ; renseignée dès que la valeur existe (0 an = premier emploi).
  if (!i.isStudent) items.push({ key: "experience", done: i.experienceYears !== null, weight: 5, href: "/candidat/compte" });
  // Permis / qualifications : seulement si le candidat vise un secteur où cela compte.
  if (i.sectors.some((s) => LICENSE_SECTORS.includes(s))) {
    items.push({ key: "licenses", done: i.licenses.length > 0 || i.hasCaces, weight: 5, href: "/candidat/compte" });
  }
  return items;
}

export function profileCompletion(i: CompletionInput): { percent: number; items: CompletionItem[]; missing: CompletionItem[] } {
  const items = completionItems(i);
  const total = items.reduce((s, x) => s + x.weight, 0);
  const got = items.filter((x) => x.done).reduce((s, x) => s + x.weight, 0);
  return { percent: total ? Math.round((got / total) * 100) : 0, items, missing: items.filter((x) => !x.done) };
}

export const COMPLETION_LABEL: Record<CompletionKey, { fr: string; nl: string; add: { fr: string; nl: string } }> = {
  identity:     { fr: "Nom et téléphone", nl: "Naam en telefoon", add: { fr: "ton téléphone", nl: "je telefoonnummer" } },
  city:         { fr: "Ville", nl: "Stad", add: { fr: "ta ville", nl: "je stad" } },
  trades:       { fr: "Métiers recherchés", nl: "Gezochte beroepen", add: { fr: "tes métiers recherchés", nl: "je gezochte beroepen" } },
  jobTypes:     { fr: "Type de contrat recherché", nl: "Gezocht contracttype", add: { fr: "le type de contrat que tu cherches", nl: "het contracttype dat je zoekt" } },
  availability: { fr: "Jours et horaires disponibles", nl: "Beschikbare dagen en uren", add: { fr: "tes jours disponibles", nl: "je beschikbare dagen" } },
  experience:   { fr: "Expérience", nl: "Ervaring", add: { fr: "ton expérience", nl: "je ervaring" } },
  licenses:     { fr: "Permis et qualifications", nl: "Rijbewijzen en kwalificaties", add: { fr: "tes permis et qualifications", nl: "je rijbewijzen en kwalificaties" } },
  cv:           { fr: "CV", nl: "Cv", add: { fr: "ton CV", nl: "je cv" } },
};
