import cities from "./be-cities.json";

type City = { n: string; a: string[]; lat: number; lng: number; r?: "wallonie" | "bruxelles" | "flandre" };
const CITIES = cities as City[];

/** minuscules, sans accents ni ponctuation : « Saint-Ghislain » ≈ « st ghislain » n'est PAS géré, mais « Liège » = « liege ». */
export function normalizePlace(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Équivalents FR / NL / EN des grandes villes (les offres sont saisies dans l'une ou l'autre langue).
const ALIASES: [string, string[]][] = [
  ["Gent", ["Gand", "Ghent"]], ["Brugge", ["Bruges"]], ["Antwerpen", ["Anvers", "Antwerp"]],
  ["Brussels", ["Bruxelles", "Brussel"]], ["Mons", ["Bergen"]], ["Liège", ["Luik", "Liege"]],
  ["Namur", ["Namen"]], ["Mechelen", ["Malines"]], ["Leuven", ["Louvain"]], ["Kortrijk", ["Courtrai"]],
  ["Ieper", ["Ypres"]], ["Arlon", ["Aarlen"]], ["Mouscron", ["Moeskroen"]], ["Nivelles", ["Nijvel"]],
  ["Tournai", ["Doornik"]], ["Ath", ["Aat"]], ["Hasselt", []],
];
const INDEX = new Map<string, City>();
for (const c of CITIES) {
  for (const name of [c.n, ...c.a]) {
    const k = normalizePlace(name);
    if (k && !INDEX.has(k)) INDEX.set(k, c);
  }
}

for (const [main, alts] of ALIASES) {
  const c = INDEX.get(normalizePlace(main));
  if (c) for (const a of alts) INDEX.set(normalizePlace(a), c);
}
const EXTRA_NAMES = new Map<City, string[]>();
for (const [main, alts] of ALIASES) {
  const c = INDEX.get(normalizePlace(main));
  if (c) EXTRA_NAMES.set(c, alts);
}

export function findCity(name: string): City | null {
  return INDEX.get(normalizePlace(name)) ?? null;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const RADIUS_OPTIONS = [10, 25, 50, 100] as const;

/** Noms de toutes les localités situées à moins de `km` kilomètres du centre (centre inclus). */
export function citiesWithin(center: string, km: number): { center: City; names: string[] } | null {
  const c = findCity(center);
  if (!c) return null;
  const names = new Set<string>([c.n]);
  for (const o of CITIES) if (distanceKm(c, o) <= km) { names.add(o.n); for (const a of [...o.a, ...(EXTRA_NAMES.get(o) ?? [])]) names.add(a); }
  return { center: c, names: [...names] };
}

/** Nettoie un nom pour un filtre PostgREST `or=(city.ilike.…)`. */
export function safeIlikeValue(n: string): string {
  return n.replace(/[%,()*\\"'.:]/g, " ").replace(/\s+/g, " ").trim();
}

/** Région déduite de la ville (le champ « région » n'est plus saisi) ; Wallonie par défaut si la ville est inconnue. */
const BRUSSELS_COMMUNES = new Set(
  ["Anderlecht", "Oudergem", "Auderghem", "Sint-Agatha-Berchem", "Berchem-Sainte-Agathe", "Brussel", "Bruxelles", "Brussels",
   "Etterbeek", "Evere", "Vorst", "Forest", "Ganshoren", "Elsene", "Ixelles", "Jette", "Koekelberg", "Sint-Jans-Molenbeek",
   "Molenbeek-Saint-Jean", "Molenbeek", "Sint-Gillis", "Saint-Gilles", "Sint-Joost-ten-Node", "Saint-Josse-ten-Noode", "Schaarbeek",
   "Schaerbeek", "Ukkel", "Uccle", "Watermaal-Bosvoorde", "Watermael-Boitsfort", "Sint-Lambrechts-Woluwe", "Woluwe-Saint-Lambert",
   "Sint-Pieters-Woluwe", "Woluwe-Saint-Pierre"].map(normalizePlace)
);

export function regionForCity(city: string): "wallonie" | "bruxelles" | "flandre" {
  if (BRUSSELS_COMMUNES.has(normalizePlace(city))) return "bruxelles";
  return findCity(city)?.r ?? "wallonie";
}
