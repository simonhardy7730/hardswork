import { z } from "zod";

export type Mode = "exact" | "style";

/** Pour qui est la pièce : les boutiques séparent les rayons homme et femme. */
export type Gender = "homme" | "femme" | "mixte";

/** Une pièce repérée sur la photo. */
export const GarmentAnalysisSchema = z.object({
  pin: z
    .object({ x: z.number(), y: z.number() })
    .describe("Centre approximatif de la pièce sur la photo, en fraction de 0 à 1 depuis le coin haut-gauche (x vers la droite, y vers le bas)"),
  universe: z
    .enum(["vetement", "chaussures", "sac", "montre", "bijou", "lunettes", "accessoire"])
    .describe("Univers de l'article"),
  gender: z
    .enum(["homme", "femme", "mixte"])
    .describe("Pour qui est la pièce : d'après la personne qui la porte, sinon la coupe ou le modèle. 'mixte' seulement si elle est vraiment unisexe"),
  category: z
    .string()
    .describe("Type de pièce en français, ex: 'polo', 'chemise oxford', 'montre plongée', 'sac cabas', 'lunettes aviateur'"),
  title: z.string().describe("Nom court et parlant de la pièce, ex: 'Polo piqué blanc à logo crocodile'"),
  description: z.string().describe("Une phrase courte décrivant la pièce (coupe, matière, détails)"),
  brand: z.object({
    name: z.string().nullable().describe("Marque identifiée, ou null si inconnue"),
    confidence: z.enum(["haute", "moyenne", "faible"]),
    clues: z.string().describe("Indices visuels ayant permis l'identification (logo, étiquette, coupe signature...)"),
  }),
  model_guess: z
    .string()
    .nullable()
    .describe("Modèle/référence probable, ex: 'L.12.12', ou null"),
  colors: z.array(z.string()),
  material_guess: z
    .string()
    .describe("Matière probable, ex: 'coton piqué', 'acier inoxydable', 'cuir grainé', 'acétate', 'argent 925'"),
  fit: z
    .string()
    .describe("Coupe ou format, ex: 'classique', 'slim', 'boîtier 40 mm', 'grand format', 'monture ronde'"),
  style_tags: z.array(z.string()).describe("3 à 5 mots-clés de style, ex: 'classique', 'preppy', 'old money'"),
  estimated_retail_price_eur: z
    .number()
    .nullable()
    .describe("Prix neuf habituel en boutique officielle, en euros, ou null si inconnu"),
  exact_query: z
    .string()
    .describe("Requête Google Shopping pour trouver la pièce EXACTE (marque + modèle + couleur)"),
  style_queries: z
    .array(z.string())
    .describe("2 requêtes Google Shopping SANS marque pour trouver des pièces au style très proche"),
  quality_checklist: z
    .array(z.string())
    .describe("3 critères concrets et vérifiables sur une fiche produit pour juger la qualité d'une alternative (composition, grammage, mouvement, verre, type de cuir, protection UV...)"),
});

export type GarmentAnalysis = z.infer<typeof GarmentAnalysisSchema>;

/** Toute la photo : une seule pièce (photo produit) ou une tenue complète. */
export const PhotoAnalysisSchema = z.object({
  contains_fashion: z
    .boolean()
    .describe("true si la photo montre au moins un article de mode (vêtement, chaussures, sac, montre, bijou, lunettes, accessoire)"),
  is_outfit: z
    .boolean()
    .describe("true si la photo montre une personne ou une tenue avec plusieurs pièces à retrouver"),
  items: z
    .array(GarmentAnalysisSchema)
    .describe("Chaque pièce identifiable, de la tête aux pieds (8 au maximum). Une seule pièce pour une photo produit."),
});

export type PhotoAnalysis = z.infer<typeof PhotoAnalysisSchema>;

export type TrustTier =
  | "officiel" // site de la marque
  | "agree" // revendeur agréé / grand magasin
  | "seconde_main_verifiee" // revente avec authentification
  | "occasion" // revente entre particuliers
  | "a_verifier"; // inconnu ou à risque

export interface Offer {
  id: string;
  title: string;
  seller: string;
  price: number | null;
  currency: string;
  url: string;
  thumbnail?: string;
  rating?: number;
  reviews?: number;
  secondHand?: boolean;
  /** Requête qui a trouvé cette offre (exact ou style). */
  origin: Mode;
}

export type ImpactGrade = "A" | "B" | "C" | "D" | "E";

/** Lettre impact estimée (le « Yuka de la mode ») : d'où vient la pièce, en quoi elle est faite. */
export interface Impact {
  grade: ImpactGrade;
  points: number; // 0-100
  reasons: string[];
}

export interface ScoredOffer extends Offer {
  trust: TrustTier;
  trustLabel: string;
  quality: number; // 0-10
  qualityReasons: string[];
  priceScore: number; // 0-10, 10 = le moins cher du lot
  overall: number; // 0-10
  savingsPct: number | null; // vs prix boutique estimé
  impact: Impact;
  warnings: string[];
}

export interface AnalyzeResponse {
  items: GarmentAnalysis[];
  isOutfit: boolean;
  demo: boolean;
  /** Pourquoi l'analyse est un exemple, ou comment elle a été faite (affiché à l'utilisateur). */
  notice?: string;
  /** La photo n'a pas pu être envoyée, mais une description écrite peut être analysée. */
  canDescribe?: boolean;
}

export interface SearchRequest {
  analysis: GarmentAnalysis;
  mode: Mode;
  /** Marque confirmée ou corrigée par l'utilisateur (null = inconnue). */
  brand: string | null;
  /** Modèle / référence confirmé par l'utilisateur. */
  model: string | null;
  /** Pour qui, confirmé ou corrigé par l'utilisateur. */
  gender?: Gender;
}

export interface SearchResponse {
  mode: Mode;
  analysis: GarmentAnalysis;
  offers: ScoredOffer[];
  /** Meilleur prix chez un vendeur sans alerte (en mode exact : fiable uniquement). */
  bestPrice: number | null;
  demo: boolean;
  notes: string[];
}
