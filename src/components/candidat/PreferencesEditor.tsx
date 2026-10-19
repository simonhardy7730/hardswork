"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import PreferencesFields from "@/components/candidat/PreferencesFields";
import { savePreferences } from "@/app/candidat/compte/actions";
import { useL } from "@/lib/i18n/context";
import type { Preferences } from "@/lib/candidate/preferences";

export default function PreferencesEditor({ initial }: { initial: Preferences }) {
  const l = useL();
  const [value, setValue] = useState<Preferences>(initial);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  return (
    <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
          {l("Mes recherches d'emploi", "Mijn jobzoektocht")}
        </p>
      </div>
      <div className="p-5 space-y-5">
        <PreferencesFields value={value} onChange={(v) => { setValue(v); setState("idle"); }} />
        <div className="flex items-center gap-3">
          <button type="button" disabled={pending}
            onClick={() => start(async () => { const r = await savePreferences(value); setState(r.ok ? "saved" : "error"); })}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm px-5 py-2.5 rounded-xl transition disabled:opacity-60"
            style={{ letterSpacing: "0.05em" }}>
            {pending && <Loader2 size={14} className="animate-spin" />}
            {l("Enregistrer", "Opslaan")}
          </button>
          {state === "saved" && (
            <span role="status" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
              <Check size={14} /> {l("Enregistré", "Opgeslagen")}
            </span>
          )}
          {state === "error" && (
            <span role="alert" className="text-sm font-semibold text-red-500">
              {l("Impossible d'enregistrer pour le moment.", "Opslaan is momenteel niet mogelijk.")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
