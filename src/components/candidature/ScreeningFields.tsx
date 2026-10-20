"use client";

import { useL } from "@/lib/i18n/context";
import { questionsFor } from "@/lib/screening";

/** Questions oui/non posées par le recruteur (présélection). Toutes obligatoires. */
export default function ScreeningFields({ ids, value, onChange }: { ids: string[]; value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  const l = useL();
  const qs = questionsFor(ids);
  if (qs.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">{l("Quelques questions rapides", "Enkele korte vragen")}</p>
      {qs.map((q) => (
        <div key={q.id} className="flex items-center justify-between gap-3 border border-ink-100 rounded-xl px-3 py-2.5">
          <span className="text-sm text-ink">{l(q.fr, q.nl)}</span>
          <div className="flex gap-1.5 shrink-0">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => onChange({ ...value, [q.id]: v })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${value[q.id] === v ? "bg-brand text-[#101F43] border-brand" : "bg-white text-ink-500 border-ink-100"}`}
              >
                {v ? l("Oui", "Ja") : l("Non", "Nee")}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function screeningComplete(ids: string[], value: Record<string, boolean>): boolean {
  return questionsFor(ids).every((q) => typeof value[q.id] === "boolean");
}
