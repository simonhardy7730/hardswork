import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PhotoAnalysisSchema, type PhotoAnalysis } from "./types";
import { demoPhotoAnalysis } from "./demo";
import { TtlCache, fingerprint } from "./cache";

/**
 * Modèle utilisé pour l'analyse. Par défaut Claude Haiku 4.5 : environ 5 fois moins cher
 * par token que les gros modèles, et l'utilisateur confirme de toute façon la marque.
 * Pour comparer, SOSILOOK_MODEL=claude-sonnet-5 ou claude-opus-5 (voir PLAN.md §4.5).
 */
const MODEL = process.env.SOSILOOK_MODEL || "claude-haiku-4-5";

/** Tarifs publics en dollars par million de tokens (entrée, sortie), pour estimer le coût réel. */
const PRICES: Record<string, [number, number]> = {
  "claude-haiku-4-5": [1, 5],
  "claude-sonnet-5": [2, 10],
  "claude-opus-5": [5, 25],
  "claude-opus-5-5": [4, 20],
};

/** Même photo, même précision : on réutilise l'analyse pendant 24 h au lieu de repayer. */
const analysisCache = new TtlCache<PhotoAnalysis>(24 * 60 * 60 * 1000);

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
- "gender" : pour qui est la pièce (homme ou femme), d'après la personne qui la porte, sinon d'après la coupe et le modèle. "mixte" seulement pour une pièce vraiment unisexe.
- Chaque requête de recherche contient « homme » ou « femme » (sauf pièce mixte) : sans cela, les boutiques mélangent les rayons.
- Les requêtes de recherche sont en français, courtes, comme un acheteur les taperait sur Google Shopping France.
- Les requêtes "style" ne contiennent JAMAIS de nom de marque ni de mot comme "dupe" ou "copie" : elles décrivent la pièce (matière, coupe, couleur, détails) pour trouver des alternatives légales, pas des contrefaçons.
- La checklist qualité donne des critères vérifiables sur une fiche produit (composition, grammage, finitions, origine).
- Montres : type de mouvement (quartz / automatique), diamètre et verre si possible. Bijoux : le métal (or, argent 925, plaqué, acier). Lunettes : forme de monture et type de verres. Sacs : type de cuir ou toile.

Sois bref, chaque mot compte : description en une phrase courte, indices de marque en quelques mots,
2 requêtes "style", 3 critères qualité de moins de 12 mots chacun.`;

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function analyzePhoto(
  image: { data: string; mediaType: MediaType; portrait: boolean },
  userHint?: string,
): Promise<{ analysis: PhotoAnalysis; demo: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { analysis: demoPhotoAnalysis(image.portrait), demo: true };
  }

  const key = await fingerprint(`${MODEL}|${userHint ?? ""}|${image.data}`);
  const cached = analysisCache.get(key);
  if (cached) return { analysis: cached, demo: false };

  const client = new Anthropic();
  const format = zodOutputFormat(PhotoAnalysisSchema);
  // Haiku 4.5 n'a pas de réglage d'effort ; les gros modèles tournent en effort « low » pour limiter la réflexion facturée.
  const outputConfig = MODEL.startsWith("claude-haiku") ? { format } : { effort: "low" as const, format };

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 6000,
    output_config: outputConfig,
    // Sans effet tant que les consignes sont sous le minimum du modèle ; utile si elles grossissent.
    cache_control: { type: "ephemeral" },
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

  logCost(response.usage);
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("L'analyse de la photo n'a pas abouti. Essaie avec une photo plus nette.");
  }
  const analysis = tidy(response.parsed_output);
  analysisCache.set(key, analysis);
  return { analysis, demo: false };
}

/** Trace le coût réel de chaque analyse dans les journaux du serveur, pour mesurer avant de décider. */
function logCost(usage: Anthropic.Usage) {
  const [inPrice, outPrice] = PRICES[MODEL] ?? [0, 0];
  const input = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) * 1.25 + (usage.cache_read_input_tokens ?? 0) * 0.1;
  const cost = (input * inPrice + usage.output_tokens * outPrice) / 1_000_000;
  console.log(
    `[sosilook] analyse ${MODEL} : ${usage.input_tokens} tokens lus, ${usage.output_tokens} écrits, ≈ ${cost.toFixed(4)} $`,
  );
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
