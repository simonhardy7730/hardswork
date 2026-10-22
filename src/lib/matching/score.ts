// Note A→E d'une candidature par rapport à l'offre : RÈGLES SIMPLES, explicables, sans IA et sans coût.
// Seuls les critères pour lesquels on a une info des deux côtés comptent ; si on sait trop peu de choses,
// on n'invente pas de note (« non évalué »). Aide à la décision : le recruteur reste seul juge.
import { findCity, distanceKm } from "@/lib/geo/distance";
import { normalizePlace } from "@/lib/geo/distance";
import { questionsFor } from "@/lib/screening";

export type Grade = "A" | "B" | "C" | "D" | "E";
export interface MatchOffer {
  title: string; sector: string | null; city: string | null;
  required_licenses?: string[] | null; screening_ids?: string[] | null;
  days_needed?: string[] | null; time_slots?: string[] | null;
}
export interface MatchApplication {
  licenses?: string[] | null; has_caces?: boolean | null; caces_types?: string[] | null;
  availability_slots?: string[] | null; screening_answers?: Record<string, boolean> | null;
}
/** Infos du profil candidat lié à la candidature (si elles existent). */
export interface MatchProfile {
  city?: string | null; sectors?: string[] | null; trades?: string[] | null;
  experienceRoles?: string[]; // intitulés de poste du CV créé sur Wolko
}
export interface Criterion { key: string; weight: number; ratio: number; fr: string; nl: string }
export interface MatchResult {
  grade: Grade | null; percent: number | null;
  good: { fr: string; nl: string }[]; check: { fr: string; nl: string }[];
}

const MIN_INFO = 30; // poids minimal de critères évaluables pour oser une note
const STOP = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "au", "aux", "un", "une", "h", "f", "m", "x", "d", "l", "cdi", "cdd", "interim", "int"]);
const words = (s: string) => normalizePlace(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w));
const NO_GO = ["travail_be"]; // réponse « non » = pas de note au-dessus de E

export function scoreApplication(app: MatchApplication, offer: MatchOffer, profile: MatchProfile = {}): MatchResult {
  const cr: Criterion[] = [];
  const good: MatchResult["good"] = [], check: MatchResult["check"] = [];
  let missingRequired = false, noGo = false;

  // 1. Permis / qualifications demandés
  const req = (offer.required_licenses ?? []).filter(Boolean);
  if (req.length) {
    const have = new Set([...(app.licenses ?? []), ...(app.has_caces ? ["CACES"] : [])].map((x) => x.toUpperCase()));
    const ok = req.filter((r) => have.has(r.toUpperCase()));
    const ratio = ok.length / req.length;
    cr.push({ key: "licenses", weight: 25, ratio, fr: "", nl: "" });
    if (ratio === 1) good.push({ fr: `a les permis/qualifications demandés (${req.join(", ")})`, nl: `heeft de gevraagde rijbewijzen/kwalificaties (${req.join(", ")})` });
    else { const miss = req.filter((r) => !have.has(r.toUpperCase())); check.push({ fr: `permis/qualifications manquants : ${miss.join(", ")}`, nl: `ontbrekende rijbewijzen/kwalificaties: ${miss.join(", ")}` }); if (ratio === 0) missingRequired = true; }
  }

  // 2. Questions de présélection
  const qs = questionsFor(offer.screening_ids);
  const ans = app.screening_answers ?? null;
  if (qs.length && ans) {
    const answered = qs.filter((q) => typeof ans[q.id] === "boolean");
    if (answered.length) {
      const yes = answered.filter((q) => ans[q.id]);
      cr.push({ key: "screening", weight: 25, ratio: yes.length / answered.length, fr: "", nl: "" });
      if (yes.length === answered.length) good.push({ fr: `répond « oui » aux ${answered.length} questions de présélection`, nl: `antwoordt “ja” op alle ${answered.length} voorselectievragen` });
      else {
        const no = answered.filter((q) => !ans[q.id]);
        check.push({ fr: `répond « non » à : ${no.map((q) => q.fr.replace(/\s*\?$/, "")).join(" ; ")}`, nl: `antwoordt “nee” op: ${no.map((q) => q.nl.replace(/\s*\?$/, "")).join("; ")}` });
        if (no.some((q) => NO_GO.includes(q.id))) noGo = true;
      }
    }
  }

  // 3. Disponibilité vs jours/créneaux demandés
  const days = (offer.days_needed ?? []).filter(Boolean), slots = (offer.time_slots ?? []).filter(Boolean);
  const av = app.availability_slots ?? [];
  if ((days.length || slots.length) && av.length) {
    const wanted = days.length && slots.length ? days.flatMap((d) => slots.map((s) => `${d}:${s}`)) : null;
    let ratio: number;
    if (wanted) ratio = wanted.filter((w) => av.includes(w)).length / wanted.length;
    else if (days.length) ratio = days.filter((d) => av.some((a) => a.startsWith(`${d}:`))).length / days.length;
    else ratio = slots.filter((s) => av.some((a) => a.endsWith(`:${s}`))).length / slots.length;
    cr.push({ key: "availability", weight: 20, ratio, fr: "", nl: "" });
    if (ratio >= 0.99) good.push({ fr: "disponible sur tous les jours/créneaux demandés", nl: "beschikbaar op alle gevraagde dagen/momenten" });
    else if (ratio >= 0.5) check.push({ fr: "disponible sur une partie des jours/créneaux demandés", nl: "beschikbaar op een deel van de gevraagde dagen/momenten" });
    else check.push({ fr: "peu de disponibilités en commun avec les horaires demandés", nl: "weinig overlap met de gevraagde uren" });
  }

  // 4. Proximité
  if (profile.city && offer.city) {
    const a = findCity(profile.city), b = findCity(offer.city);
    if (a && b) {
      const km = Math.round(distanceKm(a, b));
      const ratio = km <= 15 ? 1 : km <= 30 ? 0.7 : km <= 50 ? 0.4 : 0.1;
      cr.push({ key: "distance", weight: 15, ratio, fr: "", nl: "" });
      if (km <= 15) good.push({ fr: `habite à proximité (${profile.city}, ~${km} km)`, nl: `woont dichtbij (${profile.city}, ~${km} km)` });
      else check.push({ fr: `habite à environ ${km} km (${profile.city})`, nl: `woont op ongeveer ${km} km (${profile.city})` });
    }
  }

  // 5. Métier / secteur
  const t = words(offer.title);
  const roles = (profile.experienceRoles ?? []).filter(Boolean);
  const roleHit = roles.some((r) => words(r).some((w) => t.includes(w)));
  const tradeHit = (profile.trades ?? []).some((k) => t.some((w) => normalizePlace(k.replace(/_/g, " ")).includes(w)));
  const sectorHit = !!offer.sector && (profile.sectors ?? []).includes(offer.sector);
  if (roles.length || (profile.sectors ?? []).length || (profile.trades ?? []).length) {
    const ratio = roleHit ? 1 : tradeHit ? 0.9 : sectorHit ? 0.6 : roles.length ? 0.25 : 0.2;
    cr.push({ key: "fit", weight: 15, ratio, fr: "", nl: "" });
    if (roleHit) good.push({ fr: "son CV mentionne une expérience dans un poste proche", nl: "zijn cv vermeldt ervaring in een gelijkaardige functie" });
    else if (tradeHit) good.push({ fr: "recherche précisément ce métier", nl: "zoekt precies dit beroep" });
    else if (sectorHit) good.push({ fr: "cherche dans ce secteur", nl: "zoekt in deze sector" });
    else check.push({ fr: "métier/secteur recherché différent de l'offre", nl: "gezocht beroep/sector wijkt af van de vacature" });
  }

  const total = cr.reduce((s, c) => s + c.weight, 0);
  if (total < MIN_INFO) return { grade: null, percent: null, good, check };
  let percent = Math.round((cr.reduce((s, c) => s + c.weight * c.ratio, 0) / total) * 100);
  if (missingRequired) percent = Math.min(percent, 49); // aucun des permis demandés : pas mieux que D
  if (noGo) percent = Math.min(percent, 20);
  const grade: Grade = percent >= 80 ? "A" : percent >= 65 ? "B" : percent >= 50 ? "C" : percent >= 35 ? "D" : "E";
  return { grade, percent, good, check };
}

/** Phrase de synthèse (FR/NL). */
export function summarize(m: MatchResult, lang: "fr" | "nl", name?: string): string {
  const pick = (x: { fr: string; nl: string }) => (lang === "nl" ? x.nl : x.fr);
  if (!m.grade) return lang === "nl" ? "Te weinig informatie om een score te geven." : "Pas assez d'informations pour attribuer une note.";
  const who = name?.trim() || (lang === "nl" ? "De kandidaat" : "Le candidat");
  const parts: string[] = [];
  if (m.good.length) parts.push(`${who} ${m.good.map(pick).join(lang === "nl" ? "; " : " ; ")}.`);
  if (m.check.length) parts.push(`${lang === "nl" ? "Te controleren" : "À vérifier"} : ${m.check.map(pick).join(lang === "nl" ? "; " : " ; ")}.`);
  return parts.join(" ");
}

export const GRADE_LABEL: Record<Grade, { fr: string; nl: string }> = {
  A: { fr: "Très bon profil", nl: "Zeer goed profiel" }, B: { fr: "Bon profil", nl: "Goed profiel" },
  C: { fr: "Correct", nl: "Redelijk" }, D: { fr: "Partiel", nl: "Gedeeltelijk" }, E: { fr: "Peu adapté", nl: "Weinig geschikt" },
};
