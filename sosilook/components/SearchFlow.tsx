"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalyzeResponse, GarmentAnalysis, Gender, Mode, SearchResponse } from "@/lib/types";
import { BRAND_STORES } from "@/lib/retailers";
import { Ciseaux, DemoNotice, GenderPicker, MetreRuban, UNIVERSE_LABEL } from "./ui";
import { Results } from "./Results";
import { LookResults, LookSetup, initialChoices, type LookChoice, type LookResult } from "./Look";
import { TenueNav, TenuesStep, type Tenue } from "./Tenues";
import { extractOutfitFrames } from "@/lib/frames";

type Step = "photo" | "tenues" | "marque" | "resultats" | "look" | "look-resultats";

/** Nombre maximum de tenues analysées depuis une vidéo ou des captures (une analyse chacune). */
const MAX_TENUES = 8;

/** Côté le plus long de la photo envoyée : une image coûte environ (largeur × hauteur) / 750 tokens. */
const MAX_SIDE = 896;

/** Réduit la photo côté navigateur : envoi rapide et analyse moins chère. */
async function toResizedDataUrl(file: File): Promise<{ dataUrl: string; portrait: boolean }> {
  const url = URL.createObjectURL(file);
  try {
    return await resizeSrc(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Réduit une image déjà chargée (adresse blob: ou data:). */
async function resizeSrc(url: string): Promise<{ dataUrl: string; portrait: boolean }> {
  {
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
  const [gender, setGender] = useState<Gender>("mixte");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [resultKey, setResultKey] = useState(0); // remet à zéro tri et budget à chaque nouveau résultat
  const [busy, setBusy] = useState<null | "analyse" | Mode>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // Plusieurs tenues (vidéo ou captures)
  const [tenues, setTenues] = useState<Tenue[]>([]);
  const [fromVideo, setFromVideo] = useState(false);
  const [activeTenue, setActiveTenue] = useState<number | null>(null);
  const [extracting, setExtracting] = useState<number | null>(null);
  const [link, setLink] = useState("");
  const [linkNotice, setLinkNotice] = useState<string | null>(null);
  const touchX = useRef<number | null>(null);
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
    setGender(reopen.result.analysis.gender ?? "mixte");
    setResult(reopen.result);
    setResultKey((k) => k + 1);
    setStep("resultats");
  }, [reopen]);

  const scrollTop = () => setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);

  /** Une photo → analyse directe. Une vidéo ou plusieurs captures → les tenues à faire défiler. */
  async function onFiles(list: FileList | null | undefined) {
    const files = Array.from(list ?? []).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (files.length === 0) {
      if (list?.length) setError("Choisis une photo, une capture d'écran ou une vidéo.");
      return;
    }
    setError(null);
    setLinkNotice(null);
    try {
      const frames: Array<{ dataUrl: string; portrait: boolean; time?: number }> = [];
      const video = files.some((f) => f.type.startsWith("video/"));
      if (video) setExtracting(0);
      for (const f of files) {
        if (frames.length >= MAX_TENUES) break;
        if (f.type.startsWith("video/")) {
          frames.push(
            ...(await extractOutfitFrames(f, {
              max: MAX_TENUES - frames.length,
              maxSide: MAX_SIDE,
              onProgress: (p) => setExtracting(p),
            })),
          );
        } else {
          frames.push(await toResizedDataUrl(f));
        }
      }
      setExtracting(null);
      if (frames.length === 0) throw new Error("Aucune image exploitable dans ce fichier.");

      // Une seule image (photo, ou vidéo d'une seule tenue) : analyse directe.
      if (frames.length === 1) {
        setTenues([]);
        setActiveTenue(null);
        setImage(frames[0].dataUrl);
        setPortrait(frames[0].portrait);
        await analyse(frames[0].dataUrl, frames[0].portrait);
        return;
      }
      setFromVideo(video);
      setTenues(frames.map((f) => ({ image: f.dataUrl, portrait: f.portrait, time: f.time, selected: true, status: "attente" })));
      setActiveTenue(null);
      setStep("tenues");
      scrollTop();
    } catch (e) {
      setExtracting(null);
      setError(e instanceof Error ? e.message : "Impossible de lire ce fichier.");
    }
  }

  /** Un lien TikTok, YouTube, Pinterest… → son image de couverture, analysée comme une photo. */
  async function fromLink() {
    const url = link.trim();
    if (!url) return;
    setBusy("analyse");
    setError(null);
    try {
      const res = await postJson<{ image: string; notice?: string }>("/api/link", { url });
      const { dataUrl, portrait } = await resizeSrc(res.image);
      setTenues([]);
      setActiveTenue(null);
      setImage(dataUrl);
      setPortrait(portrait);
      await analyse(dataUrl, portrait);
      setLinkNotice(res.notice ?? null);
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Ce lien n'a pas pu être lu.");
    }
  }

  /** Analyse les tenues cochées, deux à la fois ; chaque carte se met à jour dès que sa tenue est prête. */
  async function analyzeTenues() {
    const todo = tenues.map((t, i) => (t.selected && t.status !== "ok" ? i : -1)).filter((i) => i >= 0);
    const update = (i: number, patch: Partial<Tenue>) =>
      setTenues((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)));
    setBusy("analyse");
    setError(null);
    todo.forEach((i) => update(i, { status: "analyse", error: undefined }));
    const queue = [...todo];
    await Promise.all(
      Array.from({ length: Math.min(2, queue.length) }, async () => {
        while (queue.length) {
          const i = queue.shift()!;
          const t = tenues[i];
          try {
            const res = await postJson<AnalyzeResponse>("/api/analyze", {
              image: t.image,
              portrait: t.portrait,
              hint: hint.trim() || undefined,
            });
            update(i, { status: "ok", result: res });
          } catch (e) {
            update(i, { status: "erreur", error: e instanceof Error ? e.message : "Analyse impossible." });
          }
        }
      }),
    );
    setBusy(null);
  }

  /** Ouvre le look d'une tenue analysée (sans repayer l'analyse). */
  function openTenue(i: number) {
    const t = tenues[i];
    if (!t?.result) return;
    setActiveTenue(i);
    setImage(t.image);
    setPortrait(t.portrait);
    setLookResults([]);
    setOpenItem(null);
    setResult(null);
    setError(null);
    applyAnalysis(t.result);
    scrollTop();
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
      applyAnalysis(res);
      // Une description faite depuis une tenue de vidéo met à jour cette tenue.
      if (activeTenue != null) setTenues((prev) => prev.map((t, j) => (j === activeTenue ? { ...t, result: res } : t)));
      scrollTop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  function applyAnalysis(res: AnalyzeResponse) {
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
      setGender(first.gender);
      setStep("marque");
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
        gender,
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
          gender: c.gender,
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
    setTenues([]);
    setActiveTenue(null);
    setLinkNotice(null);
    setLink("");
    scrollTop();
  }

  const steps: Array<[Step, string]> = [
    ["photo", "Photo"],
    ...(tenues.length > 1 ? ([["tenues", "Tenues"]] as Array<[Step, string]>) : []),
    ...((isOutfit
      ? [
          ["look", "Le look"],
          ["look-resultats", "Résultats"],
        ]
      : [
          ["marque", "Marque"],
          ["resultats", "Résultats"],
        ]) as Array<[Step, string]>),
  ];
  const stepIndex = steps.findIndex(([s]) => s === step);

  // Navigation entre les tenues analysées d'une vidéo
  const analysed = tenues.map((t, i) => (t.status === "ok" ? i : -1)).filter((i) => i >= 0);
  const prevTenue = activeTenue != null ? analysed.filter((i) => i < activeTenue).pop() : undefined;
  const nextTenue = activeTenue != null ? analysed.find((i) => i > activeTenue) : undefined;
  const showTenueNav = tenues.length > 1 && activeTenue != null && step !== "photo" && step !== "tenues" && busy === null;
  const openResult = openItem != null ? lookResults[openItem] : null;

  return (
    <div
      ref={top}
      className="scroll-mt-24"
      onTouchStart={(e) => {
        touchX.current = showTenueNav ? e.touches[0].clientX : null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        // Glisser vers la gauche = tenue suivante, vers la droite = précédente (comme un carrousel)
        if (dx < -70 && nextTenue != null) openTenue(nextTenue);
        if (dx > 70 && prevTenue != null) openTenue(prevTenue);
      }}
    >
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

      {showTenueNav && activeTenue != null && (
        <TenueNav
          index={activeTenue}
          count={tenues.length}
          canPrev={prevTenue != null}
          canNext={nextTenue != null}
          onPrev={() => prevTenue != null && openTenue(prevTenue)}
          onNext={() => nextTenue != null && openTenue(nextTenue)}
          onAll={() => {
            setOpenItem(null);
            setStep("tenues");
            scrollTop();
          }}
        />
      )}

      {linkNotice && (step === "marque" || step === "look") && (
        <p className="mb-6 border-l-2 border-fil pl-3 text-sm text-encre/80">{linkNotice}</p>
      )}

      {step === "tenues" && (
        <TenuesStep
          tenues={tenues}
          fromVideo={fromVideo}
          busy={busy !== null}
          onToggle={(i) => setTenues((prev) => prev.map((t, j) => (j === i ? { ...t, selected: !t.selected } : t)))}
          onAnalyze={analyzeTenues}
          onOpen={openTenue}
          onRestart={restart}
        />
      )}

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
              personne : on repère chaque pièce, de la tête aux pieds, et on te recompose le look.{" "}
              <strong className="font-semibold text-encre">Une vidéo avec plusieurs tenues ?</strong> Dépose-la : on
              trouve chaque tenue, tu les fais défiler.
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
                onFiles(e.dataTransfer.files);
              }}
              disabled={busy === "analyse" || extracting !== null}
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
                  <span className="mt-2 block text-sm text-craie">ou ta vidéo, ou plusieurs captures · touche ici pour choisir</span>
                </span>
              )}
              {extracting !== null && (
                <span className="absolute inset-x-0 bottom-0 bg-denim px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-[#F4EFE6]">
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-fil align-middle" />
                  On repère les tenues de la vidéo… {Math.round(extracting * 100)} %
                </span>
              )}
              {busy === "analyse" && extracting === null && (
                <span className="absolute inset-x-0 bottom-0 bg-denim px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-[#F4EFE6]">
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-fil align-middle" />
                  On examine la photo : pièces, marques, matières…
                </span>
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />

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

            <form
              className="mt-5"
              onSubmit={(e) => {
                e.preventDefault();
                void fromLink();
              }}
            >
              <label htmlFor="link" className="block font-mono text-[11px] uppercase tracking-[0.14em] text-craie">
                Ou colle un lien (TikTok, YouTube, Pinterest…)
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="link"
                  type="url"
                  inputMode="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.tiktok.com/@…/video/…"
                  className="min-w-0 flex-1 border-b-[1.5px] border-encre/20 bg-transparent py-2 text-[15px] outline-none placeholder:text-craie/60 focus:border-fil"
                />
                <button
                  type="submit"
                  disabled={!link.trim() || busy !== null}
                  className="shrink-0 bg-encre px-4 py-2 text-sm font-semibold text-[#F4EFE6] hover:bg-fil disabled:opacity-40"
                >
                  Analyser
                </button>
              </div>
              <p className="mt-2 text-xs text-craie">
                Une vidéo avec plusieurs tenues ? Enregistre-la (ou fais un enregistrement d&apos;écran) et dépose-la
                plus haut : on repère chaque tenue.
              </p>
            </form>
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
          gender={gender}
          setGender={setGender}
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
  gender,
  setGender,
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
  gender: Gender;
  setGender: (g: Gender) => void;
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
          <div className="mt-5">
            <GenderPicker value={gender} onChange={setGender} />
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

