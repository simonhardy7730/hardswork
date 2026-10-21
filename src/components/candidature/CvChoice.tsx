"use client";

import { Plus } from "lucide-react";
import CvPicker from "./CvPicker";
import { useL } from "@/lib/i18n/context";
import { DURATIONS, type MiniInput } from "@/lib/candidate/mini-cv";

export type CvMode = "" | "file" | "mini";

/** « As-tu un CV ? » — Oui : photo / fichier. Non : 3 questions, Wolko crée un mini-CV (sans IA). */
export default function CvChoice({ mode, onMode, file, onFile, mini, onMini }: {
  mode: CvMode; onMode: (m: CvMode) => void;
  file: File | null; onFile: (f: File | null) => void;
  mini: MiniInput; onMini: (m: MiniInput) => void;
}) {
  const l = useL();
  const inp = "w-full h-11 rounded-xl border border-ink-100 px-3 text-sm bg-white focus:outline-none focus:border-brand";
  const setJob = (i: number, p: Partial<MiniInput["jobs"][number]>) => onMini({ ...mini, jobs: mini.jobs.map((j, k) => (k === i ? { ...j, ...p } : j)) });
  const pill = (on: boolean) => `h-12 rounded-xl border-2 text-sm font-black transition ${on ? "border-brand bg-brand/10 text-ink" : "border-ink-100 text-ink-500"}`;

  return (
    <div className="space-y-3">
      <div>
        <p className="block text-sm font-medium text-ink mb-1.5">{l("As-tu un CV ?", "Heb je een cv?")}</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onMode("file")} className={pill(mode === "file")}>{l("Oui", "Ja")} 📄</button>
          <button type="button" onClick={() => { onMode("mini"); onFile(null); }} className={pill(mode === "mini")}>{l("Non, pas de CV", "Nee, geen cv")}</button>
        </div>
      </div>

      {mode === "file" && <CvPicker file={file} onChange={onFile} />}

      {mode === "mini" && (
        <div className="border border-ink-100 rounded-2xl p-4 space-y-3 bg-surface">
          <p className="text-sm text-ink"><strong>{l("Pas de souci 👍", "Geen probleem 👍")}</strong> {l("Réponds à ces questions, on crée ton CV automatiquement pour l'employeur.", "Beantwoord deze vragen, we maken automatisch je cv voor de werkgever.")}</p>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={mini.firstJob} onChange={(e) => onMini({ ...mini, firstJob: e.target.checked })} className="w-4 h-4 accent-brand" />
            {l("C'est mon premier emploi", "Dit is mijn eerste job")}
          </label>
          {!mini.firstJob && mini.jobs.map((j, i) => (
            <div key={i} className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-ink-400">{i === 0 ? l("Ton dernier travail", "Je laatste job") : l("Le travail d'avant", "De job daarvoor")}</p>
              <input className={inp} value={j.role} maxLength={80} onChange={(e) => setJob(i, { role: e.target.value })} placeholder={l("Poste (ex : magasinier, chauffeur C)", "Functie (bv. magazijnier, chauffeur C)")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className={inp} value={j.company} maxLength={80} onChange={(e) => setJob(i, { company: e.target.value })} placeholder={l("Entreprise (facultatif)", "Bedrijf (optioneel)")} />
                <select className={inp} value={j.duration} onChange={(e) => setJob(i, { duration: e.target.value })} aria-label={l("Combien de temps", "Hoelang")}>
                  <option value="">{l("Combien de temps ?", "Hoelang?")}</option>
                  {DURATIONS.map((d) => <option key={d.key} value={d.key}>{l(d.fr, d.nl)}</option>)}
                </select>
              </div>
            </div>
          ))}
          {!mini.firstJob && mini.jobs.length < 2 && (
            <button type="button" onClick={() => onMini({ ...mini, jobs: [...mini.jobs, { role: "", company: "", duration: "" }] })}
              className="text-sm font-bold text-[#101F43] inline-flex items-center gap-1"><Plus size={14} />{l("Ajouter le travail d'avant", "Vorige job toevoegen")}</button>
          )}
          <input className={inp} value={mini.diploma} maxLength={100} onChange={(e) => onMini({ ...mini, diploma: e.target.value })} placeholder={l("Diplôme ou formation (facultatif, ex : VCA, CESS)", "Diploma of opleiding (optioneel, bv. VCA)")} />
          <input className={inp} value={mini.about} maxLength={300} onChange={(e) => onMini({ ...mini, about: e.target.value })} placeholder={l("Un mot sur toi (facultatif, ex : ponctuel, motivé)", "Iets over jezelf (optioneel, bv. stipt, gemotiveerd)")} />
        </div>
      )}
    </div>
  );
}
