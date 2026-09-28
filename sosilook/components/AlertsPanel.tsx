"use client";

import type { PriceAlert } from "@/lib/storage";
import { Cloche, euros } from "./ui";

export type AlertStatus = "baisse" | "cible" | "stable" | "jamais";

export function alertStatus(a: PriceAlert): AlertStatus {
  if (a.lastPrice == null || !a.lastCheckedAt) return "jamais";
  if (a.targetPrice != null && a.lastPrice <= a.targetPrice) return "cible";
  if (a.startPrice != null && a.lastPrice < a.startPrice) return "baisse";
  return "stable";
}

export function AlertsPanel({
  alerts,
  checking,
  onCheck,
  onCheckAll,
  onTarget,
  onDelete,
  onGoSearch,
}: {
  alerts: PriceAlert[];
  checking: Set<string>;
  onCheck: (id: string) => void;
  onCheckAll: () => void;
  onTarget: (id: string, price: number | null) => void;
  onDelete: (id: string) => void;
  onGoSearch: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fil-fonce">Alertes promo</p>
          <h1 className="display mt-1 text-4xl uppercase text-denim sm:text-[56px]">Mes alertes</h1>
          <p className="mt-5 max-w-[58ch] text-encre/75">
            Pour chaque pièce suivie, on revérifie les prix à chaque visite. Dès qu&apos;elle passe sous ton prix
            cible ou qu&apos;elle baisse, elle remonte en haut avec la mention « promo ».
          </p>
        </div>
        {alerts.length > 0 && (
          <button type="button" onClick={onCheckAll} disabled={checking.size > 0} className="border-[1.5px] border-denim px-4 py-2.5 text-sm font-semibold text-denim hover:bg-denim hover:text-[#F4EFE6] disabled:opacity-50">
            {checking.size > 0 ? "Vérification…" : "Tout revérifier"}
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="mt-10 max-w-xl border-[1.5px] border-dashed border-encre/25 bg-white/60 p-8">
          <Cloche className="text-fil" />
          <p className="etendu mt-3 text-lg font-bold">Aucune pièce suivie pour l&apos;instant.</p>
          <p className="mt-1 text-craie">
            Lance une recherche, puis touche « M&apos;alerter d&apos;une promo » sur les résultats.
          </p>
          <button type="button" onClick={onGoSearch} className="mt-5 bg-encre px-4 py-2.5 text-sm font-semibold text-[#F4EFE6] hover:bg-fil">
            Chercher une pièce
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {[...alerts]
            .sort((a, b) => rank(alertStatus(a)) - rank(alertStatus(b)))
            .map((a) => (
              <AlertCard
                key={a.id}
                alert={a}
                busy={checking.has(a.id)}
                onCheck={() => onCheck(a.id)}
                onTarget={(p) => onTarget(a.id, p)}
                onDelete={() => onDelete(a.id)}
              />
            ))}
        </ul>
      )}

      <p className="mt-10 max-w-[70ch] text-xs text-craie">
        Pour l&apos;instant, tes alertes sont gardées sur cet appareil. Prochaine étape : un compte pour les
        recevoir par e-mail ou notification, même quand le site est fermé.
      </p>
    </div>
  );
}

const rank = (s: AlertStatus) => ({ cible: 0, baisse: 1, jamais: 2, stable: 3 })[s];

function AlertCard({
  alert: a,
  busy,
  onCheck,
  onTarget,
  onDelete,
}: {
  alert: PriceAlert;
  busy: boolean;
  onCheck: () => void;
  onTarget: (p: number | null) => void;
  onDelete: () => void;
}) {
  const status = alertStatus(a);
  const drop =
    a.startPrice && a.lastPrice != null && a.lastPrice < a.startPrice
      ? Math.round((1 - a.lastPrice / a.startPrice) * 100)
      : 0;
  const promo = status === "cible" || status === "baisse";

  return (
    <li className={`relative flex gap-4 bg-white p-4 shadow-etiquette ${promo ? "ring-2 ring-fil" : ""}`}>
      {a.thumb ? (
        <img src={a.thumb} alt="" className="h-24 w-24 shrink-0 bg-patron object-contain" />
      ) : (
        <div className="h-24 w-24 shrink-0 bg-patron" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {promo ? (
            <span className="puce bg-fil text-white">Promo{drop ? ` −${drop} %` : ""}</span>
          ) : status === "jamais" ? (
            <span className="puce bg-patron-carton text-craie">À vérifier</span>
          ) : (
            <span className="puce bg-patron-carton text-craie">Pas de baisse</span>
          )}
          <span className="puce bg-denim/10 text-denim">{a.mode === "exact" ? "Pièce exacte" : "Sosie"}</span>
        </div>
        <p className="etendu mt-2 line-clamp-2 font-bold leading-snug">{a.title}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 font-mono text-xs">
          <dt className="text-craie">Au départ</dt>
          <dd className="text-right tabular-nums">{euros(a.startPrice)}</dd>
          <dt className="text-craie">Aujourd&apos;hui</dt>
          <dd className={`text-right font-semibold tabular-nums ${promo ? "text-fil-fonce" : ""}`}>{euros(a.lastPrice)}</dd>
        </dl>
        <label className="mt-2 flex items-center justify-between gap-2 font-mono text-xs">
          <span className="text-craie">Prévenir sous</span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={a.targetPrice ?? ""}
              onChange={(e) => onTarget(e.target.value === "" ? null : Number(e.target.value))}
              className="w-20 border-b border-encre/25 bg-transparent py-0.5 text-right tabular-nums outline-none focus:border-fil"
              aria-label="Prix cible en euros"
            />
            €
          </span>
        </label>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="text-craie">
            {a.lastCheckedAt ? `Vérifié le ${new Date(a.lastCheckedAt).toLocaleDateString("fr-FR")}` : "Jamais vérifié"}
          </span>
          <span className="flex gap-3">
            <button type="button" onClick={onCheck} disabled={busy} className="font-semibold text-denim hover:text-fil-fonce disabled:opacity-50">
              {busy ? "…" : "Revérifier"}
            </button>
            <button type="button" onClick={onDelete} className="text-craie hover:text-alerte">
              Supprimer
            </button>
          </span>
        </div>
      </div>
    </li>
  );
}
