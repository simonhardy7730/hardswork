"use client";

import { useState, useTransition } from "react";
import { setVisibility } from "@/app/candidat/compte/actions";
import { useL, useLang } from "@/lib/i18n/context";
import { VISIBILITY_LABEL } from "@/lib/candidate/visibility";

export default function VisibilityToggle({ initial }: { initial: boolean }) {
  const l = useL();
  const lang = useLang();
  const [on, setOn] = useState(initial);
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
          {l("Visibilité auprès des recruteurs", "Zichtbaarheid voor werkgevers")}
        </p>
      </div>
      <div className="p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={on} disabled={pending}
            onChange={(e) => {
              const next = e.target.checked;
              setOn(next); setErr(false);
              start(async () => { const r = await setVisibility(next); if (!r.ok) { setOn(!next); setErr(true); } });
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-[#101F43]" />
          <span className="text-sm text-ink-700 leading-relaxed">{VISIBILITY_LABEL[lang === "nl" ? "nl" : "fr"]}</span>
        </label>
        <p className="text-xs text-ink-500 mt-3">
          {on
            ? l("Votre profil est visible des recruteurs abonnés.", "Je profiel is zichtbaar voor werkgevers met een abonnement.")
            : l("Votre profil n'est transmis qu'aux recruteurs auxquels vous postulez.", "Je profiel wordt enkel doorgegeven aan werkgevers bij wie je solliciteert.")}
        </p>
        {err && <p className="text-xs text-red-600 mt-2">{l("Enregistrement impossible, réessayez.", "Opslaan mislukt, probeer opnieuw.")}</p>}
      </div>
    </div>
  );
}
