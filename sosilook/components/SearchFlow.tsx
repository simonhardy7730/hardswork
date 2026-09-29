"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalyzeResponse, GarmentAnalysis, Mode, SearchResponse } from "@/lib/types";
import { BRAND_STORES } from "@/lib/retailers";
import { Ciseaux, DemoNotice, MetreRuban, UNIVERSE_LABEL } from "./ui";
import { Results } from "./Results";
import { LookResults, LookSetup, initialChoices, type LookChoice, type LookResult } from "./Look";

type Step = "photo" | "marque" | "resultats" | "look" | "look-resultats";

/** Côté le plus long de la photo envoyée : une image coûte environ (largeur × hauteur) / 750 tokens. */
const MAX_SIDE = 896;

/** Réduit la photo côté navigateur : envoi rapide et analyse moins chère. */
async function toResizedDataUrl(file: File): Promise<{ dataUrl: string; portrait: boolean }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Image illisible"));
      i.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), portrait: img.height > img.width * 1.15 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Le service ne répond pas. Réessaie dans un instant.");
  return json as T;
}

export interface Reopen {
  key: string;
  result: SearchResponse;
  image: string | null;
}

export function SearchFlow({
  reopen,
  onSearched,
  onCreateAlert,
}: {
  reopen: Reopen | null;
  onSearched: (result: SearchResponse, image: string) => void;
  onCreateAlert: (result: SearchResponse, image: string | null) => void;
}) {
  const [step, setStep] = useState<Step>("photo");
  const [image, setImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [analysis, setAnalysis] = useState<GarmentAnalysis | null>(null);
  // Tenue complète : toutes les pièces repérées, les choix par pièce et les résultats par pièce
  const [items, setItems] = useState<GarmentAnalysis[]>([]);
  const [isOutfit, setIsOutfit] = useState(false);
  const [choices, setChoices] = useState<LookChoice[]>([]);
  const [lookResults, setLookResults] = useState<LookResult[]>([]);
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [demoAnalysis, setDemoAnalysis] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | undefined>(undefined);
  const [canDescribe, setCanDescribe] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [resultKey, setResultKey] = useState(0); // remet à zéro tri et budget à chaque nouveau résultat
  const [busy, setBusy] = useState<null | "analyse" | Mode>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  // Rouvrir une recherche depuis le vestiaire
  useEffect(() => {
    if (!reopen) return;
    setImage(reopen.image);
    setIsOutfit(false);
    setAnalysis(reopen.result.analysis);
    setBrand(reopen.result.analysis.brand.name ?? "");
    setModel(reopen.result.analysis.model_guess ?? "");
    setResult(reopen.result);
    setResultKey((k) => k + 1);
    setStep("resultats");
  }, [reopen]);

  const scrollTop = () => setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choisis une image : une photo ou une capture d'écran.");
      return;
    }
    setError(null);
    try {
      const { dataUrl, portrait } = await toResizedDataUrl(file);
      setImage(dataUrl);
      setPortrait(portrait);
      await analyse(dataUrl, portrait);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de lire cette image.");
    }
  }

  async function analyse(dataUrl: string, portrait: boolean, description?: string) {
    setBusy("analyse");
    setError(null);
    try {
      const res = await postJson<AnalyzeResponse>("/api/analyze", {
        image: dataUrl,
        hint: (description ?? hint).trim() || undefined,
        portrait, // ne sert qu'au mode démo
      });
      setDemoAnalysis(res.demo);
      setDemoNotice(res.notice);
      setCanDescribe(res.canDescribe === true);
      setItems(res.items);
      setIsOutfit(res.isOutfit);
      if (res.isOutfit) {
        setChoices(initialChoices(res.items));
        setLookResults([]);
        setOpenItem(null);
        setStep("look");
      } else {
        const first = res.items[0];
        setAnalysis(first);
        setBrand(first.brand.name ?? "");
        setModel(first.model_guess ?? "");
        setStep("marque");
      }
      scrollTop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  async function search(mode: Mode) {
    if (!analysis) return;
    setBusy(mode);
    setError(null);
    try {
      const res = await postJson<SearchResponse>("/api/search", {
        analysis,
        mode,
        brand: brand.trim() || null,
        model: model.trim() || null,
      });
      setResult(res);
      setResultKey((k) => k + 1);
      setStep("resultats");
      if (image) onSearched(res, image);
      scrollTop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  /** Cherche toutes les pièces cochées du look, 3 à la fois, en affichant les résultats au fil de l'eau. */
  async function searchLook() {
    const todo = choices.map((c, i) => (c.include ? i : -1)).filter((i) => i >= 0);
    const next: LookResult[] = items.map(() => null);
    setLookResults([...next]);
    setOpenItem(null);
    setBusy("style");
    setError(null);
    setStep("look-resultats");
    scrollTop();

    const run = async (i: number) => {
      const c = choices[i];
      try {
        const res = await postJson<SearchResponse>("/api/search", {
          analysis: items[i],
          mode: c.mode,
          brand: c.brand.trim() || null,
          model: c.model.trim() || null,
        });
        next[i] = res;
        if (image) onSearched(res, image);
      } catch (e) {
        next[i] = { error: e instanceof Error ? e.message : "Recherche impossible pour cette pièce." };
      }
      setLookResults([...next]);
    };
    const queue = [...todo];
    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, async () => {
        while (queue.length) await run(queue.shift()!);
      }),
    );
    setBusy(null);
  }

  function restart() {
    setStep("photo");
    setImage(null);
    setAnalysis(null);
    setItems([]);
    setIsOutfit(false);
    setLookResults([]);
    setOpenItem(null);
    setResult(null);
    setHint("");
    setError(null);
    scrollTop();
  }

  const steps: Array<[Step, string]> = isOutfit
    ? [
        ["photo", "Photo"],
        ["look", "Le look"],
        ["look-resultats", "Résultats"],
      ]
    : [
        ["photo", "Photo"],
        ["marque", "Marque"],
        ["resultats", "Résultats"],
      ];
  const stepIndex = steps.findIndex(([s]) => s === step);
  const openResult = openItem != null ? lookResults[openItem] : null;

  return (
    <div ref={top} className="scroll-mt-24">
      {/* Fil des étapes : un vrai ordre, donc numéroté */}
      <ol className="mb-8 flex items-center gap-0 font-mono text-[11px] uppercase tracking-[0.14em]">
        {steps.map(([s, label], i) => {
          const reached = i <= stepIndex;
          const clickable = i < stepIndex && !(s === "marque" && !analysis) && !(s === "look" && busy !== null);
          return (
            <li key={s} className="flex items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`mx-2 h-0 w-5 border-t-[1.5px] border-dashed sm:w-16 ${reached ? "border-fil" : "border-encre/25"}`}
                />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => {
                  setOpenItem(null);
                  if (s === "photo") restart();
                  else setStep(s);
                }}
                className={`flex items-center gap-2 ${reached ? "text-encre" : "text-craie/70"} ${clickable ? "hover:text-fil-fonce" : ""}`}
                aria-current={s === step ? "step" : undefined}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border-[1.5px] text-[11px] ${
                    s === step ? "border-fil bg-fil text-white" : reached ? "border-encre" : "border-encre/25"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={s === step ? "" : "hidden sm:inline"}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {step === "photo" && (
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <div>
            <h1 className="display text-[44px] uppercase text-denim sm:text-[68px]">
              Tu l&apos;as vu.
              <br />
              <span className="text-fil">On le trouve.</span>
            </h1>
            <MetreRuban className="-mx-4 mt-7 sm:mx-0 sm:max-w-md" />
            <p className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-encre/80">
              Une veste croisée dans la rue, une montre sur une photo, un sac dans une vidéo. Montre-la nous :
              on retrouve <strong className="font-semibold text-encre">la pièce exacte au meilleur prix</strong>, chez
              des vendeurs sûrs, ou <strong className="font-semibold text-encre">son sosie</strong> pour beaucoup moins.
            </p>
            <p className="mt-4 max-w-[52ch] border-l-2 border-fil pl-3 text-[15px] text-encre/80">
              <strong className="font-semibold text-encre">Une tenue entière te plaît ?</strong> Envoie la photo de la
              personne : on repère chaque pièce, de la tête aux pieds, et on te recompose le look.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-wider text-craie">
              {["Vêtements", "Chaussures", "Sacs & sacoches", "Montres", "Bijoux", "Lunettes"].map((u) => (
                <li key={u} className="flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-fil" />
                  {u}
                </li>
              ))}
            </ul>
          </div>

          {/* Pièce de patron : la zone photo */}
          <div className="relative bg-white p-5 shadow-etiquette sm:p-7">
            <div className="mb-4 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-craie">
              <span>Pièce n° 1 · ta photo</span>
              <span>Couper 1×</span>
            </div>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFile(e.dataTransfer.files?.[0]);
              }}
              disabled={busy === "analyse"}
              className={`group relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden border-[1.5px] border-dashed transition-colors ${
                dragOver ? "border-fil bg-fil-clair/40" : "border-encre/35 bg-patron hover:border-fil"
              }`}
            >
              {/* Crans de montage aux quatre coins */}
              {["left-0 top-0", "right-0 top-0 rotate-90", "bottom-0 right-0 rotate-180", "bottom-0 left-0 -rotate-90"].map((pos) => (
                <span key={pos} aria-hidden className={`absolute h-4 w-4 border-l-2 border-t-2 border-denim ${pos}`} />
              ))}
              {image ? (
                <img src={image} alt="Ta photo" className="h-full w-full object-contain" />
              ) : (
                <span className="px-6 text-center">
                  <span className="display block text-2xl uppercase text-denim sm:text-3xl">Dépose ta photo</span>
                  <span className="mt-2 block text-sm text-craie">ou touche ici pour la prendre / la choisir</span>
                </span>
              )}
              {busy === "analyse" && (
                <span className="absolute inset-x-0 bottom-0 bg-denim px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-[#F4EFE6]">
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-fil align-middle" />
                  On examine la photo : pièces, marques, matières…
                </span>
              )}
            </button>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

            <div className="mt-5 flex items-center gap-2 text-craie">
              <Ciseaux className="shrink-0 -scale-x-100" />
              <span className="decoupe flex-1" />
            </div>

            <label htmlFor="hint" className="mt-4 block font-mono text-[11px] uppercase tracking-[0.14em] text-craie">
              Une précision ? (facultatif)
            </label>
            <input
              id="hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="« juste la veste », « la montre, pas le pull »…"
              className="mt-2 w-full border-b-[1.5px] border-encre/20 bg-transparent py-2 text-[15px] outline-none placeholder:text-craie/60 focus:border-fil"
            />
            {error && <p className="mt-4 border-l-2 border-alerte pl-3 text-sm text-alerte">{error}</p>}
          </div>
        </div>
      )}

      {step === "marque" && analysis && !(demoAnalysis && canDescribe) && (
        <ConfirmBrand
          image={image}
          analysis={analysis}
          demo={demoAnalysis}
          demoNotice={demoNotice}
          canDescribe={canDescribe}
          onDescribe={(text) => image && analyse(image, portrait, text)}
          brand={brand}
          setBrand={setBrand}
          model={model}
          setModel={setModel}
          busy={busy}
          error={error}
          onSearch={search}
          onRestart={restart}
        />
      )}

      {/* La photo n'a pas pu être envoyée : on demande une description plutôt que d'afficher l'exemple */}
      {(step === "look" || step === "marque") && demoAnalysis && canDescribe && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
          <div className="mx-auto w-full max-w-[340px]">
            {image && (
              <div className="bg-white p-2 shadow-etiquette">
                <img src={image} alt="Ta photo" className="block w-full bg-patron" />
              </div>
            )}
            <button type="button" onClick={restart} className="mt-3 w-full py-1 font-mono text-xs uppercase tracking-wider text-craie hover:text-fil-fonce">
              ← Changer de photo
            </button>
          </div>
          <div>
            <DemoNotice
              notice={demoNotice}
              what="analyse d'exemple"
              canDescribe
              onDescribe={(text) => image && analyse(image, portrait, text)}
              busy={busy === "analyse"}
            />
            {error && <p className="mt-4 border-l-2 border-alerte pl-3 text-sm text-alerte">{error}</p>}
          </div>
        </div>
      )}

      {step === "look" && !(demoAnalysis && canDescribe) && (
        <LookSetup
          image={image}
          items={items}
          choices={choices}
          setChoices={setChoices}
          demo={demoAnalysis}
          demoNotice={demoNotice}
          canDescribe={canDescribe}
          onDescribe={(text) => image && analyse(image, portrait, text)}
          busy={busy !== null}
          error={error}
          onSearch={searchLook}
          onRestart={restart}
        />
      )}

      {step === "look-resultats" && openItem == null && (
        <LookResults
          image={image}
          items={items}
          choices={choices}
          results={lookResults}
          onOpen={(i) => {
            setOpenItem(i);
            scrollTop();
          }}
          onEdit={() => setStep("look")}
          onRestart={restart}
        />
      )}

      {step === "look-resultats" && openResult && "offers" in openResult && (
        <Results
          key={`look-${openItem}`}
          result={openResult}
          image={image}
          backLabel="← Retour au look"
          onRestart={() => {
            setOpenItem(null);
            scrollTop();
          }}
          onEditBrand={() => {
            setOpenItem(null);
            setStep("look");
          }}
          onCreateAlert={() => onCreateAlert(openResult, image)}
        />
      )}

      {step === "resultats" && result && (
        <Results
          key={resultKey}
          result={result}
          image={image}
          onRestart={restart}
          onEditBrand={() => setStep("marque")}
          onCreateAlert={() => onCreateAlert(result, image)}
        />
      )}
    </div>
  );
}

function ConfirmBrand({
  image,
  analysis: a,
  demo,
  demoNotice,
  canDescribe,
  onDescribe,
  brand,
  setBrand,
  model,
  setModel,
  busy,
  error,
  onSearch,
  onRestart,
}: {
  image: string | null;
  analysis: GarmentAnalysis;
  demo: boolean;
  demoNotice?: string;
  canDescribe?: boolean;
  onDescribe?: (text: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  busy: null | "analyse" | Mode;
  error: string | null;
  onSearch: (m: Mode) => void;
  onRestart: () => void;
}) {
  const guessed = a.brand.name;
  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div className="mx-auto h-fit w-full max-w-[260px] self-start bg-white p-3 shadow-etiquette lg:max-w-none">
        {image && <img src={image} alt="Ta photo" className="aspect-square w-full bg-patron object-contain" />}
        <button type="button" onClick={onRestart} className="mt-3 w-full py-1 font-mono text-xs uppercase tracking-wider text-craie hover:text-fil-fonce">
          ← Changer de photo
        </button>
      </div>

      <div>
        <DemoNotice
          demo={demo}
          notice={demoNotice}
          what="analyse d'exemple"
          canDescribe={canDescribe}
          onDescribe={onDescribe}
          busy={busy === "analyse"}
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-craie">
          {UNIVERSE_LABEL[a.universe] ?? a.universe} · {a.category}
        </p>
        <h2 className="display mt-2 text-3xl !leading-[1.04] text-denim sm:text-[44px]">{a.title}</h2>
        <p className="mt-3 max-w-[60ch] text-encre/75">{a.description}</p>

        <div className="mt-8 max-w-xl">
          <h3 className="etendu text-lg font-bold">
            {guessed ? (
              <>
                On pense que c&apos;est du <span className="text-fil-fonce">{guessed}</span>. C&apos;est bien ça ?
              </>
            ) : (
              "On n'a pas reconnu la marque. Tu la connais ?"
            )}
          </h3>
          {guessed && (
            <p className="mt-1 text-sm text-craie">
              Indices : {a.brand.clues} <span className="font-mono text-xs uppercase">· confiance {a.brand.confidence}</span>
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr]">
            <div>
              <label htmlFor="brand" className="font-mono text-[11px] uppercase tracking-[0.14em] text-craie">
                Marque
              </label>
              <input
                id="brand"
                list="brand-list"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="ex. Lacoste, Seiko, Polène…"
                className="mt-1 w-full border-b-[1.5px] border-encre/25 bg-transparent py-2 text-lg font-semibold outline-none focus:border-fil"
              />
              <datalist id="brand-list">
                {BRAND_STORES.map((b) => (
                  <option key={b} value={b.replace(/\b\w/g, (c) => c.toUpperCase())} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="model" className="font-mono text-[11px] uppercase tracking-[0.14em] text-craie">
                Modèle / référence (facultatif)
              </label>
              <input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex. L.12.12, SRPD, Numéro Un"
                className="mt-1 w-full border-b-[1.5px] border-encre/25 bg-transparent py-2 text-lg outline-none focus:border-fil"
              />
            </div>
          </div>
          {brand && (
            <button type="button" onClick={() => { setBrand(""); setModel(""); }} className="mt-3 text-sm text-craie underline decoration-dashed underline-offset-4 hover:text-encre">
              Je ne connais pas la marque
            </button>
          )}
        </div>

        <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!brand.trim() || busy !== null}
            onClick={() => onSearch("exact")}
            className="surpiqure group bg-denim p-5 text-left text-[#F4EFE6] transition hover:bg-denim-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil">La pièce exacte</span>
            <span className="etendu mt-1 block text-xl font-bold">
              {busy === "exact" ? "On compare les prix…" : "Au meilleur prix"}
            </span>
            <span className="mt-1 block text-sm text-[#F4EFE6]/70">Vendeurs officiels, revendeurs reconnus, seconde main authentifiée.</span>
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => onSearch("style")}
            className="surpiqure bg-white p-5 text-left shadow-etiquette transition hover:bg-fil-clair/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">Son sosie</span>
            <span className="etendu mt-1 block text-xl font-bold text-denim">
              {busy === "style" ? "On cherche ses sosies…" : "Le même style, moins cher"}
            </span>
            <span className="mt-1 block text-sm text-craie">Des pièces qui y ressemblent le plus, sans logo copié.</span>
          </button>
        </div>
        {!brand.trim() && (
          <p className="mt-3 text-sm text-craie">Sans marque, on peut quand même te trouver ses sosies.</p>
        )}
        {error && <p className="mt-4 border-l-2 border-alerte pl-3 text-sm text-alerte">{error}</p>}
      </div>
    </div>
  );
}

