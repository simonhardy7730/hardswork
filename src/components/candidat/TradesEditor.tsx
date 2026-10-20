"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveTrades } from "@/app/candidat/compte/actions";
import { TRADES, MAX_TRADES } from "@/lib/candidate/trades";
import { useL, useLang } from "@/lib/i18n/context";

/** Choix des métiers précis (ce que les employeurs filtrent dans la candidathèque). */
export default function TradesEditor({ initial, initialOther = "" }: { initial: string[]; initialOther?: string }) {
  const l = useL();
  const lang = useLang();
  const [sel, setSel] = useState<string[]>(initial);
  const [other, setOther] = useState(initialOther);
  const [msg, setMsg] = useState<"" | "ok" | "err">("");
  const [pending, start] = useTransition();
  const toggle = (k: string) => { setMsg(""); setSel((p) => (p.includes(k) ? p.filter((x) => x !== k) : p.length >= MAX_TRADES ? p : [...p, k])); };

  return (
    <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest">{l("Mes métiers", "Mijn beroepen")}</p>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-sm text-ink-500">{l(`Choisissez jusqu'à ${MAX_TRADES} métiers. Les employeurs vous trouvent grâce à eux, même sans annonce.`, `Kies tot ${MAX_TRADES} beroepen. Werkgevers vinden je zo, ook zonder vacature.`)}</p>
        <div className="flex flex-wrap gap-2">
          {TRADES.map((t) => {
            const on = sel.includes(t.key);
            return (
              <button key={t.key} type="button" onClick={() => toggle(t.key)} disabled={!on && sel.length >= MAX_TRADES}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${on ? "bg-brand border-brand text-[#101F43]" : "bg-white border-ink-100 text-ink-500 hover:border-brand disabled:opacity-40"}`}>
                {on && <Check size={11} className="inline mr-1 -mt-0.5" />}{lang === "nl" ? t.nl : t.fr}
              </button>
            );
          })}
        </div>
        <input value={other} maxLength={60} onChange={(e) => { setMsg(""); setOther(e.target.value); }}
          placeholder={l("Autre métier, s'il n'est pas dans la liste (facultatif)", "Ander beroep, als het niet in de lijst staat (optioneel)")}
          className="w-full h-10 rounded-xl border border-ink-100 px-3 text-sm" />
        <div className="flex items-center gap-3">
          <button type="button" disabled={pending}
            onClick={() => start(async () => { const r = await saveTrades(sel, other); setMsg(r.ok ? "ok" : "err"); })}
            className="h-10 px-5 rounded-xl bg-[#101F43] font-display font-black uppercase text-xs disabled:opacity-50" style={{ color: "#FFFFFF", letterSpacing: "0.05em" }}>
            {l("Enregistrer", "Opslaan")}
          </button>
          {msg === "ok" && <span className="text-xs text-success font-bold">{l("Enregistré ✓", "Opgeslagen ✓")}</span>}
          {msg === "err" && <span className="text-xs text-red-600 font-bold">{l("Erreur, réessayez.", "Fout, probeer opnieuw.")}</span>}
        </div>
      </div>
    </div>
  );
}
