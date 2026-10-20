"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Printer, Check } from "lucide-react";
import { saveCv } from "@/app/candidat/compte/actions";
import type { CvData, CvExperience, CvEducation } from "@/lib/candidate/cv";
import { useL } from "@/lib/i18n/context";

type Base = {
  name: string; phone: string; email: string; city: string; trades: string[]; sectors: string[];
  licenses: string[]; caces: string[]; languages: string[]; experienceYears: number | null; availability: string;
};

const EXP: CvExperience = { role: "", company: "", city: "", from: "", to: "", details: "" };
const EDU: CvEducation = { title: "", school: "", year: "" };

/** Créateur de CV : le candidat remplit, l'aperçu se met à jour, « Télécharger » ouvre l'impression (PDF). Aucune IA. */
export default function CvBuilder({ base, initial, canSave }: { base: Base; initial: CvData; canSave: boolean }) {
  const l = useL();
  const [cv, setCv] = useState<CvData>(initial);
  const [skill, setSkill] = useState("");
  const [msg, setMsg] = useState<"" | "ok" | "err">("");
  const [pending, start] = useTransition();
  const up = (p: Partial<CvData>) => { setMsg(""); setCv((c) => ({ ...c, ...p })); };
  const setExp = (i: number, p: Partial<CvExperience>) => up({ experiences: cv.experiences.map((e, j) => (j === i ? { ...e, ...p } : e)) });
  const setEdu = (i: number, p: Partial<CvEducation>) => up({ education: cv.education.map((e, j) => (j === i ? { ...e, ...p } : e)) });
  const addSkill = () => { const v = skill.trim(); if (v && !cv.skills.includes(v) && cv.skills.length < 15) up({ skills: [...cv.skills, v] }); setSkill(""); };
  const save = () => new Promise<boolean>((res) => start(async () => { const r = await saveCv(cv); setMsg(r.ok ? "ok" : "err"); res(r.ok); }));
  const download = async () => { if (canSave) await save(); window.print(); };

  const inp = "w-full h-10 rounded-xl border border-ink-100 px-3 text-sm bg-white focus:outline-none focus:border-brand";
  const lab = "block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1";
  const card = "bg-white border border-ink-100 rounded-2xl p-5 space-y-3";
  const headline = cv.headline || base.trades[0] || "";

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { height: 297mm !important; overflow: hidden !important; }
          body * { visibility: hidden !important; }
          #cv-sheet, #cv-sheet * { visibility: visible !important; }
          #cv-sheet { position: fixed; left: 0; top: 0; width: 210mm; min-height: 297mm; box-shadow: none !important; border: 0 !important; border-radius: 0 !important; transform: none !important; }
          #cv-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="flex items-end justify-between gap-3 flex-wrap print:hidden">
        <div>
          <h1 className="font-display font-black text-ink uppercase text-2xl">{l("Mon CV", "Mijn cv")}</h1>
          <p className="text-sm text-ink-500">{l("Gratuit. Remplis les cases, ton CV se crée tout seul. Télécharge-le en PDF quand tu veux.", "Gratis. Vul de vakjes in, je cv maakt zichzelf. Download het als pdf wanneer je wilt.")}</p>
        </div>
        <div className="flex items-center gap-2">
          {canSave && (
            <button type="button" onClick={save} disabled={pending}
              className="h-11 px-5 rounded-xl border border-ink-100 bg-white text-sm font-bold text-ink disabled:opacity-50">
              {msg === "ok" ? <><Check size={14} className="inline mr-1" />{l("Enregistré", "Opgeslagen")}</> : l("Enregistrer", "Opslaan")}
            </button>
          )}
          <button type="button" onClick={download}
            className="h-11 px-5 rounded-xl bg-brand text-[#101F43] text-sm font-black uppercase inline-flex items-center gap-2" style={{ letterSpacing: "0.04em" }}>
            <Printer size={15} /> {l("Télécharger en PDF", "Download als pdf")}
          </button>
        </div>
      </div>
      {msg === "err" && <p className="text-sm text-red-600 print:hidden">{l("Enregistrement impossible, réessaie.", "Opslaan mislukt, probeer opnieuw.")}</p>}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* ── Formulaire ── */}
        <div className="space-y-4 print:hidden">
          <div className={card}>
            <p className="text-xs text-ink-400">{l("Nom, téléphone, ville, métiers, permis et langues viennent de ton profil (modifiables dans « Mon compte »).", "Naam, telefoon, stad, beroepen, rijbewijzen en talen komen uit je profiel (aan te passen in « Mijn account »).")}</p>
            <div><label className={lab}>{l("Titre du CV", "Titel van je cv")}</label>
              <input className={inp} value={cv.headline} maxLength={90} placeholder={base.trades[0] || l("ex : Électricien industriel", "bv. Industrieel elektricien")} onChange={(e) => up({ headline: e.target.value })} /></div>
            <div><label className={lab}>{l("Quelques mots sur toi", "Een paar woorden over jezelf")}</label>
              <textarea className={`${inp} h-24 py-2`} value={cv.summary} maxLength={600} placeholder={l("ex : Motivé, ponctuel, 5 ans d'expérience sur chantier. Je cherche un poste stable près de Tournai.", "bv. Gemotiveerd, stipt, 5 jaar ervaring op de werf.")} onChange={(e) => up({ summary: e.target.value })} /></div>
          </div>

          <div className={card}>
            <p className="font-bold text-ink text-sm">{l("Expériences", "Ervaring")}</p>
            {cv.experiences.map((e, i) => (
              <div key={i} className="border border-ink-100 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder={l("Poste", "Functie")} value={e.role} maxLength={80} onChange={(v) => setExp(i, { role: v.target.value })} />
                  <input className={inp} placeholder={l("Entreprise", "Bedrijf")} value={e.company} maxLength={80} onChange={(v) => setExp(i, { company: v.target.value })} />
                  <input className={inp} placeholder={l("Ville", "Stad")} value={e.city} maxLength={60} onChange={(v) => setExp(i, { city: v.target.value })} />
                  <div className="flex gap-2">
                    <input className={inp} placeholder={l("Début (2021)", "Start (2021)")} value={e.from} maxLength={20} onChange={(v) => setExp(i, { from: v.target.value })} />
                    <input className={inp} placeholder={l("Fin / auj.", "Einde / nu")} value={e.to} maxLength={20} onChange={(v) => setExp(i, { to: v.target.value })} />
                  </div>
                </div>
                <textarea className={`${inp} h-16 py-2`} placeholder={l("Ce que tu faisais (facultatif)", "Wat je deed (optioneel)")} value={e.details} maxLength={400} onChange={(v) => setExp(i, { details: v.target.value })} />
                <button type="button" onClick={() => up({ experiences: cv.experiences.filter((_, j) => j !== i) })} className="text-xs text-red-600 inline-flex items-center gap-1"><Trash2 size={12} />{l("Retirer", "Verwijderen")}</button>
              </div>
            ))}
            {cv.experiences.length < 8 && <button type="button" onClick={() => up({ experiences: [...cv.experiences, { ...EXP }] })} className="text-sm font-bold text-[#101F43] inline-flex items-center gap-1"><Plus size={14} />{l("Ajouter une expérience", "Ervaring toevoegen")}</button>}
          </div>

          <div className={card}>
            <p className="font-bold text-ink text-sm">{l("Formations et certificats", "Opleidingen en attesten")}</p>
            {cv.education.map((e, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_90px_auto] gap-2 items-center">
                <input className={inp} placeholder={l("Diplôme / certificat (VCA…)", "Diploma / attest (VCA…)")} value={e.title} maxLength={100} onChange={(v) => setEdu(i, { title: v.target.value })} />
                <input className={inp} placeholder={l("École / organisme", "School / instelling")} value={e.school} maxLength={100} onChange={(v) => setEdu(i, { school: v.target.value })} />
                <input className={inp} placeholder={l("Année", "Jaar")} value={e.year} maxLength={12} onChange={(v) => setEdu(i, { year: v.target.value })} />
                <button type="button" aria-label={l("Retirer", "Verwijderen")} onClick={() => up({ education: cv.education.filter((_, j) => j !== i) })} className="text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
            {cv.education.length < 6 && <button type="button" onClick={() => up({ education: [...cv.education, { ...EDU }] })} className="text-sm font-bold text-[#101F43] inline-flex items-center gap-1"><Plus size={14} />{l("Ajouter une formation", "Opleiding toevoegen")}</button>}
          </div>

          <div className={card}>
            <p className="font-bold text-ink text-sm">{l("Compétences", "Vaardigheden")}</p>
            <div className="flex gap-2">
              <input className={inp} placeholder={l("ex : Lecture de plans", "bv. Plannen lezen")} value={skill} maxLength={40}
                onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
              <button type="button" onClick={addSkill} className="h-10 px-4 rounded-xl bg-[#101F43] text-white text-sm font-bold">{l("Ajouter", "Toevoegen")}</button>
            </div>
            <div className="flex flex-wrap gap-2">{cv.skills.map((k) => (
              <button key={k} type="button" onClick={() => up({ skills: cv.skills.filter((x) => x !== k) })} className="px-3 py-1 rounded-full bg-surface-2 text-xs font-bold text-ink">{k} ✕</button>
            ))}</div>
            <div><label className={lab}>{l("Loisirs (facultatif)", "Hobby's (optioneel)")}</label>
              <input className={inp} value={cv.hobbies} maxLength={200} onChange={(e) => up({ hobbies: e.target.value })} /></div>
          </div>
        </div>

        {/* ── Aperçu A4 ── */}
        <div className="lg:sticky lg:top-4">
          <div id="cv-sheet" className="bg-white border border-ink-100 rounded-xl shadow-sm overflow-hidden text-[#101F43]" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
            <div style={{ background: "#101F43", color: "#fff", padding: "28px 32px" }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.01em" }}>{base.name || l("Ton nom", "Je naam")}</div>
              {headline && <div style={{ color: "#FFB900", fontWeight: 800, fontSize: 15, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{headline}</div>}
              <div style={{ fontSize: 12, marginTop: 10, opacity: 0.9, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                {base.phone && <span>📞 {base.phone}</span>}{base.email && <span>✉️ {base.email}</span>}{base.city && <span>📍 {base.city}</span>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "34% 66%", minHeight: 520 }}>
              <div style={{ background: "#FFF6DE", padding: "22px 20px", fontSize: 12, lineHeight: 1.5 }}>
                {[
                  [l("Métiers", "Beroepen"), base.trades.length ? base.trades : base.sectors],
                  [l("Permis", "Rijbewijzen"), base.licenses],
                  ["CACES", base.caces],
                  [l("Langues", "Talen"), base.languages],
                  [l("Compétences", "Vaardigheden"), cv.skills],
                ].filter(([, v]) => (v as string[]).length > 0).map(([t, v]) => (
                  <div key={t as string} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A5D00", marginBottom: 6 }}>{t as string}</div>
                    {(v as string[]).map((x) => <div key={x}>• {x}</div>)}
                  </div>
                ))}
                {(base.experienceYears || base.availability) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A5D00", marginBottom: 6 }}>{l("En bref", "In het kort")}</div>
                    {base.experienceYears ? <div>• {base.experienceYears} {l("an(s) d'expérience", "jaar ervaring")}</div> : null}
                    {base.availability && <div>• {l("Disponible", "Beschikbaar")} : {base.availability.toLowerCase()}</div>}
                  </div>
                )}
              </div>
              <div style={{ padding: "22px 26px", fontSize: 12.5, lineHeight: 1.5 }}>
                {cv.summary && <Section title={l("Profil", "Profiel")}><p style={{ whiteSpace: "pre-line" }}>{cv.summary}</p></Section>}
                {cv.experiences.length > 0 && (
                  <Section title={l("Expériences", "Ervaring")}>
                    {cv.experiences.map((e, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 800 }}>{e.role}{e.company && <span style={{ fontWeight: 600, color: "#475569" }}> · {e.company}</span>}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{[e.city, [e.from, e.to].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</div>
                        {e.details && <div style={{ marginTop: 3, whiteSpace: "pre-line" }}>{e.details}</div>}
                      </div>
                    ))}
                  </Section>
                )}
                {cv.education.length > 0 && (
                  <Section title={l("Formations", "Opleidingen")}>
                    {cv.education.map((e, i) => (
                      <div key={i} style={{ marginBottom: 8 }}><span style={{ fontWeight: 800 }}>{e.title}</span>{e.school && <span style={{ color: "#475569" }}> · {e.school}</span>}{e.year && <span style={{ color: "#64748B" }}> ({e.year})</span>}</div>
                    ))}
                  </Section>
                )}
                {cv.hobbies && <Section title={l("Loisirs", "Hobby's")}><p>{cv.hobbies}</p></Section>}
                {!cv.summary && cv.experiences.length === 0 && cv.education.length === 0 && (
                  <p style={{ color: "#94A3B8" }}>{l("Remplis le formulaire : ton CV apparaît ici.", "Vul het formulier in: je cv verschijnt hier.")}</p>
                )}
              </div>
            </div>
            <div style={{ fontSize: 9.5, color: "#94A3B8", textAlign: "right", padding: "6px 16px 10px" }}>{l("CV créé gratuitement sur wolko.be", "Cv gratis gemaakt op wolko.be")}</div>
          </div>
          <p className="text-xs text-ink-400 mt-2 print:hidden">{l("Astuce : dans la fenêtre d'impression, choisis « Enregistrer au format PDF ».", "Tip: kies in het afdrukvenster « Opslaan als pdf ».")}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#101F43", borderBottom: "2px solid #FFB900", paddingBottom: 3, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
