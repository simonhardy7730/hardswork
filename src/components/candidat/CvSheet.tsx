"use client";

import type { CvData } from "@/lib/candidate/cv";
import { useL } from "@/lib/i18n/context";

export type CvBase = {
  name: string; phone: string; email: string; city: string; trades: string[]; sectors: string[];
  licenses: string[]; caces: string[]; languages: string[]; experienceYears: number | null; availability: string;
};

/** Impression : seule la feuille du CV est imprimée (PDF A4). */
export const CV_PRINT_CSS = `
        @media print {
          @page { size: A4; margin: 0; }
          html, body { height: 297mm !important; overflow: hidden !important; }
          body * { visibility: hidden !important; }
          #cv-sheet, #cv-sheet * { visibility: visible !important; }
          #cv-sheet { position: fixed; left: 0; top: 0; width: 210mm; min-height: 297mm; box-shadow: none !important; border: 0 !important; border-radius: 0 !important; transform: none !important; }
          #cv-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `;

/** Feuille de CV Wolko (aperçu candidat, consultation recruteur, impression PDF). */
export default function CvSheet({ base, cv }: { base: CvBase; cv: CvData }) {
  const l = useL();
  const headline = cv.headline || base.trades[0] || "";
  return (
    <div id="cv-sheet" className="bg-white border border-ink-100 rounded-xl shadow-sm overflow-hidden text-[#101F43]" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <div style={{ background: "#101F43", color: "#fff", padding: "42px 32px 28px", position: "relative" }}>
        <div style={{ position: "absolute", top: 14, right: 16, display: "flex", alignItems: "center", gap: 6, background: "#FFB900", color: "#101F43", borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={14} height={14} style={{ borderRadius: 3 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          {l("CV créé avec Wolko", "Cv gemaakt met Wolko")}
        </div>
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
      <div style={{ fontSize: 9.5, color: "#94A3B8", textAlign: "right", padding: "6px 16px 10px" }}>{l("CV créé par Wolko à partir des informations données par le candidat · wolko.be", "Cv gemaakt door Wolko op basis van de gegevens van de kandidaat · wolko.be")}</div>
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
