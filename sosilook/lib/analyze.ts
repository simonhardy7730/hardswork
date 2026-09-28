import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GarmentAnalysisSchema, type GarmentAnalysis } from "./types";
import { DEMO_ANALYSIS } from "./demo";

const SYSTEM_PROMPT = `Tu es l'expert mode de Sosilook, un site français qui aide à retrouver un article de mode vu en photo
(vêtement, chaussures, sac à main ou sacoche, montre, bijou, lunettes de soleil, accessoire) :
soit la pièce exacte au meilleur prix chez des vendeurs fiables, soit des alternatives au style très proche et moins chères.

Analyse la photo avec l'œil d'un acheteur expérimenté (prêt-à-porter, maroquinerie, horlogerie, joaillerie, optique) :
- Identifie la marque uniquement à partir d'indices visibles (logo, étiquette, broderie, coupe signature). N'invente jamais : si tu n'es pas sûr, baisse la confiance ou mets null.
- Les requêtes de recherche doivent être en français, courtes, comme un acheteur les taperait sur Google Shopping France.
- Les requêtes "style" ne contiennent JAMAIS de nom de marque ni de mot comme "dupe" ou "copie" : elles décrivent la pièce (matière, coupe, couleur, détails) pour trouver des alternatives légales, pas des contrefaçons.
- La checklist qualité donne des critères vérifiables sur une fiche produit (composition, grammage, finitions, origine).
- Montres : indique si possible le type de mouvement (quartz / automatique), le diamètre et le verre. Bijoux : le métal (or, argent 925, plaqué, acier). Lunettes : forme de monture et type de verres. Sacs : type de cuir ou toile.
- Si plusieurs articles sont visibles, concentre-toi sur la pièce principale, au centre de l'image.`;

export async function analyzeGarment(
  image: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" },
  userHint?: string,
): Promise<{ analysis: GarmentAnalysis; demo: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { analysis: DEMO_ANALYSIS, demo: true };
  }

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(GarmentAnalysisSchema) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } },
          {
            type: "text",
            text: userHint
              ? `Analyse cet article. Précision de l'utilisateur : ${userHint}`
              : "Analyse cet article.",
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("L'analyse de la photo n'a pas abouti. Essaie avec une photo plus nette, centrée sur l'article.");
  }
  return { analysis: response.parsed_output, demo: false };
}
