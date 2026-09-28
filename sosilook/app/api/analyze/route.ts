import { NextResponse } from "next/server";
import { analyzePhoto } from "@/lib/analyze";
import type { AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];
const MAX_BASE64_CHARS = 7_000_000; // ≈ 5 Mo

/** Étape 1 : la photo → la ou les pièces repérées (marque proposée, matière, requêtes…). */
export async function POST(req: Request) {
  let body: { image?: string; hint?: string; portrait?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const match = /^data:(image\/[a-z]+);base64,(.+)$/.exec(body.image ?? "");
  if (!match || !MEDIA_TYPES.includes(match[1] as MediaType)) {
    return NextResponse.json({ error: "Ajoute une photo (JPEG, PNG ou WebP)." }, { status: 400 });
  }
  if (match[2].length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: "Photo trop lourde (5 Mo max)." }, { status: 413 });
  }

  try {
    const { analysis, demo } = await analyzePhoto(
      { mediaType: match[1] as MediaType, data: match[2], portrait: body.portrait === true },
      body.hint?.slice(0, 300),
    );
    if (!analysis.contains_fashion || analysis.items.length === 0) {
      return NextResponse.json(
        { error: "On ne voit pas d'article de mode sur cette photo. Essaie de cadrer la pièce." },
        { status: 422 },
      );
    }
    return NextResponse.json({
      items: analysis.items,
      isOutfit: analysis.is_outfit && analysis.items.length > 1,
      demo,
    } satisfies AnalyzeResponse);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
