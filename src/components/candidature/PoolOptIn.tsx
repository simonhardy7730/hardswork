"use client";

import { useL } from "@/lib/i18n/context";

/** Choix explicite (décoché par défaut) d'apparaître dans la candidathèque en plus de la candidature. */
export default function PoolOptIn({ checked, onChange, city, onCity }: { checked: boolean; onChange: (v: boolean) => void; city: string; onCity: (v: string) => void }) {
  const l = useL();
  return (
    <div className="rounded-xl border border-brand/40 bg-[#FFF6DE] p-4 space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 w-4 h-4 accent-[#FFB900]" />
        <span className="text-sm text-ink">
          <strong>{l("Être aussi contacté pour d'autres offres", "Ook gecontacteerd worden voor andere vacatures")}</strong>
          <span className="block text-xs text-ink-500 mt-0.5">{l("Votre profil (métier, ville, disponibilité, permis) devient visible des employeurs abonnés de la région, qui peuvent vous appeler. Réservé aux 18 ans et plus. Vous pouvez le retirer à tout moment.", "Je profiel (beroep, stad, beschikbaarheid, rijbewijs) wordt zichtbaar voor werkgevers met een abonnement in de regio. Vanaf 18 jaar. Je kunt dit altijd intrekken.")}</span>
        </span>
      </label>
      {checked && (
        <input value={city} onChange={(e) => onCity(e.target.value.slice(0, 80))} placeholder={l("Votre ville (ex : Tournai)", "Je stad (bv. Doornik)")}
          className="w-full h-11 px-3 border border-ink-100 rounded-xl text-sm bg-white focus:outline-none focus:border-brand" />
      )}
    </div>
  );
}
