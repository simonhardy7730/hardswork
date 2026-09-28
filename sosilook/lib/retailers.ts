import type { TrustTier } from "./types";

/**
 * Base de confiance des vendeurs. C'est le cœur de la promesse "c'est du vrai" :
 * en mode "pièce exacte", on met en avant uniquement le site officiel, les revendeurs
 * agréés et la seconde main authentifiée. À enrichir au fil du temps (et à vérifier
 * marque par marque : un revendeur agréé pour une marque ne l'est pas forcément pour une autre).
 */
const AUTHORIZED_RETAILERS = [
  "galeries lafayette",
  "printemps",
  "le bon marché",
  "bon marche",
  "zalando",
  "farfetch",
  "mytheresa",
  "mr porter",
  "mrporter",
  "net-a-porter",
  "ssense",
  "end clothing",
  "end.",
  "matches",
  "selfridges",
  "harrods",
  "el corte inglés",
  "el corte ingles",
  "de bijenkorf",
  "breuninger",
  "place des tendances",
  "la redoute",
  "about you",
  "asos",
  "john lewis",
  "nordstrom",
  "jd sports",
  "courir",
  "intersport",
  "sarenza",
  "spartoo",
  // Horlogerie & bijouterie
  "maty",
  "histoire d'or",
  "marc orian",
  "julien d'orcel",
  "cleor",
  "bucherer",
  "wempe",
  "tourneau",
  // Optique & lunettes de soleil
  "sunglass hut",
  "optic 2000",
  "krys",
  "afflelou",
  "grandoptical",
  "mister spex",
  "smartbuyglasses",
  "atol",
];

const VERIFIED_RESALE = [
  "chrono24",
  "watchfinder",
  "vestiaire collective",
  "the realreal",
  "collector square",
  "stockx",
  "videdressing",
  "reoriginal",
];

const PEER_RESALE = ["vinted", "ebay", "leboncoin", "depop", "grailed", "poshmark", "label emmaus"];

/** Marques reconnues pour un bon rapport qualité/prix sur le vestiaire classique. */
export const VALUE_BRANDS = [
  "uniqlo", "arket", "cos", "massimo dutti", "saint james", "armor lux", "asphalte", "loom",
  "le slip francais", "hast", "figaret", "cafe coton", "benson & cherry", "sezane", "rouje",
  "bonne gueule", "de bonne facture", "officine generale", "a.p.c.", "apc", "j.crew", "ralph lauren",
  "lacoste", "sunspel", "john smedley", "barbour", "levi's", "levis", "tommy hilfiger",
  // Montres, bijoux, maroquinerie, optique au bon rapport qualité/prix
  "seiko", "tissot", "hamilton", "orient", "citizen", "baltic", "lip", "yema", "herbelin",
  "le tanneur", "lancel", "polene", "longchamp", "jerome dreyfuss", "l/uniform", "maison standards",
  "ray-ban", "persol", "oliver peoples", "jimmy fairly", "sezane", "agapee", "maison monik",
];

/** Marques qui vendent en direct (leur propre site = vendeur officiel pour leurs pièces). */
const BRAND_STORES = [
  ...VALUE_BRANDS,
  "zara", "h&m", "mango", "celio", "kiabi", "jules", "bershka", "pull&bear", "sandro", "maje",
  "the kooples", "ami paris", "de fursac", "ba&sh", "claudie pierlot", "gant", "hugo boss", "boss",
  "polo ralph lauren", "fossil", "swatch", "casio", "daniel wellington", "pandora", "swarovski", "apm monaco",
  "michael kors", "coach", "furla", "fred perry", "nike", "adidas", "veja", "new balance",
];

/** Plateformes où la contrefaçon est fréquente pour les pièces de marque. */
const HIGH_RISK = ["aliexpress", "temu", "shein", "wish", "dhgate", "joom", "alibaba", "banggood"];

export const TRUST_LABELS: Record<TrustTier, string> = {
  officiel: "Site officiel",
  agree: "Revendeur reconnu",
  seconde_main_verifiee: "Seconde main authentifiée",
  occasion: "Occasion entre particuliers",
  a_verifier: "Vendeur à vérifier",
};

/** Points de confiance sur 10 selon le type de vendeur. */
export const TRUST_POINTS: Record<TrustTier, number> = {
  officiel: 10,
  agree: 9,
  seconde_main_verifiee: 8,
  occasion: 5,
  a_verifier: 2,
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

export function classifySeller(seller: string, brand: string | null): { tier: TrustTier; highRisk: boolean } {
  const s = normalize(seller);
  const includesAny = (list: string[]) => list.some((name) => s.includes(normalize(name)));

  if (includesAny(HIGH_RISK)) return { tier: "a_verifier", highRisk: true };
  if (brand && s.includes(normalize(brand))) return { tier: "officiel", highRisk: false };
  if (BRAND_STORES.some((b) => s === normalize(b) || s === `${normalize(b)}.com` || s === `${normalize(b)}.fr`)) {
    return { tier: "officiel", highRisk: false };
  }
  if (includesAny(VERIFIED_RESALE)) return { tier: "seconde_main_verifiee", highRisk: false };
  if (includesAny(PEER_RESALE)) return { tier: "occasion", highRisk: false };
  if (includesAny(AUTHORIZED_RETAILERS)) return { tier: "agree", highRisk: false };
  return { tier: "a_verifier", highRisk: false };
}
