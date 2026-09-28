import type { GarmentAnalysis, Mode, Offer } from "./types";

/**
 * Données d'EXEMPLE utilisées quand les clés API ne sont pas configurées.
 * Elles servent à montrer le fonctionnement du site ; l'interface les signale clairement.
 * Les liens pointent vers une recherche Google Shopping, pas vers de fausses fiches produit.
 */
export const DEMO_ANALYSIS: GarmentAnalysis = {
  is_fashion_item: true,
  universe: "vetement",
  category: "polo",
  title: "Polo piqué blanc à logo crocodile",
  description:
    "Polo manches courtes en coton piqué, col côtelé et patte à deux boutons. Petit logo brodé sur la poitrine, coupe classique droite.",
  brand: {
    name: "Lacoste",
    confidence: "haute",
    clues: "Crocodile vert brodé côté cœur, patte de boutonnage à deux boutons nacrés",
  },
  model_guess: "L.12.12",
  colors: ["blanc"],
  material_guess: "coton piqué",
  fit: "classique",
  style_tags: ["classique", "preppy", "old money", "casual chic"],
  estimated_retail_price_eur: 110,
  exact_query: "polo Lacoste L.12.12 blanc homme",
  style_queries: [
    "polo piqué 100% coton blanc homme coupe classique",
    "polo maille piquée blanc col côtelé homme",
    "polo blanc coton épais manches courtes homme",
  ],
  quality_checklist: [
    "Composition 100 % coton (idéalement coton à fibres longues), sans polyester",
    "Maille piquée épaisse et serrée (≈ 200 g/m² ou plus)",
    "Col côtelé qui garde sa forme, boutons cousus solidement",
  ],
};

const shop = (q: string) => `https://www.google.com/search?tbm=shop&hl=fr&gl=fr&q=${encodeURIComponent(q)}`;

export function demoOffers(analysis: GarmentAnalysis, mode: Mode): Offer[] {
  const q = mode === "exact" ? analysis.exact_query : analysis.style_queries[0];
  const base = (id: string, title: string, seller: string, price: number, extra: Partial<Offer> = {}): Offer => ({
    id,
    title,
    seller,
    price,
    currency: "EUR",
    url: shop(`${title} ${seller}`),
    origin: mode,
    ...extra,
  });

  if (mode === "exact") {
    return [
      base("e1", "Polo Lacoste L.12.12 classic fit coton piqué blanc", "Lacoste", 110, { rating: 4.6, reviews: 2140 }),
      base("e2", "Lacoste polo L.12.12 blanc 100% coton", "Galeries Lafayette", 110),
      base("e3", "Lacoste L.12.12 polo coton piqué blanc", "Zalando", 94.95, { rating: 4.5, reviews: 380 }),
      base("e4", "Polo Lacoste L1212 blanc", "Place des Tendances", 88),
      base("e5", "Polo Lacoste L.12.12 blanc taille 4 — très bon état", "Vestiaire Collective", 49, { secondHand: true }),
      base("e6", "Polo Lacoste blanc L.12.12 T.M porté 2 fois", "Vinted", 32, { secondHand: true }),
      base("e7", "Polo crocodile blanc homme coton", "AliExpress", 16.5),
    ].map((o) => ({ ...o, url: o.url || shop(q) }));
  }

  return [
    base("s1", "Polo piqué Supima 100% coton blanc", "Uniqlo", 24.9, { rating: 4.5, reviews: 910 }),
    base("s2", "Polo en maille piquée 100% coton bio blanc", "Arket", 45, { rating: 4.4, reviews: 120 }),
    base("s3", "Polo coton piqué épais blanc — fabriqué au Portugal", "Asphalte", 59),
    base("s4", "Polo manches courtes coton piqué blanc", "Massimo Dutti", 39.95, { rating: 4.2, reviews: 64 }),
    base("s5", "Polo piqué blanc coupe regular", "Celio", 22.99, { rating: 4.0, reviews: 230 }),
    base("s6", "Polo blanc 65% coton 35% polyester", "Kiabi", 9, { rating: 4.1, reviews: 1500 }),
    base("s7", "Polo Pacific manches courtes 100% coton, made in France", "Saint James", 79),
  ];
}
