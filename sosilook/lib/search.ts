import type { GarmentAnalysis, Mode, Offer } from "./types";
import { demoOffers } from "./demo";

interface SerpShoppingResult {
  position?: number;
  title?: string;
  link?: string;
  product_link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  thumbnail?: string;
  rating?: number;
  reviews?: number;
  second_hand_condition?: string;
}

/** Recherche Google Shopping France via SerpApi. */
async function googleShopping(query: string, origin: Mode, limit: number): Promise<Offer[]> {
  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: "fr",
    hl: "fr",
    location: "France",
    api_key: process.env.SERPAPI_KEY ?? "",
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Recherche Shopping indisponible (${res.status})`);
  const json = (await res.json()) as { shopping_results?: SerpShoppingResult[] };

  return (json.shopping_results ?? []).slice(0, limit).flatMap((r, i): Offer[] => {
    const url = r.link ?? r.product_link;
    if (!r.title || !url) return [];
    return [
      {
        id: `${origin}-${i}-${r.position ?? i}`,
        title: r.title,
        seller: r.source ?? "Vendeur inconnu",
        price: r.extracted_price ?? null,
        currency: "EUR",
        url,
        thumbnail: r.thumbnail,
        rating: r.rating,
        reviews: r.reviews,
        secondHand: Boolean(r.second_hand_condition),
        origin,
      },
    ];
  });
}

export async function searchOffers(
  analysis: GarmentAnalysis,
  mode: Mode,
): Promise<{ offers: Offer[]; demo: boolean }> {
  if (!process.env.SERPAPI_KEY) {
    return { offers: demoOffers(analysis, mode), demo: true };
  }

  const queries: Array<[string, Mode, number]> =
    mode === "exact"
      ? [[analysis.exact_query, "exact", 20]]
      : analysis.style_queries.slice(0, 3).map((q): [string, Mode, number] => [q, "style", 10]);

  const batches = await Promise.all(queries.map(([q, origin, limit]) => googleShopping(q, origin, limit)));

  // Dédoublonnage par lien
  const seen = new Set<string>();
  const offers = batches.flat().filter((o) => (seen.has(o.url) ? false : (seen.add(o.url), true)));
  return { offers, demo: false };
}
