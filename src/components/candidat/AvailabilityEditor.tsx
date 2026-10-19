"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, Plus, Trash2 } from "lucide-react";
import { saveAvailability } from "@/app/candidat/compte/actions";
import { useL, useLang } from "@/lib/i18n/context";
import { DAYS, SLOTS, type AvailabilityState, type Exception } from "@/lib/candidate/availability";

const input =
  "px-3 py-2 bg-white border border-ink-100 rounded-xl text-ink text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition";

export default function AvailabilityEditor({ initial }: { initial: AvailabilityState }) {
  const l = useL();
  const lang = useLang();
  const [recurring, setRecurring] = useState<string[]>(initial.recurring);
  const [exceptions, setExceptions] = useState<Exception[]>(initial.exceptions);
  const [draft, setDraft] = useState<Exception>({ kind: "available", date_from: "", date_to: "", note: "" });
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();
  const touch = () => setState("idle");

  const toggle = (k: string) => { setRecurring((r) => (r.includes(k) ? r.filter((x) => x !== k) : [...r, k])); touch(); };
  const setMany = (keys: string[], on: boolean) => {
    setRecurring((r) => (on ? Array.from(new Set([...r, ...keys])) : r.filter((x) => !keys.includes(x))));
    touch();
  };
  const weekdays = DAYS.filter((d) => !["sat", "sun", "holiday"].includes(d.key)).map((d) => d.key);
  const presets = [
    { fr: "Soirées en semaine", nl: "Weekavonden", keys: weekdays.map((d) => `${d}:evening`) },
    { fr: "Week-ends", nl: "Weekends", keys: ["sat", "sun"].flatMap((d) => SLOTS.filter((s) => s.key !== "night").map((s) => `${d}:${s.key}`)) },
  ];

  const canAdd = draft.date_from && draft.date_to && draft.date_to >= draft.date_from;
  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE");

  return (
    <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
          {l("Mes disponibilités", "Mijn beschikbaarheid")}
        </p>
        <p className="text-xs text-ink-400 mt-1">
          {l("Pour les jobs étudiants et flexi-jobs. Les recruteurs n'y accèdent que lorsqu'ils y sont autorisés.",
             "Voor studentenjobs en flexi-jobs. Recruiters zien dit enkel wanneer ze daartoe gemachtigd zijn.")}
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Raccourcis */}
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const all = p.keys.every((k) => recurring.includes(k));
            return (
              <button key={p.fr} type="button" onClick={() => setMany(p.keys, !all)} aria-pressed={all}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition ${
                  all ? "border-brand bg-brand text-white" : "border-ink-100 text-ink-500 hover:border-brand/50"}`}>
                {l(p.fr, p.nl)}
              </button>
            );
          })}
          {recurring.length > 0 && (
            <button type="button" onClick={() => { setRecurring([]); touch(); }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-ink-400 hover:text-red-500 transition">
              {l("Tout effacer", "Alles wissen")}
            </button>
          )}
        </div>

        {/* Grille hebdomadaire */}
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[420px] border-separate border-spacing-1 text-center">
            <caption className="sr-only">{l("Disponibilités récurrentes", "Terugkerende beschikbaarheid")}</caption>
            <thead>
              <tr>
                <th className="w-20" />
                {SLOTS.map((s) => (
                  <th key={s.key} scope="col" className="text-[11px] font-bold text-ink-500 uppercase tracking-wide pb-1">
                    {l(s.fr, s.nl)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((d) => (
                <tr key={d.key}>
                  <th scope="row" className="text-left text-xs font-bold text-ink pr-2">
                    <span className="sm:hidden">{l(d.fr, d.nl)}</span>
                    <span className="hidden sm:inline">{l(d.frLong, d.nlLong)}</span>
                  </th>
                  {SLOTS.map((s) => {
                    const k = `${d.key}:${s.key}`;
                    const on = recurring.includes(k);
                    return (
                      <td key={k}>
                        <button type="button" onClick={() => toggle(k)} aria-pressed={on}
                          aria-label={`${l(d.frLong, d.nlLong)} ${l(s.fr, s.nl)}`}
                          className={`w-full h-9 rounded-lg border transition ${
                            on ? "bg-brand border-brand text-white" : "bg-surface border-ink-100 hover:border-brand/50"}`}>
                          {on && <Check size={14} className="mx-auto" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dates ponctuelles */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-ink-500 uppercase tracking-widest">
            {l("Dates exceptionnelles et indisponibilités", "Uitzonderlijke data en onbeschikbaarheid")}
          </p>
          <p className="text-xs text-ink-400">
            {l("Ex. disponible pendant les vacances de Pâques, ou indisponible pendant tes examens.",
               "Bv. beschikbaar tijdens de paasvakantie, of niet beschikbaar tijdens je examens.")}
          </p>
          {exceptions.length > 0 && (
            <ul className="space-y-2">
              {exceptions.map((e, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2 text-sm">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    e.kind === "available" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {e.kind === "available" ? l("Disponible", "Beschikbaar") : l("Indisponible", "Niet beschikbaar")}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-ink">
                    {fmt(e.date_from)}{e.date_to !== e.date_from ? ` → ${fmt(e.date_to)}` : ""}{e.note ? ` · ${e.note}` : ""}
                  </span>
                  <button type="button" aria-label={l("Supprimer", "Verwijderen")}
                    onClick={() => { setExceptions((x) => x.filter((_, j) => j !== i)); touch(); }}
                    className="text-ink-300 hover:text-red-500 transition"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-2 sm:grid-cols-[auto_1fr_1fr] items-end">
            <select aria-label={l("Type", "Type")} className={input} value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value as Exception["kind"] })}>
              <option value="available">{l("Disponible", "Beschikbaar")}</option>
              <option value="unavailable">{l("Indisponible", "Niet beschikbaar")}</option>
            </select>
            <label className="text-[11px] font-bold text-ink-500">{l("Du", "Van")}
              <input type="date" className={`${input} w-full mt-1`} value={draft.date_from}
                onChange={(e) => setDraft({ ...draft, date_from: e.target.value, date_to: draft.date_to && draft.date_to >= e.target.value ? draft.date_to : e.target.value })} />
            </label>
            <label className="text-[11px] font-bold text-ink-500">{l("Au", "Tot")}
              <input type="date" className={`${input} w-full mt-1`} value={draft.date_to} min={draft.date_from}
                onChange={(e) => setDraft({ ...draft, date_to: e.target.value })} />
            </label>
          </div>
          <div className="flex gap-2">
            <input className={`${input} flex-1`} maxLength={120} value={draft.note}
              placeholder={l("Note (facultatif)", "Notitie (optioneel)")}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            <button type="button" disabled={!canAdd || exceptions.length >= 50}
              onClick={() => { setExceptions((x) => [...x, draft]); setDraft({ kind: draft.kind, date_from: "", date_to: "", note: "" }); touch(); }}
              className="inline-flex items-center gap-1.5 px-4 rounded-xl border border-brand text-brand text-sm font-bold hover:bg-brand hover:text-white transition disabled:opacity-40 disabled:pointer-events-none">
              <Plus size={14} /> {l("Ajouter", "Toevoegen")}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" disabled={pending}
            onClick={() => start(async () => { const r = await saveAvailability({ recurring, exceptions }); setState(r.ok ? "saved" : "error"); })}
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm px-5 py-2.5 rounded-xl transition disabled:opacity-60"
            style={{ letterSpacing: "0.05em" }}>
            {pending && <Loader2 size={14} className="animate-spin" />}
            {l("Enregistrer", "Opslaan")}
          </button>
          {state === "saved" && <span role="status" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600"><Check size={14} /> {l("Enregistré", "Opgeslagen")}</span>}
          {state === "error" && <span role="alert" className="text-sm font-semibold text-red-500">{l("Impossible d'enregistrer pour le moment.", "Opslaan is momenteel niet mogelijk.")}</span>}
        </div>
      </div>
    </div>
  );
}
