"use client";

import { useMemo, useState } from "react";
import type { ScoredOffer, SearchResponse } from "@/lib/types";
import { Cloche, Jauge, TRUST_STYLE, UNIVERSE_LABEL, euros } from "./ui";

type SortKey = "overall" | "price" | "quality";

export function Results({
  result,
  image,
  onRestart,
  onEditBrand,
  onCreateAlert,
}: {
  result: SearchResponse;
  image: string | null;
  onRestart: () => void;
  onEditBrand: () => void;
  onCreateAlert: () => void;
}) {
  const prices = result.offers.map((o) => o.price).filter((p): p is number => p != null);
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const [sort, setSort] = useState<SortKey>("overall");
  const [budget, setBudget] = useState(maxPrice);
  const [alertSet, setAlertSet] = useState(false);

  const shown = useMemo(() => {
    const list = result.offers.filter((o) => o.price == null || o.price <= budget);
    if (sort === "price") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "quality") list.sort((a, b) => b.quality - a.quality);
    return list;
  }, [result, sort, budget]);

  return (
    <div>
      {result.demo && (
        <p className="mb-6 bg-fil-clair px-4 py-2.5 font-mono text-xs text-fil-fonce">
          Mode démo : ces offres sont des exemples. Ajoute la clé SerpApi pour chercher les vraies offres du moment.
        </p>
      )}
      {result.notes.map((n) => (
        <p key={n} className="mb-4 border-l-2 border-fil pl-3 text-sm">
          {n}
        </p>
      ))}

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          {image && (
            <div className="bg-white p-2 shadow-etiquette">
              <img src={image} alt="Ta photo" className="aspect-square w-full bg-patron object-contain" />
            </div>
          )}
          <CareLabel result={result} onEditBrand={onEditBrand} />
          <button type="button" onClick={onRestart} className="mt-4 w-full py-1 font-mono text-xs uppercase tracking-wider text-craie hover:text-fil-fonce">
            ← Nouvelle photo
          </button>
        </aside>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">
                {result.mode === "exact" ? "La pièce exacte" : "Ses sosies"}
              </p>
              <h2 className="display mt-1 text-3xl text-denim sm:text-[40px]">
                {result.mode === "exact" ? "Où l'acheter moins cher" : "Ce qui lui ressemble le plus"}
              </h2>
              <p className="mt-1 text-sm text-craie">
                {result.offers.length} offres notées
                {result.bestPrice != null && (
                  <>
                    {" · "}meilleur prix <strong className="text-encre">{euros(result.bestPrice)}</strong>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onCreateAlert();
                setAlertSet(true);
              }}
              disabled={alertSet}
              className="inline-flex items-center gap-2 border-[1.5px] border-denim px-4 py-2.5 text-sm font-semibold text-denim transition hover:bg-denim hover:text-[#F4EFE6] disabled:border-ok disabled:text-ok disabled:hover:bg-transparent"
            >
              <Cloche />
              {alertSet ? "Alerte créée · onglet Mes alertes" : "M'alerter d'une promo"}
            </button>
          </div>

          {/* Réglages : tri + budget */}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-encre/10 py-4">
            <div className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider" role="group" aria-label="Trier">
              {(
                [
                  ["overall", "Recommandé"],
                  ["price", "Prix"],
                  ["quality", "Qualité"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSort(k)}
                  aria-pressed={sort === k}
                  className={`px-2.5 py-1.5 ${sort === k ? "bg-denim text-[#F4EFE6]" : "text-craie hover:text-encre"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            {maxPrice > 0 && (
              <label className="flex flex-1 items-center gap-3 text-sm sm:max-w-xs">
                <span className="font-mono text-xs uppercase tracking-wider text-craie">Budget</span>
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={1}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="flex-1 accent-[#D9822B]"
                />
                <span className="w-16 text-right font-mono tabular-nums">{euros(budget).replace(",00", "")}</span>
              </label>
            )}
          </div>

          {shown.length === 0 ? (
            <p className="mt-8 text-craie">
              Aucune offre dans ce budget. Monte un peu le curseur, ou essaie l&apos;autre mode.
            </p>
          ) : (
            <ol className="mt-6 space-y-4">
              {shown.map((o, i) => (
                <PriceTag key={o.id} offer={o} rank={i + 1} />
              ))}
            </ol>
          )}
          <p className="mt-8 text-xs text-craie">
            Le classement ne dépend jamais d&apos;une commission. Certains liens pourront être affiliés.
          </p>
        </div>
      </div>
    </div>
  );
}

/** La fiche de la pièce, présentée comme une étiquette de composition cousue. */
function CareLabel({ result, onEditBrand }: { result: SearchResponse; onEditBrand: () => void }) {
  const a = result.analysis;
  const rows: Array<[string, string | null]> = [
    ["Marque", a.brand.name],
    ["Modèle", a.model_guess],
    ["Matière", a.material_guess],
    ["Coupe", a.fit],
    ["Couleur", a.colors.join(", ")],
    ["Prix boutique", a.estimated_retail_price_eur ? `≈ ${euros(a.estimated_retail_price_eur)}` : null],
  ];
  return (
    <div className="compo mx-3 -mt-1 px-5 pb-5 pt-6">
      {/* Pli cousu en haut de l'étiquette */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-2 border-b border-dashed border-fil bg-patron-carton" />
      <p className="text-center text-[11px] uppercase tracking-[0.2em] text-craie">
        {UNIVERSE_LABEL[a.universe] ?? a.universe}
      </p>
      <p className="etendu mt-1 text-center font-sans text-[17px] font-bold leading-tight">{a.title}</p>
      <dl className="mt-4 space-y-1.5 uppercase">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-dotted border-encre/15 pb-1">
              <dt className="text-craie">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
      </dl>
      <button type="button" onClick={onEditBrand} className="mt-2 text-[11px] uppercase tracking-wider text-fil-fonce underline decoration-dashed underline-offset-4">
        Corriger la marque
      </button>
      <p className="mt-5 text-[11px] uppercase tracking-[0.16em] text-craie">Pour juger la qualité</p>
      <ul className="mt-2 space-y-2 font-sans text-[13px] normal-case leading-snug">
        {a.quality_checklist.map((q) => (
          <li key={q} className="grid grid-cols-[14px_1fr] gap-2">
            <span aria-hidden className="mt-1.5 h-2 w-2 rotate-45 border border-fil" />
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Une offre = une étiquette de prix volante, percée et attachée par un fil. */
function PriceTag({ offer: o, rank }: { offer: ScoredOffer; rank: number }) {
  return (
    <li className="relative flex bg-white shadow-etiquette">
      {/* Talon de l'étiquette : œillet + rang */}
      <div className="relative flex w-14 shrink-0 flex-col items-center border-r border-dashed border-encre/20 bg-patron-carton pt-4 sm:w-16">
        <span aria-hidden className="h-3.5 w-3.5 rounded-full border-2 border-encre/30 bg-[#F7F7F4]" />
        <span className="display mt-3 text-2xl text-denim">{rank}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:p-5">
        {o.thumbnail && (
          <img src={o.thumbnail} alt="" className="h-20 w-20 shrink-0 bg-patron object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="etendu text-[15px] font-bold">{o.seller}</span>
            <span className={`puce ${TRUST_STYLE[o.trust]}`}>{o.trustLabel}</span>
            {o.secondHand && <span className="puce bg-patron-carton text-craie">Seconde main</span>}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-encre/75">{o.title}</p>
          <div className="mt-3 space-y-1">
            <Jauge label="Note" value={o.overall} fort />
            <Jauge label="Qualité" value={o.quality} />
            <Jauge label="Prix" value={o.priceScore} />
          </div>
          <details className="mt-2 text-xs text-craie">
            <summary className="cursor-pointer select-none hover:text-encre">Le détail de la note</summary>
            <ul className="mt-1.5 space-y-0.5 pl-1">
              {o.qualityReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
          {o.warnings.map((w) => (
            <p key={w} className="mt-2 text-xs font-semibold text-alerte">
              ⚠ {w}
            </p>
          ))}
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-dashed border-encre/15 pt-3 sm:w-36 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="sm:text-right">
            <div className="font-mono text-xl font-semibold tabular-nums">{euros(o.price)}</div>
            {o.savingsPct != null && o.savingsPct > 0 && (
              <div className="font-mono text-xs font-semibold text-ok">−{o.savingsPct} % vs boutique</div>
            )}
          </div>
          <a
            href={o.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="bg-encre px-3.5 py-2 text-sm font-semibold text-[#F4EFE6] transition hover:bg-fil"
          >
            Voir l&apos;offre
          </a>
        </div>
      </div>
    </li>
  );
}
