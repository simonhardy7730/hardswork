import type { GarmentAnalysis, Mode, Offer, ScoredOffer } from "./types";
import { classifySeller, TRUST_LABELS, TRUST_POINTS, VALUE_BRANDS } from "./retailers";

/**
 * Note qualité (0-10) à partir d'indices vérifiables dans l'annonce.
 * Version 1 volontairement simple et transparente : chaque point gagné ou perdu
 * est expliqué à l'utilisateur. Étape suivante : lire la fiche produit complète
 * (composition exacte, grammage, pays de fabrication) avec Claude.
 */
const MATERIAL_SIGNALS: Array<{ re: RegExp; pts: number; label: string }> = [
  { re: /cachemire|cashmere/i, pts: 2.5, label: "Cachemire" },
  { re: /m[ée]rinos|merino/i, pts: 2, label: "Laine mérinos" },
  { re: /\blin\b|linen/i, pts: 1.5, label: "Lin" },
  { re: /pima|supima|coton [ée]gyptien|egyptian cotton/i, pts: 2, label: "Coton à fibres longues" },
  { re: /100\s?%\s?coton|100\s?%\s?cotton|pur coton/i, pts: 1.5, label: "100 % coton" },
  { re: /coton bio|organic cotton|biologique/i, pts: 1, label: "Coton bio" },
  { re: /\blaine\b|wool/i, pts: 1.2, label: "Laine" },
  { re: /\bcuir\b|leather/i, pts: 1, label: "Cuir" },
  { re: /made in (france|italy|portugal)|fabriqu[ée] en (france|italie|portugal)/i, pts: 1, label: "Fabrication européenne" },
  { re: /cuir pleine fleur|full grain/i, pts: 1.5, label: "Cuir pleine fleur" },
  // Montres
  { re: /automatique|automatic|m[ée]canique/i, pts: 1.5, label: "Mouvement automatique" },
  { re: /saphir|sapphire/i, pts: 1.5, label: "Verre saphir" },
  { re: /316l|acier inoxydable|stainless steel/i, pts: 1, label: "Acier inoxydable" },
  { re: /\b(10|20)\s?atm|\b(100|200)\s?m\b/i, pts: 0.5, label: "Étanchéité sérieuse" },
  // Bijoux
  { re: /or (jaune|blanc|rose)? ?(18|14|9)\s?(k|carats?)|\b750\b/i, pts: 2, label: "Or massif" },
  { re: /argent (massif|925)|sterling|\b925\b/i, pts: 1.5, label: "Argent 925" },
  { re: /plaqu[ée] or|gold plated|dor[ée] à l'or fin/i, pts: -0.5, label: "Plaqué or (s'use avec le temps)" },
  { re: /alliage|zinc|laiton non trait/i, pts: -1, label: "Métal bas de gamme" },
  // Lunettes
  { re: /polaris/i, pts: 1, label: "Verres polarisés" },
  { re: /uv\s?400|100\s?%\s?uv|cat[ée]gorie\s?3/i, pts: 1, label: "Protection UV complète" },
  { re: /ac[ée]tate|titane|titanium/i, pts: 1, label: "Monture acétate / titane" },
  // Signaux négatifs
  { re: /polyester|acrylique|acrylic/i, pts: -1.5, label: "Contient des fibres synthétiques" },
  { re: /\bpu\b|simili|faux leather/i, pts: -1, label: "Simili-cuir" },
];


const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function qualityOf(offer: Offer): { score: number; reasons: string[] } {
  let score = 5;
  const reasons: string[] = [];
  const text = `${offer.title} ${offer.seller}`;

  for (const s of MATERIAL_SIGNALS) {
    if (s.re.test(text)) {
      score += s.pts;
      reasons.push(`${s.pts > 0 ? "+" : "−"} ${s.label}`);
    }
  }
  const t = norm(text);
  // Mot entier : évite que "cos" matche "costume" ou "lip" matche "slip".
  const hasWord = (w: string) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}([^a-z]|$)`).test(t);
  if (VALUE_BRANDS.some(hasWord)) {
    score += 1.2;
    reasons.push("+ Marque réputée pour sa qualité");
  }
  if (offer.rating && offer.reviews && offer.reviews >= 20) {
    const bonus = (offer.rating - 3.5) * 1.2;
    score += bonus;
    reasons.push(`${bonus >= 0 ? "+" : "−"} Avis clients ${offer.rating.toFixed(1)}/5 (${offer.reviews})`);
  }
  if (reasons.length === 0) reasons.push("Peu d'infos sur la matière : vérifie la composition sur la fiche");
  return { score: clamp(score, 0, 10), reasons };
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function scoreOffers(offers: Offer[], analysis: GarmentAnalysis, mode: Mode): ScoredOffer[] {
  const brand = analysis.brand.name;
  const retail = analysis.estimated_retail_price_eur;
  const prices = offers.map((o) => o.price).filter((p): p is number => p != null && p > 0);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const scored = offers.map((offer): ScoredOffer => {
    const { tier, highRisk } = classifySeller(offer.seller, brand);
    const { score: quality, reasons } = qualityOf(offer);
    const warnings: string[] = [];

    const priceScore =
      offer.price == null || prices.length < 2 || maxP === minP
        ? 5
        : 10 - ((offer.price - minP) / (maxP - minP)) * 10;

    const savingsPct = retail && offer.price ? Math.round((1 - offer.price / retail) * 100) : null;

    if (mode === "exact" && brand) {
      if (highRisk) warnings.push("Plateforme où les contrefaçons sont fréquentes");
      if (tier === "a_verifier" && retail && offer.price && offer.price < retail * 0.4) {
        warnings.push("Prix anormalement bas pour une pièce neuve de cette marque : risque de faux");
      }
      if (tier === "occasion") warnings.push("Vente entre particuliers : demande photos de l'étiquette et facture");
    }

    const trustPts = TRUST_POINTS[tier];
    // Mode exact : la fiabilité du vendeur pèse lourd. Mode style : la qualité et le prix priment.
    const overall =
      mode === "exact"
        ? 0.5 * trustPts + 0.4 * priceScore + 0.1 * quality
        : 0.45 * quality + 0.35 * priceScore + 0.2 * trustPts;

    return {
      ...offer,
      trust: tier,
      trustLabel: TRUST_LABELS[tier],
      quality: round1(quality),
      qualityReasons: reasons,
      priceScore: round1(priceScore),
      overall: round1(overall - (warnings.length ? 1.5 : 0)),
      savingsPct,
      warnings,
    };
  });

  return scored.sort((a, b) => b.overall - a.overall);
}
