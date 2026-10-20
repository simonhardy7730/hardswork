import { normalizePlace } from "@/lib/geo/distance";

/** Villes ciblées pour les pages « emploi {métier} {ville} » (liste fermée : pas de pages créées à la volée). */
export const SEO_CITIES = ["Tournai", "Mons", "Mouscron", "Ath", "Charleroi", "La Louvière", "Namur", "Liège", "Bruxelles", "Courtrai", "Gand"];
export const SEO_SECTORS = ["logistique", "construction", "transport", "industrie", "nettoyage", "securite", "medical"] as const;

export const citySlug = (c: string) => normalizePlace(c).replace(/ /g, "-");
export const cityFromSlug = (s: string) => SEO_CITIES.find((c) => citySlug(c) === s) ?? null;
export const isSeoSector = (s: string): s is (typeof SEO_SECTORS)[number] => (SEO_SECTORS as readonly string[]).includes(s);
