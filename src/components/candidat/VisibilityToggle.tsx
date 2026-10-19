"use client";

import { useState, useTransition } from "react";
import { setVisibility, saveBirthDate } from "@/app/candidat/compte/actions";
import { ageFromBirthDate, ADULT_AGE, MIN_AGE } from "@/lib/candidate/age";
import { useL, useLang } from "@/lib/i18n/context";
import { VISIBILITY_LABEL } from "@/lib/candidate/visibility";

export default function VisibilityToggle({ initial, birthDate }: { initial: boolean; birthDate: string | null }) {
  const l = useL();
  const lang = useLang();
  const [on, setOn] = useState(initial);
  const [bd, setBd] = useState<string | null>(birthDate);
  const [draft, setDraft] = useState("");
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
        {!bd ? (
          <div className="space-y-2">
            <p className="text-sm text-ink-700">{l("Indiquez votre date de naissance pour pouvoir être visible des recruteurs (réservé aux 18 ans et plus). Elle ne pourra plus être modifiée.", "Geef je geboortedatum op om zichtbaar te zijn voor werkgevers (vanaf 18 jaar). Ze kan daarna niet meer gewijzigd worden.")}</p>
            <div className="flex gap-2 items-center flex-wrap">
              <input type="date" value={draft} onChange={(e) => setDraft(e.target.value)} max={new Date().toISOString().slice(0, 10)}
                className="h-10 rounded-xl border border-ink-100 px-3 text-sm" />
              <button type="button" disabled={pending || ageFromBirthDate(draft) === null || (ageFromBirthDate(draft) ?? 0) < MIN_AGE}
                onClick={() => start(async () => { const r = await saveBirthDate(draft); if (r.ok) setBd(draft); else setErr(true); })}
                className="h-10 px-4 rounded-xl bg-[#101F43] font-display font-black uppercase text-xs disabled:opacity-50" style={{ color: "#FFFFFF", letterSpacing: "0.05em" }}>
                {l("Enregistrer", "Opslaan")}
              </button>
            </div>
          </div>
        ) : (ageFromBirthDate(bd) ?? 0) < ADULT_AGE ? (
          <p className="text-sm text-ink-700">{l("La visibilité auprès des recruteurs est réservée aux 18 ans et plus. Vous pouvez toujours postuler aux offres.", "Zichtbaarheid voor werkgevers is voorbehouden aan 18-plussers. Je kunt wel nog solliciteren op vacatures.")}</p>
        ) : (
        <>
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
        </>
        )}
        {err && <p className="text-xs text-red-600 mt-2">{l("Enregistrement impossible, réessayez.", "Opslaan mislukt, probeer opnieuw.")}</p>}
      </div>
    </div>
  );
}
