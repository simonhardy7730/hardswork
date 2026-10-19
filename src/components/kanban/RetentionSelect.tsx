"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useL } from "@/lib/i18n/context";
import { setRefusedRetention } from "@/app/(dashboard)/dashboard/candidatures/actions";

const OPTIONS: { v: number; fr: string; nl: string }[] = [
  { v: 1, fr: "1 jour", nl: "1 dag" },
  { v: 3, fr: "3 jours", nl: "3 dagen" },
  { v: 7, fr: "1 semaine", nl: "1 week" },
  { v: 14, fr: "2 semaines", nl: "2 weken" },
  { v: 30, fr: "1 mois", nl: "1 maand" },
  { v: 90, fr: "3 mois", nl: "3 maanden" },
  { v: 0, fr: "jamais", nl: "nooit" },
];

export default function RetentionSelect({ days }: { days: number }) {
  const l = useL();
  const [value, setValue] = useState(days);
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");

  async function change(v: number) {
    const prev = value;
    setValue(v); setState("saving");
    const r = await setRefusedRetention(v);
    if (r.ok) setState("saved"); else { setValue(prev); setState("error"); }
  }

  return (
    <label className="flex items-center gap-2 text-xs text-ink-500 flex-wrap">
      <Trash2 size={12} />
      {l("Supprimer automatiquement les candidatures refusées après", "Afgewezen sollicitaties automatisch verwijderen na")}
      <select value={value} onChange={(e) => change(Number(e.target.value))}
        className="text-xs border border-ink-100 rounded-lg px-2 py-1 bg-white text-ink">
        {OPTIONS.map((o) => <option key={o.v} value={o.v}>{l(o.fr, o.nl)}</option>)}
      </select>
      {state === "saved" && <span className="text-emerald-600 font-bold">✓</span>}
      {state === "error" && <span className="text-red-600">{l("Échec (SQL 020 lancé ?)", "Mislukt (SQL 020 uitgevoerd?)")}</span>}
    </label>
  );
}
