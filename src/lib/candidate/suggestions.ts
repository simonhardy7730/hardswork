// Offres suggérées : règles SIMPLES et EXPLICABLES (aucun score artificiel, aucune IA).
// Une offre est proposée seulement si elle correspond au profil sur au moins un critère « de fond »
// (métier, secteur ou proximité). Les contrats et la dispo ne servent qu'à classer, jamais à inventer une correspondance.
import { citiesWithin, normalizePlace } from "@/lib/geo/distance";
import { TRADES } from "@/lib/candidate/trades";

export type Reason = "trade" | "sector" | "near" | "contract";

export interface ProfileForMatch {
  city: string | null;
  sectors: string[];
  trades: string[];
  jobTypes: string[];
}
export interface OfferForMatch { id: string; title: string; sector: string | null; city: string | null; contract_type: string | null }
export interface Suggestion<T extends OfferForMatch> { offer: T; reasons: Reason[] }

/** Clés de préférence → types de contrat d'offre qui leur correspondent (étudiant / flexi / autre : aucun type d'offre associé). */
const CONTRACTS_FOR: Record<string, string[]> = {
  cdi_cdd: ["cdi", "cdd", "interim_cdi"],
  interim: ["interim", "interim_cdi"],
  stage: ["apprentissage"],
};

const norm = (s: string) => normalizePlace(s);

export function matchReasons(p: ProfileForMatch, o: OfferForMatch, nearCities: Set<string> | null): Reason[] {
  const reasons: Reason[] = [];
  const title = norm(o.title ?? "");
  const tradeHit = p.trades.some((k) => {
    const t = TRADES.find((x) => x.key === k);
    if (!t) return false;
    const label = norm(t.fr.split("/")[0]);
    return label.length >= 4 && title.includes(label);
  });
  if (tradeHit) reasons.push("trade");
  if (o.sector && p.sectors.includes(o.sector)) reasons.push("sector");
  if (nearCities && o.city && nearCities.has(norm(o.city))) reasons.push("near");
  const wanted = p.jobTypes.flatMap((k) => CONTRACTS_FOR[k] ?? []);
  if (o.contract_type && wanted.includes(o.contract_type)) reasons.push("contract");
  return reasons;
}

const WEIGHT: Record<Reason, number> = { trade: 4, sector: 2, near: 2, contract: 1 };

/** Rayon de « proximité » utilisé pour les suggestions (même valeur que les pages emploi par ville). */
export const NEAR_KM = 15;

export function suggestOffers<T extends OfferForMatch>(p: ProfileForMatch, offers: T[], limit = 4): Suggestion<T>[] {
  const near = p.city ? citiesWithin(p.city, NEAR_KM) : null;
  const nearSet = p.city ? new Set<string>([norm(p.city), ...(near?.names ?? []).map(norm)]) : null;
  const out: (Suggestion<T> & { score: number; i: number })[] = [];
  offers.forEach((offer, i) => {
    const reasons = matchReasons(p, offer, nearSet);
    // Pas de correspondance « de fond » (métier, secteur ou proximité) : on ne suggère pas.
    if (!reasons.some((r) => r === "trade" || r === "sector" || r === "near")) return;
    out.push({ offer, reasons, score: reasons.reduce((s, r) => s + WEIGHT[r], 0), i });
  });
  // Meilleure correspondance d'abord ; à égalité, l'ordre d'arrivée (offres déjà triées de la plus récente à la plus ancienne).
  out.sort((a, b) => b.score - a.score || a.i - b.i);
  return out.slice(0, limit).map(({ offer, reasons }) => ({ offer, reasons }));
}

/** Le profil contient-il de quoi personnaliser (sinon on n'affiche pas de « suggestions », seulement les offres récentes) ? */
export const canPersonalize = (p: ProfileForMatch) => !!(p.city || p.sectors.length || p.trades.length);

export const REASON_LABEL: Record<Reason, { fr: string; nl: string }> = {
  trade: { fr: "Ton métier", nl: "Jouw beroep" },
  sector: { fr: "Ton secteur", nl: "Jouw sector" },
  near: { fr: "Près de chez toi", nl: "Dicht bij jou" },
  contract: { fr: "Contrat qui te correspond", nl: "Passend contract" },
};
