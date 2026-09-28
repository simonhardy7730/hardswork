"use client";

import type { GarmentAnalysis, Mode, SearchResponse } from "@/lib/types";
import { BRAND_STORES } from "@/lib/retailers";
import { ImpactBadge, TRUST_STYLE, UNIVERSE_LABEL, euros } from "./ui";

export interface LookChoice {
  include: boolean;
  brand: string;
  model: string;
  mode: Mode;
}

export type LookResult = SearchResponse | { error: string } | null;

export const initialChoices = (items: GarmentAnalysis[]): LookChoice[] =>
  items.map((it) => ({
    include: true,
    brand: it.brand.name ?? "",
    model: it.model_guess ?? "",
    // Marque reconnue avec assurance → on propose la pièce exacte ; sinon son sosie.
    mode: it.brand.name && it.brand.confidence !== "faible" ? "exact" : "style",
  }));

/** La photo avec une épingle de couturière numérotée sur chaque pièce. */
export function PinnedPhoto({
  image,
  items,
  active,
  onPick,
  dim,
}: {
  image: string | null;
  items: GarmentAnalysis[];
  active?: number | null;
  onPick?: (i: number) => void;
  dim?: boolean[];
}) {
  return (
    <div className="relative bg-white p-2 shadow-etiquette">
      <div className="relative">
        {image ? (
          <img src={image} alt="Ta photo" className="block w-full bg-patron" />
        ) : (
          <div className="aspect-[3/4] w-full bg-patron" />
        )}
        {items.map((it, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick?.(i)}
            aria-label={`Pièce ${i + 1} : ${it.title}`}
            className={`absolute -translate-x-1/2 -translate-y-full transition-opacity ${dim?.[i] ? "opacity-35" : ""}`}
            style={{ left: `${it.pin.x * 100}%`, top: `${it.pin.y * 100}%` }}
          >
            {/* Tête d'épingle + aiguille */}
            <span
              className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white font-mono text-xs font-semibold text-white shadow-md ${
                active === i ? "scale-110 bg-fil" : "bg-denim"
              }`}
            >
              {i + 1}
            </span>
            <span aria-hidden className="mx-auto block h-3 w-[2px] bg-gradient-to-b from-[#C9C4B6] to-[#8A8472]" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Étape « Le look » : une ligne par pièce, marque à confirmer, exacte ou sosie. */
export function LookSetup({
  image,
  items,
  choices,
  setChoices,
  demo,
  busy,
  error,
  onSearch,
  onRestart,
}: {
  image: string | null;
  items: GarmentAnalysis[];
  choices: LookChoice[];
  setChoices: (c: LookChoice[]) => void;
  demo: boolean;
  busy: boolean;
  error: string | null;
  onSearch: () => void;
  onRestart: () => void;
}) {
  const update = (i: number, patch: Partial<LookChoice>) =>
    setChoices(choices.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const setAll = (mode: Mode) =>
    setChoices(choices.map((c) => ({ ...c, mode: mode === "exact" && !c.brand.trim() ? "style" : mode })));
  const count = choices.filter((c) => c.include).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
      <div className="mx-auto w-full max-w-[340px] lg:sticky lg:top-24 lg:h-fit">
        <PinnedPhoto image={image} items={items} dim={choices.map((c) => !c.include)} />
        <button type="button" onClick={onRestart} className="mt-3 w-full py-1 font-mono text-xs uppercase tracking-wider text-craie hover:text-fil-fonce">
          ← Changer de photo
        </button>
      </div>

      <div>
        {demo && (
          <p className="mb-5 inline-block bg-fil-clair px-3 py-1.5 font-mono text-xs text-fil-fonce">
            Mode démo : tenue d&apos;exemple (clé Anthropic non configurée).
          </p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">Le look complet</p>
        <h2 className="display mt-1 text-3xl !leading-[1.04] text-denim sm:text-[44px]">
          {items.length} pièces repérées
        </h2>
        <p className="mt-3 max-w-[60ch] text-encre/75">
          Vérifie les marques, puis choisis pour chaque pièce : la pièce exacte au meilleur prix, ou son sosie. Décoche
          ce qui ne t&apos;intéresse pas.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
          <span className="text-craie">Tout en :</span>
          <button type="button" onClick={() => setAll("exact")} className="border border-denim px-2.5 py-1.5 text-denim hover:bg-denim hover:text-[#F4EFE6]">
            Pièces exactes
          </button>
          <button type="button" onClick={() => setAll("style")} className="border border-fil px-2.5 py-1.5 text-fil-fonce hover:bg-fil hover:text-white">
            Sosies
          </button>
        </div>

        <datalist id="look-brands">
          {BRAND_STORES.map((b) => (
            <option key={b} value={b.replace(/\b\w/g, (c) => c.toUpperCase())} />
          ))}
        </datalist>

        <ol className="mt-6 space-y-3">
          {items.map((it, i) => {
            const c = choices[i];
            return (
              <li key={i} className={`bg-white shadow-etiquette transition-opacity ${c.include ? "" : "opacity-55"}`}>
                <div className="flex items-start gap-3 p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-denim font-mono text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-craie">
                          {UNIVERSE_LABEL[it.universe]} · {it.category}
                        </p>
                        <p className="etendu font-bold leading-snug">{it.title}</p>
                      </div>
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-craie">
                        <input
                          type="checkbox"
                          checked={c.include}
                          onChange={(e) => update(i, { include: e.target.checked })}
                          className="h-4 w-4 accent-[#D9822B]"
                        />
                        Chercher
                      </label>
                    </div>

                    {c.include && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="block">
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-craie">
                            Marque{it.brand.name ? ` · confiance ${it.brand.confidence}` : ""}
                          </span>
                          <input
                            list="look-brands"
                            value={c.brand}
                            onChange={(e) =>
                              update(i, { brand: e.target.value, mode: e.target.value.trim() ? c.mode : "style" })
                            }
                            placeholder="Inconnue"
                            className="mt-0.5 w-full border-b-[1.5px] border-encre/20 bg-transparent py-1.5 font-semibold outline-none placeholder:font-normal placeholder:text-craie/60 focus:border-fil"
                          />
                        </label>
                        <label className="block">
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-craie">Modèle</span>
                          <input
                            value={c.model}
                            onChange={(e) => update(i, { model: e.target.value })}
                            placeholder="Facultatif"
                            className="mt-0.5 w-full border-b-[1.5px] border-encre/20 bg-transparent py-1.5 outline-none placeholder:text-craie/60 focus:border-fil"
                          />
                        </label>
                        <div className="flex font-mono text-[11px] uppercase tracking-wider" role="group" aria-label={`Recherche pour la pièce ${i + 1}`}>
                          <button
                            type="button"
                            disabled={!c.brand.trim()}
                            onClick={() => update(i, { mode: "exact" })}
                            aria-pressed={c.mode === "exact"}
                            className={`border border-denim px-2.5 py-2 disabled:cursor-not-allowed disabled:opacity-35 ${
                              c.mode === "exact" ? "bg-denim text-[#F4EFE6]" : "text-denim"
                            }`}
                          >
                            Exacte
                          </button>
                          <button
                            type="button"
                            onClick={() => update(i, { mode: "style" })}
                            aria-pressed={c.mode === "style"}
                            className={`-ml-px border border-fil px-2.5 py-2 ${c.mode === "style" ? "bg-fil text-white" : "text-fil-fonce"}`}
                          >
                            Sosie
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          disabled={count === 0 || busy}
          onClick={onSearch}
          className="surpiqure mt-6 w-full bg-denim px-5 py-4 text-left text-[#F4EFE6] transition hover:bg-denim-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[340px]"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil">Le look complet</span>
          <span className="etendu mt-0.5 block text-xl font-bold">
            {busy ? "On cherche chaque pièce…" : `Chercher ${count > 1 ? `les ${count} pièces` : count === 1 ? "la pièce" : ""}`}
          </span>
        </button>
        {error && <p className="mt-4 border-l-2 border-alerte pl-3 text-sm text-alerte">{error}</p>}
      </div>
    </div>
  );
}

/** Offres recommandables, déjà classées par note globale (en mode exact : sans vendeur douteux). */
const recommended = (r: SearchResponse) =>
  r.offers.filter((o) => r.mode === "style" || (o.trust !== "a_verifier" && o.warnings.length === 0));

/** Le look recomposé : une ligne par pièce avec notre recommandation, et le total. */
export function LookResults({
  image,
  items,
  choices,
  results,
  onOpen,
  onEdit,
  onRestart,
}: {
  image: string | null;
  items: GarmentAnalysis[];
  choices: LookChoice[];
  results: LookResult[];
  onOpen: (i: number) => void;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const rows = items.map((it, i) => ({ it, i, c: choices[i], r: results[i] })).filter((x) => x.c.include);
  const done = rows.filter((x) => x.r && "offers" in x.r) as Array<{ it: GarmentAnalysis; i: number; c: LookChoice; r: SearchResponse }>;
  const pending = rows.some((x) => x.r === null);
  // Le look recomposé additionne notre recommandation pour chaque pièce (la mieux notée), pas l'offre la moins chère.
  const picks = done.map((x) => ({ ...x, pick: recommended(x.r)[0] })).filter((x) => x.pick?.price != null);
  const total = picks.reduce((sum, x) => sum + (x.pick.price ?? 0), 0);
  const retailRows = picks.filter((x) => x.r.analysis.estimated_retail_price_eur);
  const retailTotal = retailRows.reduce((s, x) => s + (x.r.analysis.estimated_retail_price_eur ?? 0), 0);
  const retailBest = retailRows.reduce((s, x) => s + (x.pick.price ?? 0), 0);
  const savings = retailTotal > 0 ? Math.round((1 - retailBest / retailTotal) * 100) : null;
  const anyDemo = done.some((x) => x.r.demo);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
      <div className="mx-auto w-full max-w-[340px] lg:sticky lg:top-24 lg:h-fit">
        <PinnedPhoto image={image} items={items} onPick={(i) => {
            const r = results[i];
            if (choices[i].include && r && "offers" in r) onOpen(i);
          }} dim={choices.map((c) => !c.include)} />
        <div className="mt-3 flex justify-between font-mono text-xs uppercase tracking-wider text-craie">
          <button type="button" onClick={onEdit} className="hover:text-fil-fonce">← Modifier le look</button>
          <button type="button" onClick={onRestart} className="hover:text-fil-fonce">Nouvelle photo</button>
        </div>
      </div>

      <div>
        {anyDemo && (
          <p className="mb-5 bg-fil-clair px-4 py-2.5 font-mono text-xs text-fil-fonce">
            Mode démo : ces offres sont des exemples. Ajoute la clé SerpApi pour chercher les vraies offres du moment.
          </p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">Le look complet</p>
        <h2 className="display mt-1 text-3xl !leading-[1.04] text-denim sm:text-[44px]">Le look, pièce par pièce</h2>

        {/* Ticket de caisse du look */}
        <div className="compo mt-6 max-w-md px-5 py-4">
          <div className="flex items-baseline justify-between gap-4 uppercase">
            <span className="text-craie">Le look · {picks.length} pièce{picks.length > 1 ? "s" : ""}</span>
            <span className="text-2xl font-semibold tabular-nums">{pending && picks.length === 0 ? "…" : euros(total)}</span>
          </div>
          <p className="mt-1 text-xs normal-case text-craie">
            Avec notre recommandation pour chaque pièce (la mieux notée, chez un vendeur sûr).
          </p>
          {savings != null && savings > 0 && (
            <p className="mt-1 text-right text-xs font-semibold uppercase text-ok">
              −{savings} % vs boutique ({euros(retailTotal)} pour les pièces de marque)
            </p>
          )}
          {pending && <p className="mt-2 text-xs text-craie">On cherche encore certaines pièces…</p>}
        </div>

        <ol className="mt-6 space-y-3">
          {rows.map(({ it, i, c, r }) => {
            const res = r && "offers" in r ? r : null;
            const top = res ? recommended(res).slice(0, 3) : [];
            return (
              <li key={i} className="bg-white shadow-etiquette">
                <div className="flex items-start gap-3 p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-denim font-mono text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-craie">
                          {c.mode === "exact" ? `Pièce exacte · ${c.brand}` : "Son sosie"}
                        </p>
                        <p className="etendu font-bold leading-snug">{it.title}</p>
                      </div>
                      {top[0] && <span className="font-mono text-lg font-semibold tabular-nums">{euros(top[0].price)}</span>}
                    </div>

                    {r === null && <p className="mt-2 text-sm text-craie">Recherche en cours…</p>}
                    {r && "error" in r && <p className="mt-2 text-sm text-alerte">{r.error}</p>}
                    {res && top.length === 0 && <p className="mt-2 text-sm text-craie">Pas d&apos;offre fiable trouvée pour cette pièce.</p>}
                    {res && top.length > 0 && (
                      <ul className="mt-3 divide-y divide-dashed divide-encre/15 border-y border-dashed border-encre/15">
                        {top.map((o, k) => (
                          <li key={o.id} className="flex items-center gap-3 py-2 text-sm">
                            <span className="min-w-0 flex-1">
                              {k === 0 && <span className="puce mr-1.5 bg-fil text-white">Notre choix</span>}
                              <span className="mr-1.5 align-middle">
                                <ImpactBadge impact={o.impact} compact />
                              </span>
                              <span className="font-semibold">{o.seller}</span>{" "}
                              <span className={`puce ml-1 align-middle ${TRUST_STYLE[o.trust]}`}>{o.trustLabel}</span>
                              <span className="block truncate text-xs text-craie">{o.title}</span>
                            </span>
                            <span className="font-mono tabular-nums">{euros(o.price)}</span>
                            <a
                              href={o.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="shrink-0 bg-encre px-2.5 py-1.5 text-xs font-semibold text-[#F4EFE6] hover:bg-fil"
                            >
                              Voir
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    {res && (
                      <button type="button" onClick={() => onOpen(i)} className="mt-2 text-sm font-semibold text-denim underline decoration-dashed underline-offset-4 hover:text-fil-fonce">
                        Toutes les offres ({res.offers.length}), notes et alerte promo →
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
