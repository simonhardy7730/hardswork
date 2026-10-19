"use client";

import { Info } from "lucide-react";
import { useL } from "@/lib/i18n/context";
import {
  JOB_TYPES, STUDENT_SLOTS, FLEXI_SITUATIONS, MISSION_TYPES,
  type Preferences,
} from "@/lib/candidate/preferences";

const input =
  "w-full px-3.5 py-2.5 bg-white border border-ink-100 rounded-xl text-ink text-sm placeholder-ink-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition";
const label = "block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1.5";

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`px-3.5 py-2 rounded-full border text-sm font-semibold transition ${
        on ? "border-brand bg-brand text-white" : "border-ink-100 bg-white text-ink-500 hover:border-brand/50"
      }`}>
      {children}
    </button>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink-200 accent-[#101F43]" />
      {children}
    </label>
  );
}

/** Champs de préférences : contrôlé, réutilisé à l'inscription et sur la page Mon compte. */
export default function PreferencesFields({
  value, onChange,
}: { value: Preferences; onChange: (v: Preferences) => void }) {
  const l = useL();
  const sp = value.student_profile;
  const fp = value.flexi_profile;
  const wantsStudent = value.job_types.includes("etudiant");
  const wantsFlexi = value.job_types.includes("flexi");

  const toggleType = (k: string) =>
    onChange({
      ...value,
      job_types: value.job_types.includes(k) ? value.job_types.filter((x) => x !== k) : [...value.job_types, k],
    });
  const setSp = (patch: Partial<typeof sp>) => onChange({ ...value, student_profile: { ...sp, ...patch } });
  const setFp = (patch: Partial<typeof fp>) => onChange({ ...value, flexi_profile: { ...fp, ...patch } });

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={label}>{l("Quel type d'emploi recherchez-vous ?", "Welk soort job zoek je?")}</legend>
        <p className="text-xs text-ink-400 mb-2">{l("Plusieurs réponses possibles.", "Meerdere antwoorden mogelijk.")}</p>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((t) => (
            <Chip key={t.key} on={value.job_types.includes(t.key)} onClick={() => toggleType(t.key)}>
              {l(t.fr, t.nl)}
            </Chip>
          ))}
        </div>
      </fieldset>

      {wantsStudent && (
        <section className="rounded-2xl border border-ink-100 bg-white p-4 space-y-4" aria-label={l("Profil job étudiant", "Profiel studentenjob")}>
          <p className="font-display font-black uppercase text-ink text-sm tracking-wide">{l("Profil job étudiant", "Profiel studentenjob")}</p>
          <p className="text-xs text-ink-400">{l("Tous les champs sont facultatifs.", "Alle velden zijn optioneel.")}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="p-study">{l("Type d'études", "Soort studies")}</label>
              <input id="p-study" className={input} value={sp.study_field ?? ""} maxLength={120}
                onChange={(e) => setSp({ study_field: e.target.value })} placeholder={l("Ex. gestion, électromécanique…", "Bv. management, elektromechanica…")} />
            </div>
            <div>
              <label className={label} htmlFor="p-school">{l("Établissement (facultatif)", "School (optioneel)")}</label>
              <input id="p-school" className={input} value={sp.school ?? ""} maxLength={120}
                onChange={(e) => setSp({ school: e.target.value })} />
            </div>
          </div>
          <div>
            <p className={label}>{l("Disponible pendant l'année scolaire", "Beschikbaar tijdens het schooljaar")}</p>
            <div className="flex flex-wrap gap-2">
              {STUDENT_SLOTS.map((s) => {
                const on = (sp.avail_school_year ?? []).includes(s.key);
                return (
                  <Chip key={s.key} on={on}
                    onClick={() => setSp({
                      avail_school_year: on
                        ? (sp.avail_school_year ?? []).filter((x) => x !== s.key)
                        : [...(sp.avail_school_year ?? []), s.key],
                    })}>
                    {l(s.fr, s.nl)}
                  </Chip>
                );
              })}
            </div>
          </div>
          <Check checked={!!sp.avail_holidays} onChange={(v) => setSp({ avail_holidays: v })}>
            {l("Disponible pendant les vacances", "Beschikbaar tijdens de vakanties")}
          </Check>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="p-mob">{l("Mobilité (km autour de chez vous)", "Mobiliteit (km rond jouw woonplaats)")}</label>
              <input id="p-mob" type="number" min={0} max={500} inputMode="numeric" className={input}
                value={sp.mobility_km ?? ""} onChange={(e) => setSp({ mobility_km: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
            <div>
              <label className={label} htmlFor="p-skills">{l("Compétences (facultatif)", "Vaardigheden (optioneel)")}</label>
              <input id="p-skills" className={input} value={sp.skills ?? ""} maxLength={300}
                onChange={(e) => setSp({ skills: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="p-exp">{l("Expériences précédentes (facultatif)", "Eerdere ervaring (optioneel)")}</label>
            <textarea id="p-exp" rows={2} className={input} value={sp.experience ?? ""} maxLength={500}
              onChange={(e) => setSp({ experience: e.target.value })} />
          </div>
          <p className="flex gap-2 text-xs text-ink-500 bg-surface rounded-xl p-3">
            <Info size={14} className="shrink-0 mt-0.5 text-brand" />
            <span>
              {l(
                "Le travail étudiant est soumis à des conditions légales belges (notamment un nombre d'heures limité par an). Wolko ne vérifie pas votre statut : votre éligibilité reste « à confirmer » et pourra être vérifiée par l'employeur. Aucun justificatif scolaire n'est demandé ici.",
                "Studentenarbeid is aan Belgische wettelijke voorwaarden onderworpen (onder meer een beperkt aantal uren per jaar). Wolko controleert je status niet: je geschiktheid blijft « te bevestigen » en kan door de werkgever worden nagegaan. Hier wordt geen schoolattest gevraagd."
              )}
            </span>
          </p>
        </section>
      )}

      {wantsFlexi && (
        <section className="rounded-2xl border border-ink-100 bg-white p-4 space-y-4" aria-label={l("Profil flexi-job", "Profiel flexi-job")}>
          <p className="font-display font-black uppercase text-ink text-sm tracking-wide">{l("Profil flexi-job", "Profiel flexi-job")}</p>
          <p className="text-xs text-ink-400">{l("Tous les champs sont facultatifs.", "Alle velden zijn optioneel.")}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="f-rad">{l("Rayon de déplacement (km)", "Verplaatsingsradius (km)")}</label>
              <input id="f-rad" type="number" min={0} max={500} inputMode="numeric" className={input}
                value={fp.radius_km ?? ""} onChange={(e) => setFp({ radius_km: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
            <div>
              <label className={label} htmlFor="f-start">{l("Date de début possible", "Mogelijke startdatum")}</label>
              <input id="f-start" type="date" className={input} value={fp.start_date ?? ""}
                onChange={(e) => setFp({ start_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Check checked={!!fp.avail_week} onChange={(v) => setFp({ avail_week: v })}>{l("En semaine", "In de week")}</Check>
            <Check checked={!!fp.avail_evening} onChange={(v) => setFp({ avail_evening: v })}>{l("En soirée", "In de avond")}</Check>
            <Check checked={!!fp.avail_weekend} onChange={(v) => setFp({ avail_weekend: v })}>{l("Le week-end", "In het weekend")}</Check>
            <Check checked={!!fp.avail_holidays} onChange={(v) => setFp({ avail_holidays: v })}>{l("Jours fériés", "Feestdagen")}</Check>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="f-mis">{l("Missions", "Opdrachten")}</label>
              <select id="f-mis" className={input} value={fp.mission_type ?? ""} onChange={(e) => setFp({ mission_type: e.target.value })}>
                {MISSION_TYPES.map((m) => <option key={m.key} value={m.key}>{l(m.fr, m.nl)}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="f-sit">{l("Votre situation professionnelle", "Je beroepssituatie")}</label>
              <select id="f-sit" className={input} value={fp.situation ?? ""} onChange={(e) => setFp({ situation: e.target.value })}>
                {FLEXI_SITUATIONS.map((m) => <option key={m.key} value={m.key}>{l(m.fr, m.nl)}</option>)}
              </select>
            </div>
          </div>
          <p className="flex gap-2 text-xs text-ink-500 bg-surface rounded-xl p-3">
            <Info size={14} className="shrink-0 mt-0.5 text-brand" />
            <span>
              {l(
                "Les règles du flexi-job en Belgique sont spécifiques et évoluent (statut du travailleur, période de référence, secteurs autorisés). Choisir « Flexi-job » ne signifie pas que vous y avez droit : votre éligibilité reste « à confirmer ». Nous ne demandons aucun détail sur votre employeur principal.",
                "De flexi-jobregels in België zijn specifiek en evolueren (statuut van de werknemer, referentieperiode, toegelaten sectoren). « Flexi-job » kiezen betekent niet dat je er recht op hebt: je geschiktheid blijft « te bevestigen ». We vragen geen details over je hoofdwerkgever."
              )}
            </span>
          </p>
        </section>
      )}

      {(wantsStudent || wantsFlexi) && (
        <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 inline-block">
          {l("Éligibilité à confirmer", "Geschiktheid te bevestigen")}
        </p>
      )}
    </div>
  );
}
