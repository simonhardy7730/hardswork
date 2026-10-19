"use client";

import { useL } from "@/lib/i18n/context";
import { ageFromBirthDate, MIN_AGE } from "@/lib/candidate/age";

/** Date de naissance obligatoire (15 ans minimum). */
export default function BirthField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const l = useL();
  const age = ageFromBirthDate(value);
  const tooYoung = value !== "" && (age === null || age < MIN_AGE);
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{l("Date de naissance", "Geboortedatum")} *</label>
      <input
        type="date" required value={value} onChange={(e) => onChange(e.target.value)}
        min="1940-01-01" max={new Date().toISOString().slice(0, 10)}
        className="w-full px-3 py-3 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
      />
      {tooYoung && (
        <p className="text-xs text-red-600 mt-1">{l(`Il faut avoir au moins ${MIN_AGE} ans pour postuler.`, `Je moet minstens ${MIN_AGE} jaar zijn om te solliciteren.`)}</p>
      )}
    </div>
  );
}
