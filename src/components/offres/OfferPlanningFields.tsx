"use client";

import { Info } from "lucide-react";
import { useL } from "@/lib/i18n/context";
import { DAYS, SLOTS } from "@/lib/candidate/availability";

export interface OfferPlanning {
  work_date_from: string;
  work_date_to: string;
  days_needed: string[];
  time_slots: string[];
  schedule_note: string;
  positions_count: string;
  recurrence: "" | "ponctuelle" | "recurrente";
  requirements: string;
  work_location: string;
}
export const EMPTY_PLANNING: OfferPlanning = {
  work_date_from: "", work_date_to: "", days_needed: [], time_slots: [], schedule_note: "",
  positions_count: "1", recurrence: "", requirements: "", work_location: "",
};

const input =
  "w-full px-3.5 py-2.5 bg-white border border-ink-100 rounded-xl text-ink text-sm placeholder-ink-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition";
const label = "block text-sm font-medium text-ink mb-1.5";

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`px-3 py-2 rounded-lg border text-sm font-semibold transition ${
        on ? "border-brand bg-brand text-white" : "border-ink-100 text-ink-500 hover:border-brand/50"}`}>
      {children}
    </button>
  );
}

/** Planning d'une mission : dates, jours, plages horaires, postes, récurrence, conditions, lieu. */
export default function OfferPlanningFields({
  value, onChange, flexi,
}: { value: OfferPlanning; onChange: (v: OfferPlanning) => void; flexi: boolean }) {
  const l = useL();
  const set = (patch: Partial<OfferPlanning>) => onChange({ ...value, ...patch });
  const tog = (key: "days_needed" | "time_slots", k: string) =>
    set({ [key]: value[key].includes(k) ? value[key].filter((x) => x !== k) : [...value[key], k] } as Partial<OfferPlanning>);

  return (
    <section className="rounded-2xl border border-ink-100 bg-surface p-4 space-y-5" aria-label={l("Planning de la mission", "Planning van de opdracht")}>
      <h3 className="font-display font-black uppercase text-ink text-sm tracking-wide">
        {l("Planning de la mission", "Planning van de opdracht")}
      </h3>

      <div>
        <p className={label}>{l("Missions", "Opdrachten")}</p>
        <div className="flex gap-2">
          <Chip on={value.recurrence === "ponctuelle"} onClick={() => set({ recurrence: value.recurrence === "ponctuelle" ? "" : "ponctuelle" })}>
            {l("Ponctuelle", "Eenmalig")}
          </Chip>
          <Chip on={value.recurrence === "recurrente"} onClick={() => set({ recurrence: value.recurrence === "recurrente" ? "" : "recurrente" })}>
            {l("Récurrente", "Terugkerend")}
          </Chip>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className={label} htmlFor="pl-from">{l("Du", "Van")}</label>
          <input id="pl-from" type="date" className={input} value={value.work_date_from}
            onChange={(e) => set({ work_date_from: e.target.value, work_date_to: value.work_date_to && value.work_date_to >= e.target.value ? value.work_date_to : "" })} />
        </div>
        <div>
          <label className={label} htmlFor="pl-to">{l("Au", "Tot")}</label>
          <input id="pl-to" type="date" className={input} value={value.work_date_to} min={value.work_date_from || undefined}
            onChange={(e) => set({ work_date_to: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="pl-pos">{l("Nombre de postes", "Aantal plaatsen")}</label>
          <input id="pl-pos" type="number" min={1} max={999} inputMode="numeric" className={input} value={value.positions_count}
            onChange={(e) => set({ positions_count: e.target.value })} />
        </div>
      </div>

      <div>
        <p className={label}>{l("Jours recherchés", "Gezochte dagen")}</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <Chip key={d.key} on={value.days_needed.includes(d.key)} onClick={() => tog("days_needed", d.key)}>
              {l(d.fr, d.nl)}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className={label}>{l("Plages horaires", "Uurroosters")}</p>
        <div className="flex flex-wrap gap-2">
          {SLOTS.map((s) => (
            <Chip key={s.key} on={value.time_slots.includes(s.key)} onClick={() => tog("time_slots", s.key)}>
              {l(s.fr, s.nl)}
            </Chip>
          ))}
        </div>
        <input className={`${input} mt-2`} maxLength={120} value={value.schedule_note}
          placeholder={l("Précision (ex. 18h–23h)", "Verduidelijking (bv. 18u–23u)")}
          onChange={(e) => set({ schedule_note: e.target.value })} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="pl-loc">{l("Lieu de prestation", "Plaats van uitvoering")}</label>
          <input id="pl-loc" className={input} maxLength={160} value={value.work_location}
            placeholder={l("Adresse ou site (facultatif)", "Adres of site (optioneel)")}
            onChange={(e) => set({ work_location: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="pl-req">{l("Conditions requises", "Vereiste voorwaarden")}</label>
          <input id="pl-req" className={input} maxLength={300} value={value.requirements}
            placeholder={l("Ex. 18 ans minimum, tenue de travail…", "Bv. minimum 18 jaar, werkkledij…")}
            onChange={(e) => set({ requirements: e.target.value })} />
        </div>
      </div>

      {flexi && (
        <p className="flex gap-2 text-xs text-ink-600 bg-white border border-amber-200 rounded-xl p-3">
          <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
          <span>
            {l(
              "Flexi-job : le recours à un flexi-job est soumis à des conditions légales belges (statut du travailleur, période de référence, commission paritaire et secteurs concernés). Ces règles évoluent : il vous appartient de vérifier qu'elles s'appliquent à ce poste. Wolko ne vérifie pas l'éligibilité des candidats ni de l'employeur.",
              "Flexi-job: het gebruik van een flexi-job is onderworpen aan Belgische wettelijke voorwaarden (statuut van de werknemer, referentieperiode, paritair comité en betrokken sectoren). Die regels evolueren: u bent zelf verantwoordelijk om na te gaan of ze op deze functie van toepassing zijn. Wolko controleert de geschiktheid van kandidaten of werkgever niet."
            )}
          </span>
        </p>
      )}
    </section>
  );
}
