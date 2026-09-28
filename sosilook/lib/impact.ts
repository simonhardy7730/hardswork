import type { Impact, ImpactGrade, Offer, TrustTier } from "./types";

/**
 * Lettre impact ESTIMÉE, de A à E, à partir de ce qu'on sait de l'offre.
 * Chaque point gagné ou perdu est expliqué. Version suivante (voir PLAN.md §3.5) :
 * pays de fabrication de la fiche produit (loi AGEC) et coût environnemental officiel (Écobalyse).
 */
const SIGNALS: Array<{ re: RegExp; pts: number; label: string }> = [
  { re: /recycl/i, pts: 15, label: "Matière recyclée" },
  { re: /\bbio\b|biologique|organic/i, pts: 10, label: "Fibre biologique" },
  { re: /\blin\b|linen|chanvre|hemp/i, pts: 10, label: "Lin ou chanvre : peu d'eau et de pesticides" },
  { re: /made in (france|italy|portugal|spain)|fabriqu[ée] (en|au) (france|italie|portugal|espagne)/i, pts: 10, label: "Fabrication européenne : transport court, normes sociales encadrées" },
  { re: /automatique|automatic|m[ée]canique/i, pts: 5, label: "Montre sans pile" },
  { re: /polyester|acrylique|acrylic|polyamide|nylon/i, pts: -15, label: "Fibres synthétiques : microplastiques au lavage" },
  { re: /\bpu\b|simili|plastique|plastic|faux leather/i, pts: -10, label: "Plastique ou simili-cuir : dérivé du pétrole, se recycle mal" },
];

/** Plateformes d'ultra fast fashion. */
const ULTRA_FAST = ["shein", "temu", "aliexpress", "wish", "joom", "dhgate"];

const GRADES: Array<[number, ImpactGrade]> = [
  [80, "A"],
  [65, "B"],
  [50, "C"],
  [35, "D"],
  [0, "E"],
];

export function estimateImpact(offer: Offer, trust: TrustTier, quality: number, materialHint: string): Impact {
  let points = 50;
  const reasons: string[] = [];
  const add = (pts: number, label: string) => {
    points += pts;
    reasons.push(`${pts > 0 ? "+" : "−"} ${label}`);
  };

  const secondHand = offer.secondHand || trust === "seconde_main_verifiee" || trust === "occasion";
  if (secondHand) add(35, "Seconde main : aucune nouvelle pièce produite");

  const text = `${offer.title} ${materialHint}`;
  for (const s of SIGNALS) if (s.re.test(text)) add(s.pts, s.label);

  const seller = offer.seller.toLowerCase();
  if (ULTRA_FAST.some((p) => seller.includes(p))) add(-25, "Ultra fast fashion : production de masse, pièces jetables");

  if (quality >= 7.5) add(10, "Pièce durable : on la garde longtemps");
  else if (quality <= 4) add(-10, "Qualité faible : risque d'usure rapide");

  points = Math.max(0, Math.min(100, points));
  const grade = GRADES.find(([min]) => points >= min)![1];
  if (reasons.length === 0) reasons.push("Peu d'informations : note neutre en attendant la fiche produit");
  return { grade, points, reasons };
}
