"use client";

import type { WardrobeItem } from "@/lib/storage";
import { UNIVERSE_LABEL, euros } from "./ui";

export function Wardrobe({
  items,
  onOpen,
  onClear,
  onGoSearch,
}: {
  items: WardrobeItem[];
  onOpen: (item: WardrobeItem) => void;
  onClear: () => void;
  onGoSearch: () => void;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">Historique</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display mt-1 text-4xl uppercase text-denim sm:text-[56px]">Mon vestiaire</h1>
        {items.length > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-craie underline decoration-dashed underline-offset-4 hover:text-alerte">
            Vider le vestiaire
          </button>
        )}
      </div>
      <p className="mt-5 max-w-[58ch] text-encre/75">Toutes les pièces que tu as cherchées, pour y revenir en un geste.</p>

      {items.length === 0 ? (
        <div className="mt-10 max-w-xl border-[1.5px] border-dashed border-encre/25 bg-white/60 p-8">
          <p className="etendu text-lg font-bold">Ton vestiaire est vide.</p>
          <p className="mt-1 text-craie">Chaque recherche viendra s&apos;y ranger automatiquement.</p>
          <button type="button" onClick={onGoSearch} className="mt-5 bg-encre px-4 py-2.5 text-sm font-semibold text-[#F4EFE6] hover:bg-fil">
            Chercher une pièce
          </button>
        </div>
      ) : (
        /* Une tringle et des cintres */
        <div className="mt-10">
          <div aria-hidden className="h-2 rounded-full bg-gradient-to-b from-[#C9C6BC] via-[#F1EFE8] to-[#9C998F] shadow-sm" />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <li key={it.id} className="flex flex-col items-center">
                <svg aria-hidden width="46" height="30" viewBox="0 0 46 30" className="-mt-1 text-craie">
                  <path d="M23 2c3 0 4 2 4 4s-4 3-4 6M23 12 3 26h40L23 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                <button
                  type="button"
                  onClick={() => onOpen(it)}
                  className="group -mt-1 w-full bg-white p-2 text-left shadow-etiquette transition hover:-translate-y-0.5"
                >
                  {it.thumb ? (
                    <img src={it.thumb} alt="" className="aspect-square w-full bg-patron object-contain" />
                  ) : (
                    <div className="aspect-square w-full bg-patron" />
                  )}
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-craie">
                    {UNIVERSE_LABEL[it.result.analysis.universe]} · {it.result.mode === "exact" ? "exacte" : "sosie"}
                  </p>
                  <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-fil-fonce">
                    {it.result.analysis.title}
                  </p>
                  <p className="mt-1 font-mono text-sm tabular-nums">{euros(it.result.bestPrice)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
