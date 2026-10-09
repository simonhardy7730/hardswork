"use client";

import { useRef } from "react";
import type { AnalyzeResponse, Gender } from "@/lib/types";
import { GENDER_LABEL } from "@/lib/gender";

export interface Tenue {
  image: string;
  portrait: boolean;
  /** Moment de la vidéo (secondes), absent pour une capture. */
  time?: number;
  selected: boolean;
  status: "attente" | "analyse" | "ok" | "erreur";
  result?: AnalyzeResponse;
  error?: string;
}

const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

function summary(r: AnalyzeResponse): string {
  const n = r.items.length;
  const genders = Array.from(new Set(r.items.map((it) => it.gender).filter((g) => g !== "mixte"))) as Gender[];
  const who = genders.length === 1 ? ` · ${GENDER_LABEL[genders[0]]}` : "";
  return `${n} pièce${n > 1 ? "s" : ""}${who}`;
}

/** Les tenues trouvées dans une vidéo ou des captures : à faire défiler, cocher, analyser, ouvrir. */
export function TenuesStep({
  tenues,
  fromVideo,
  busy,
  onToggle,
  onAnalyze,
  onOpen,
  onRestart,
}: {
  tenues: Tenue[];
  fromVideo: boolean;
  busy: boolean;
  onToggle: (i: number) => void;
  onAnalyze: () => void;
  onOpen: (i: number) => void;
  onRestart: () => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const toAnalyze = tenues.filter((t) => t.selected && t.status !== "ok").length;
  const done = tenues.filter((t) => t.status === "ok").length;

  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector("li");
    if (el && card) el.scrollBy({ left: dir * (card.getBoundingClientRect().width + 16), behavior: "smooth" });
  };

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">Plusieurs tenues</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="display mt-1 text-3xl !leading-[1.04] text-denim sm:text-[44px]">
          {tenues.length} tenues {fromVideo ? "trouvées dans ta vidéo" : "dans tes captures"}
        </h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Tenue précédente" className="grid h-10 w-10 place-items-center border-[1.5px] border-denim text-denim hover:bg-denim hover:text-[#F4EFE6]">
            ←
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Tenue suivante" className="grid h-10 w-10 place-items-center border-[1.5px] border-denim text-denim hover:bg-denim hover:text-[#F4EFE6]">
            →
          </button>
        </div>
      </div>
      <p className="mt-3 max-w-[62ch] text-encre/75">
        Fais défiler les tenues, décoche celles qui ne t&apos;intéressent pas, puis lance l&apos;analyse : on repère
        chaque pièce de chaque tenue. Ensuite, touche une tenue pour voir son look.
      </p>

      {/* Le rail : on fait glisser du doigt, chaque carte se cale */}
      <div ref={rail} className="-mx-4 mt-6 snap-x snap-mandatory overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        <ol className="flex gap-4">
          {tenues.map((t, i) => (
            <li key={i} className="w-[72%] shrink-0 snap-start sm:w-[230px]">
              <div className={`bg-white p-2 shadow-etiquette transition-opacity ${t.selected ? "" : "opacity-50"}`}>
                <div className="relative">
                  <img src={t.image} alt={`Tenue ${i + 1}`} className="aspect-[3/4] w-full bg-patron object-cover" />
                  <span className="absolute left-2 top-2 bg-denim px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#F4EFE6]">
                    Tenue {i + 1}
                    {t.time != null && <span className="ml-1.5 font-normal text-[#F4EFE6]/70">{clock(t.time)}</span>}
                  </span>
                  {t.status !== "ok" && (
                    <label className="absolute right-2 top-2 flex cursor-pointer items-center gap-1.5 bg-white/90 px-2 py-1 text-xs font-semibold">
                      <input type="checkbox" checked={t.selected} onChange={() => onToggle(i)} disabled={busy} className="h-4 w-4 accent-[#D9822B]" />
                      Analyser
                    </label>
                  )}
                </div>
                <div className="min-h-[52px] px-1 pb-1 pt-2.5 text-sm">
                  {t.status === "attente" && <p className="text-craie">{t.selected ? "Prête à analyser" : "Ignorée"}</p>}
                  {t.status === "analyse" && (
                    <p className="font-mono text-xs uppercase tracking-wider text-denim">
                      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-fil align-middle" />
                      Analyse…
                    </p>
                  )}
                  {t.status === "erreur" && <p className="text-xs text-alerte">{t.error}</p>}
                  {t.status === "ok" && t.result && (
                    <button type="button" onClick={() => onOpen(i)} className="w-full text-left">
                      <span className="block font-mono text-[11px] uppercase tracking-wider text-craie">{summary(t.result)}</span>
                      <span className="mt-0.5 block font-semibold text-denim underline decoration-dashed underline-offset-4 hover:text-fil-fonce">
                        Voir ce look →
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {toAnalyze > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={onAnalyze}
            className="surpiqure bg-denim px-5 py-4 text-left text-[#F4EFE6] transition hover:bg-denim-700 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[320px]"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil">Plusieurs tenues</span>
            <span className="etendu mt-0.5 block text-xl font-bold">
              {busy ? "Analyse des tenues…" : `Analyser ${toAnalyze > 1 ? `les ${toAnalyze} tenues` : "la tenue"}`}
            </span>
          </button>
        )}
        {done > 0 && !busy && (
          <p className="text-sm text-encre/75">
            {done} tenue{done > 1 ? "s" : ""} analysée{done > 1 ? "s" : ""} : touche « Voir ce look ».
          </p>
        )}
        <button type="button" onClick={onRestart} className="font-mono text-xs uppercase tracking-wider text-craie hover:text-fil-fonce">
          ← Autre photo ou vidéo
        </button>
      </div>
    </div>
  );
}

/** Barre « Tenue 2 / 5 » pour passer d'un look à l'autre (aussi au doigt : glisser à gauche ou à droite). */
export function TenueNav({
  index,
  count,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onAll,
}: {
  index: number;
  count: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onAll: () => void;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3 border-y border-dashed border-encre/20 py-2.5">
      <button type="button" onClick={onAll} className="font-mono text-xs uppercase tracking-wider text-craie hover:text-fil-fonce">
        ← Toutes les tenues
      </button>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrev} disabled={!canPrev} aria-label="Tenue précédente" className="grid h-8 w-8 place-items-center border border-denim text-denim disabled:opacity-30">
          ←
        </button>
        <span className="font-mono text-xs font-semibold uppercase tracking-wider">
          Tenue {index + 1} / {count}
        </span>
        <button type="button" onClick={onNext} disabled={!canNext} aria-label="Tenue suivante" className="grid h-8 w-8 place-items-center border border-denim text-denim disabled:opacity-30">
          →
        </button>
      </div>
    </div>
  );
}
