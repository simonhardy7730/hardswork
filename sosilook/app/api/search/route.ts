import { NextResponse } from "next/server";
import { z } from "zod";
import { searchOffers } from "@/lib/search";
import { bestPrice, scoreOffers } from "@/lib/score";
import { GarmentAnalysisSchema, type GarmentAnalysis, type Mode, type SearchResponse } from "@/lib/types";
import { withGender } from "@/lib/gender";

export const runtime = "nodejs";
export const maxDuration = 60;

// L'épingle et le genre manquent dans les alertes créées avant leur ajout.
const ItemSchema = GarmentAnalysisSchema.extend({
  pin: GarmentAnalysisSchema.shape.pin.optional(),
  gender: GarmentAnalysisSchema.shape.gender.optional(),
});

const BodySchema = z.object({
  analysis: ItemSchema,
  mode: z.enum(["exact", "style"]),
  brand: z.string().trim().max(80).nullable(),
  model: z.string().trim().max(80).nullable(),
  gender: GarmentAnalysisSchema.shape.gender.optional(),
});

const same = (a: string | null, b: string | null) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/**
 * Étape 2 : après confirmation de la marque par l'utilisateur, on cherche et on note les offres.
 * Sert aussi à revérifier les prix des alertes.
 */
export async function POST(req: Request) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { analysis: original, mode: requested } = parsed;
  const brand = parsed.brand || null;
  const model = parsed.model || null;

  // Si l'utilisateur a corrigé la marque ou le modèle, on reconstruit la requête exacte.
  const corrected = !same(brand, original.brand.name) || !same(model, original.model_guess);
  // Le choix de l'utilisateur l'emporte sur ce que l'analyse a déduit.
  const gender = parsed.gender ?? original.gender ?? "mixte";
  const analysis: GarmentAnalysis = {
    ...original,
    pin: original.pin ?? { x: 0.5, y: 0.5 },
    gender,
    brand: { ...original.brand, name: brand, confidence: corrected && brand ? "haute" : original.brand.confidence },
    model_guess: model,
    exact_query: withGender(
      corrected ? [brand, model, original.category, original.colors[0]].filter(Boolean).join(" ") : original.exact_query,
      gender,
    ),
    style_queries: original.style_queries.map((q) => withGender(q, gender)),
    // Le prix boutique estimé valait pour la marque d'origine.
    estimated_retail_price_eur: same(brand, original.brand.name) ? original.estimated_retail_price_eur : null,
  };

  const mode: Mode = requested === "exact" && !brand ? "style" : requested;
  const notes: string[] = [];
  if (mode !== requested) notes.push("Sans marque, on ne peut pas chercher la pièce exacte : voici ses sosies.");

  try {
    const { offers, demo } = await searchOffers(analysis, mode);
    const scored = scoreOffers(offers, analysis, mode);
    const response: SearchResponse = {
      mode,
      analysis,
      offers: scored,
      bestPrice: bestPrice(scored, mode),
      demo,
      notes,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
