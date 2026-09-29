import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PhotoAnalysisSchema, type PhotoAnalysis } from "./types";
import { demoPhotoAnalysis } from "./demo";

export const SYSTEM_PROMPT = `Tu es l'expert mode de Sosilook, un site français qui aide à retrouver des articles de mode vus en photo
(vêtements, chaussures, sacs à main ou sacoches, montres, bijoux, lunettes de soleil, accessoires) :
soit la pièce exacte au meilleur prix chez des vendeurs fiables, soit des alternatives au style très proche et moins chères.

Deux cas de photo :
- Une photo produit ou un article seul : une seule pièce dans "items".
- Une personne ou une tenue : liste CHAQUE pièce identifiable séparément, de la tête aux pieds
  (lunettes, veste, haut, pantalon ou jupe, ceinture, sac, montre, bijoux, chaussures…), 8 au maximum.
  Ignore ce qui est trop caché ou flou pour être décrit avec précision. is_outfit = true.
Si l'utilisateur précise ce qu'il cherche (« juste la veste »), ne garde que cette pièce.

Pour chaque pièce, avec l'œil d'un acheteur expérimenté (prêt-à-porter, maroquinerie, horlogerie, joaillerie, optique) :
- Identifie la marque uniquement à partir d'indices visibles (logo, étiquette, broderie, boucle, coupe ou design signature). N'invente jamais : si tu n'es pas sûr, baisse la confiance ou mets null.
- "pin" place une épingle au centre de la pièce sur la photo (fractions de 0 à 1).
- Les requêtes de recherche sont en français, courtes, comme un acheteur les taperait sur Google Shopping France.
- Les requêtes "style" ne contiennent JAMAIS de nom de marque ni de mot comme "dupe" ou "copie" : elles décrivent la pièce (matière, coupe, couleur, détails) pour trouver des alternatives légales, pas des contrefaçons.
- La checklist qualité donne des critères vérifiables sur une fiche produit (composition, grammage, finitions, origine).
- Montres : type de mouvement (quartz / automatique), diamètre et verre si possible. Bijoux : le métal (or, argent 925, plaqué, acier). Lunettes : forme de monture et type de verres. Sacs : type de cuir ou toile.`;

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function analyzePhoto(
  image: { data: string; mediaType: MediaType; portrait: boolean },
  userHint?: string,
): Promise<{ analysis: PhotoAnalysis; demo: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { analysis: demoPhotoAnalysis(image.portrait), demo: true };
  }

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(PhotoAnalysisSchema) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
          {
            type: "text",
            text: userHint ? `Analyse cette photo. Précision de l'utilisateur : ${userHint}` : "Analyse cette photo.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("L'analyse de la photo n'a pas abouti. Essaie avec une photo plus nette.");
  }
  return { analysis: tidy(response.parsed_output), demo: false };
}

/** Garde-fous : 8 pièces au maximum, épingles ramenées dans la photo. */
export function tidy(analysis: PhotoAnalysis): PhotoAnalysis {
  return {
    ...analysis,
    items: analysis.items.slice(0, 8).map((it) => ({
      ...it,
      pin: { x: Math.min(1, Math.max(0, it.pin.x)), y: Math.min(1, Math.max(0, it.pin.y)) },
    })),
  };
}
