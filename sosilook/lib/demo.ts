import type { GarmentAnalysis, Mode, Offer, PhotoAnalysis } from "./types";
import { merchantUrl } from "./links";

/**
 * Données d'EXEMPLE utilisées quand les clés API ne sont pas configurées.
 * Elles servent à montrer le fonctionnement du site ; l'interface les signale clairement.
 * Les liens mènent à une vraie recherche de la pièce sur le site du vendeur, pas à de fausses fiches produit.
 */

const DEMO_POLO: GarmentAnalysis = {
  pin: { x: 0.5, y: 0.45 },
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

/** Une tenue « old money » d'exemple, de la tête aux pieds. */
const DEMO_OUTFIT: GarmentAnalysis[] = [
  {
    pin: { x: 0.5, y: 0.1 },
    universe: "lunettes",
    category: "lunettes de soleil",
    title: "Lunettes de soleil rondes écaille",
    description: "Monture ronde en acétate écaille, verres verts foncés, branches fines.",
    brand: { name: "Persol", confidence: "moyenne", clues: "Flèche argentée sur la branche" },
    model_guess: "PO3092SM",
    colors: ["écaille", "vert"],
    material_guess: "acétate",
    fit: "monture ronde",
    style_tags: ["classique", "italien", "old money"],
    estimated_retail_price_eur: 230,
    exact_query: "lunettes Persol PO3092SM écaille",
    style_queries: [
      "lunettes de soleil rondes acétate écaille verres polarisés",
      "lunettes rondes écaille verres verts UV400 catégorie 3",
    ],
    quality_checklist: [
      "Monture en acétate (pas en plastique injecté)",
      "Verres polarisés, protection UV400, catégorie 3",
      "Charnières métalliques solides, idéalement à ressort",
    ],
  },
  {
    pin: { x: 0.42, y: 0.34 },
    universe: "vetement",
    category: "blazer croisé",
    title: "Blazer croisé marine à boutons dorés",
    description: "Veste croisée six boutons en laine bleu marine, revers pointus, boutons métal doré.",
    brand: { name: "Ralph Lauren", confidence: "moyenne", clues: "Boutons dorés gravés, coupe croisée signature" },
    model_guess: null,
    colors: ["bleu marine"],
    material_guess: "laine",
    fit: "croisé, épaules structurées",
    style_tags: ["old money", "preppy", "classique"],
    estimated_retail_price_eur: 690,
    exact_query: "blazer croisé Ralph Lauren marine boutons dorés",
    style_queries: [
      "blazer croisé laine bleu marine boutons dorés homme",
      "veste croisée marine 100% laine homme",
    ],
    quality_checklist: [
      "100 % laine (ou laine majoritaire), pas de polyester",
      "Entoilage (au moins demi-entoilé) : la veste garde sa forme",
      "Boutons en métal cousus, doublure en viscose ou cupro",
    ],
  },
  {
    pin: { x: 0.52, y: 0.28 },
    universe: "vetement",
    category: "chemise oxford",
    title: "Chemise Oxford blanche col boutonné",
    description: "Chemise en coton Oxford blanc, col boutonné, coupe droite.",
    brand: { name: null, confidence: "faible", clues: "Aucun logo visible" },
    model_guess: null,
    colors: ["blanc"],
    material_guess: "coton Oxford",
    fit: "droite",
    style_tags: ["classique", "preppy"],
    estimated_retail_price_eur: null,
    exact_query: "chemise oxford blanche col boutonné homme",
    style_queries: [
      "chemise oxford blanche 100% coton col boutonné homme",
      "chemise oxford coton épais blanche coupe droite",
    ],
    quality_checklist: [
      "Tissu Oxford 100 % coton, épais et légèrement texturé",
      "Col boutonné qui roule bien, boutons en nacre ou corozo",
      "Coutures fines et régulières (au moins 6 points par cm)",
    ],
  },
  {
    pin: { x: 0.48, y: 0.64 },
    universe: "vetement",
    category: "pantalon chino",
    title: "Chino beige coupe droite",
    description: "Pantalon chino en sergé de coton beige, coupe droite, pinces discrètes.",
    brand: { name: null, confidence: "faible", clues: "Aucun logo visible" },
    model_guess: null,
    colors: ["beige"],
    material_guess: "sergé de coton",
    fit: "droite",
    style_tags: ["classique", "casual chic"],
    estimated_retail_price_eur: null,
    exact_query: "chino beige coupe droite homme",
    style_queries: ["pantalon chino beige 100% coton coupe droite homme", "chino sergé coton beige pinces homme"],
    quality_checklist: [
      "Sergé 100 % coton, ou avec 2 % d'élasthanne au maximum",
      "Poches renforcées et braguette à boutons ou zip métal",
      "Tissu épais qui ne marque pas (≈ 250 g/m²)",
    ],
  },
  {
    pin: { x: 0.62, y: 0.47 },
    universe: "montre",
    category: "montre rectangulaire",
    title: "Montre rectangulaire cadran blanc, bracelet cuir",
    description: "Boîtier rectangulaire doré, cadran blanc à chiffres romains, aiguilles bleuies, bracelet cuir noir.",
    brand: { name: "Cartier", confidence: "moyenne", clues: "Boîtier Tank, chiffres romains, cabochon bleu sur la couronne" },
    model_guess: "Tank Must",
    colors: ["doré", "blanc", "noir"],
    material_guess: "acier doré, cuir",
    fit: "boîtier 33 × 25 mm",
    style_tags: ["old money", "élégant", "intemporel"],
    estimated_retail_price_eur: 3150,
    exact_query: "montre Cartier Tank Must cadran blanc cuir",
    style_queries: [
      "montre rectangulaire cadran blanc chiffres romains bracelet cuir",
      "montre tank rectangulaire dorée cadran blanc",
    ],
    quality_checklist: [
      "Verre saphir (résiste aux rayures) plutôt que minéral",
      "Boîtier en acier inoxydable 316L, plaqué épais si doré",
      "Mouvement suisse ou japonais identifié (Ronda, Miyota, Seiko…)",
    ],
  },
  {
    pin: { x: 0.5, y: 0.92 },
    universe: "chaussures",
    category: "mocassins",
    title: "Mocassins à pampilles en cuir marron",
    description: "Mocassins en cuir lisse marron, pampilles et liseré, semelle cuir.",
    brand: { name: null, confidence: "faible", clues: "Aucun logo visible" },
    model_guess: null,
    colors: ["marron"],
    material_guess: "cuir lisse",
    fit: "mocassin",
    style_tags: ["classique", "old money"],
    estimated_retail_price_eur: null,
    exact_query: "mocassins pampilles cuir marron homme",
    style_queries: ["mocassins à pampilles cuir marron homme semelle cuir", "mocassins cuir pleine fleur marron homme"],
    quality_checklist: [
      "Cuir pleine fleur (pas de cuir « véritable » bas de gamme ni de PU)",
      "Montage cousu (Blake ou Goodyear), ressemelable",
      "Semelle en cuir ou gomme de qualité, intérieur cuir",
    ],
  },
];

/** Démo : une tenue si la photo est verticale (une personne), sinon une pièce seule. */
export function demoPhotoAnalysis(portrait: boolean): PhotoAnalysis {
  return portrait
    ? { contains_fashion: true, is_outfit: true, items: DEMO_OUTFIT }
    : { contains_fashion: true, is_outfit: false, items: [DEMO_POLO] };
}

const base = (mode: Mode, id: string, title: string, seller: string, price: number, extra: Partial<Offer> = {}): Offer => ({
  id,
  title,
  seller,
  price: Math.round(price * 100) / 100,
  currency: "EUR",
  // On cherche la pièce elle-même, sans l'état ou le détail ajouté après le tiret.
  url: merchantUrl(seller, title.split(" — ")[0]),
  origin: mode,
  ...extra,
});

/** Magasins d'exemple pour les sosies, par univers. */
const STYLE_SHOPS: Record<GarmentAnalysis["universe"], Array<[string, number, string]>> = {
  vetement: [
    ["Uniqlo", 0.3, "100% coton"],
    ["Arket", 0.55, "100% coton bio"],
    ["Massimo Dutti", 0.7, "100% laine"],
    ["Celio", 0.35, "65% coton 35% polyester"],
    ["Asphalte", 0.8, "fabriqué au Portugal"],
  ],
  chaussures: [
    ["Bexley", 0.9, "cuir pleine fleur cousu Blake"],
    ["Minelli", 0.6, "cuir"],
    ["Zalando", 0.45, "simili cuir"],
  ],
  sac: [
    ["Polène", 0.9, "cuir pleine fleur"],
    ["Le Tanneur", 0.8, "cuir"],
    ["Mango", 0.25, "simili cuir"],
  ],
  montre: [
    ["Herbelin", 0.13, "quartz verre saphir acier 316L"],
    ["Baltic", 0.17, "automatique verre saphir"],
    ["Casio", 0.02, "résine"],
    ["Maty", 0.06, "acier plaqué or"],
  ],
  bijou: [
    ["Maty", 0.3, "argent 925"],
    ["Histoire d'Or", 0.4, "or 9 carats"],
    ["Asos", 0.05, "alliage plaqué or"],
  ],
  lunettes: [
    ["Jimmy Fairly", 0.45, "acétate verres polarisés UV400"],
    ["Mister Spex", 0.35, "acétate UV400 catégorie 3"],
    ["Kiabi", 0.06, "plastique UV400"],
  ],
  accessoire: [
    ["Arket", 0.4, "100% laine"],
    ["Uniqlo", 0.2, "cuir"],
  ],
};

export function demoOffers(analysis: GarmentAnalysis, mode: Mode): Offer[] {
  // Le polo d'exemple garde ses offres détaillées.
  if (analysis.title === DEMO_POLO.title && analysis.brand.name === "Lacoste") return demoPolo(mode);

  const retail = analysis.estimated_retail_price_eur ?? 90;
  const what = `${analysis.category} ${analysis.colors[0] ?? ""}`.trim();

  if (mode === "exact" && analysis.brand.name) {
    const name = `${analysis.brand.name} ${analysis.model_guess ?? ""} ${what}`.replace(/\s+/g, " ").trim();
    return [
      base(mode, "e1", name, analysis.brand.name, retail, { rating: 4.6, reviews: 320 }),
      base(mode, "e2", name, "Galeries Lafayette", retail),
      base(mode, "e3", name, "Zalando", retail * 0.88, { rating: 4.4, reviews: 90 }),
      base(mode, "e4", `${name} — très bon état`, "Vestiaire Collective", retail * 0.52, { secondHand: true }),
      base(mode, "e5", `${name} — porté quelques fois`, "Vinted", retail * 0.38, { secondHand: true }),
    ];
  }

  return STYLE_SHOPS[analysis.universe].map(([seller, factor, detail], i) =>
    base(mode, `s${i}`, `${what} ${analysis.material_guess} — ${detail}`, seller, retail * factor, {
      rating: 4 + (i % 3) * 0.2,
      reviews: 40 + i * 70,
    }),
  );
}

function demoPolo(mode: Mode): Offer[] {
  if (mode === "exact") {
    return [
      base(mode, "e1", "Polo Lacoste L.12.12 classic fit coton piqué blanc", "Lacoste", 110, { rating: 4.6, reviews: 2140 }),
      base(mode, "e2", "Lacoste polo L.12.12 blanc 100% coton", "Galeries Lafayette", 110),
      base(mode, "e3", "Lacoste L.12.12 polo coton piqué blanc", "Zalando", 94.95, { rating: 4.5, reviews: 380 }),
      base(mode, "e4", "Polo Lacoste L1212 blanc", "Place des Tendances", 88),
      base(mode, "e5", "Polo Lacoste L.12.12 blanc taille 4 — très bon état", "Vestiaire Collective", 49, { secondHand: true }),
      base(mode, "e6", "Polo Lacoste blanc L.12.12 T.M porté 2 fois", "Vinted", 32, { secondHand: true }),
      base(mode, "e7", "Polo crocodile blanc homme coton", "AliExpress", 16.5),
    ];
  }
  return [
    base(mode, "s1", "Polo piqué Supima 100% coton blanc", "Uniqlo", 24.9, { rating: 4.5, reviews: 910 }),
    base(mode, "s2", "Polo en maille piquée 100% coton bio blanc", "Arket", 45, { rating: 4.4, reviews: 120 }),
    base(mode, "s3", "Polo coton piqué épais blanc — fabriqué au Portugal", "Asphalte", 59),
    base(mode, "s4", "Polo manches courtes coton piqué blanc", "Massimo Dutti", 39.95, { rating: 4.2, reviews: 64 }),
    base(mode, "s5", "Polo piqué blanc coupe regular", "Celio", 22.99, { rating: 4.0, reviews: 230 }),
    base(mode, "s6", "Polo blanc 65% coton 35% polyester", "Kiabi", 9, { rating: 4.1, reviews: 1500 }),
    base(mode, "s7", "Polo Pacific manches courtes 100% coton, made in France", "Saint James", 79),
  ];
}
