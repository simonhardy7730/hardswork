"use client";

import { useRouter, usePathname } from "next/navigation";
import { SECTOR_LABELS } from "@/lib/utils";

interface Props {
  searchParams: { secteur?: string; statut?: string; region?: string };
  counts: { total: number; active: number; draft: number; paused: number };
}

const STATUS_TABS = [
  { value: "", label: "Toutes" },
  { value: "active", label: "Actives" },
  { value: "draft", label: "Brouillons" },
  { value: "paused", label: "En pause" },
  { value: "closed", label: "Clôturées" },
];

export default function OffresFilters({ searchParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][]
    );
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      {/* Tabs statut */}
      <div className="flex bg-white border border-ink-100 rounded-xl p-1 w-fit gap-0.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => update("statut", tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              (searchParams.statut ?? "") === tab.value
                ? "bg-brand text-white shadow-sm"
                : "text-ink-500 hover:text-ink hover:bg-surface-2"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtres secondaires */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={searchParams.secteur ?? ""}
          onChange={(e) => update("secteur", e.target.value)}
          className="px-3 py-1.5 border border-ink-100 rounded-lg text-sm text-ink-500 bg-white focus:outline-none focus:border-brand transition"
        >
          <option value="">Tous les secteurs</option>
          {Object.entries(SECTOR_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={searchParams.region ?? ""}
          onChange={(e) => update("region", e.target.value)}
          className="px-3 py-1.5 border border-ink-100 rounded-lg text-sm text-ink-500 bg-white focus:outline-none focus:border-brand transition"
        >
          <option value="">Toutes les régions</option>
          <option value="wallonie">Wallonie</option>
          <option value="bruxelles">Bruxelles</option>
          <option value="flandre">Flandre</option>
        </select>

        {(searchParams.secteur || searchParams.region) && (
          <button
            onClick={() => router.push(pathname)}
            className="px-3 py-1.5 text-sm text-red-500 hover:text-red-700 transition"
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
