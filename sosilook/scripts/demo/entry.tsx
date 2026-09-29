/**
 * Version démo 100 % navigateur : le vrai site (même interface, mêmes calculs).
 * - /api/analyze : la photo est VRAIMENT analysée par Claude, via la capacité `sample`
 *   de la page publiée (mêmes consignes que le site). Si elle n'est pas disponible
 *   ou refusée, on retombe sur l'analyse d'exemple.
 * - /api/search : exécutée dans la page, en mode démo (offres d'exemple construites
 *   à partir de la pièce, liens vers une vraie recherche Google Shopping).
 */
import { createRoot } from "react-dom/client";
import { z } from "zod";
import Home from "@/app/page";
import { POST as analyzeDemo } from "@/app/api/analyze/route";
import { POST as search } from "@/app/api/search/route";
import { SYSTEM_PROMPT, tidy } from "@/lib/analyze";
import { PhotoAnalysisSchema, type AnalyzeResponse } from "@/lib/types";

type SampleFn = {
  json: (input: string, options?: { images?: Blob }) => Promise<unknown>;
  limits: () => Promise<{ images?: unknown }>;
};
type ClaudeRuntime = { use: (name: string) => Promise<unknown> };

const SCHEMA = JSON.stringify(z.toJSONSchema(PhotoAnalysisSchema));

let samplePromise: Promise<SampleFn | null> | null = null;
function getSample(): Promise<SampleFn | null> {
  const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude;
  if (!runtime) return Promise.resolve(null);
  samplePromise ??= (runtime.use("sample") as Promise<SampleFn | null>).then(async (s) => {
    if (!s) return null;
    const limits = await s.limits().catch(() => null);
    return limits?.images ? s : null;
  });
  return samplePromise;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, data] = dataUrl.split(",");
  const type = /data:([^;]+)/.exec(head)?.[1] ?? "image/jpeg";
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type });
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

async function analyze(req: Request): Promise<Response> {
  const body = (await req.clone().json()) as { image?: string; hint?: string };
  const sample = await getSample();
  if (!sample || !body.image) return analyzeDemo(req);

  const prompt = `${SYSTEM_PROMPT}

L'image jointe est la photo envoyée par l'utilisateur.${body.hint ? ` Précision de l'utilisateur : ${body.hint.slice(0, 300)}` : ""}

Réponds uniquement avec un objet JSON conforme à ce schéma JSON (tous les champs sont obligatoires) :
${SCHEMA}`;

  try {
    const raw = await sample.json(prompt, { images: dataUrlToBlob(body.image) });
    const parsed = PhotoAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: "L'analyse n'a pas donné un résultat lisible. Réessaie, ou essaie une photo plus nette." }, 500);
    }
    const analysis = tidy(parsed.data);
    if (!analysis.contains_fashion || analysis.items.length === 0) {
      return json({ error: "On ne voit pas d'article de mode sur cette photo. Essaie de cadrer la pièce." }, 422);
    }
    return json({
      items: analysis.items,
      isOutfit: analysis.is_outfit && analysis.items.length > 1,
      demo: false,
    } satisfies AnalyzeResponse);
  } catch (e) {
    const code = (e as { code?: string })?.code;
    // Pas d'autorisation, ou Claude indisponible dans cette vue : on montre l'exemple.
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed", "images_unavailable"].includes(code ?? "")) {
      return analyzeDemo(req);
    }
    const messages: Record<string, string> = {
      rate_limited: "Trop de photos d'un coup : attends un peu avant de réessayer.",
      image_rejected: "Cette image n'a pas pu être lue. Essaie une autre photo (JPEG ou PNG).",
      refused: "Cette photo n'a pas pu être analysée. Essaie une autre photo.",
      invalid_json: "L'analyse n'a pas donné un résultat lisible. Réessaie.",
      session_expired: "Ta session a expiré : reconnecte-toi à Claude puis réessaie.",
    };
    return json({ error: messages[code ?? ""] ?? "L'analyse n'a pas abouti. Réessaie dans un instant." }, 500);
  }
}

const ROUTES: Record<string, (req: Request) => Promise<Response>> = {
  "/api/analyze": analyze,
  "/api/search": search,
};

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
  const route = ROUTES[url];
  if (!route) return realFetch(input, init);
  if (url === "/api/search") await new Promise((r) => setTimeout(r, 600)); // comme une vraie recherche
  return route(new Request(`https://demo.sosilook${url}`, init));
};

// Prépare la capacité dès le chargement (ne demande rien à l'utilisateur).
void getSample();

createRoot(document.getElementById("sosilook-root")!).render(<Home />);
