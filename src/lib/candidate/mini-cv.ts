import { EMPTY_CV, type CvData } from "@/lib/candidate/cv";
import type { CvBase } from "@/components/candidat/CvSheet";

/** Mini-CV créé en postulant (« je n'ai pas de CV ») : stocké en JSON à côté de la candidature. */
export const MINI_SUFFIX = ".wolko.json";
export const isMiniPath = (p: string | null | undefined) => Boolean(p && p.endsWith(MINI_SUFFIX));

export const DURATIONS = [
  { key: "lt6m", fr: "Moins de 6 mois", nl: "Minder dan 6 maanden" },
  { key: "6m1y", fr: "6 mois à 1 an", nl: "6 maanden tot 1 jaar" },
  { key: "1y3y", fr: "1 à 3 ans", nl: "1 tot 3 jaar" },
  { key: "3y5y", fr: "3 à 5 ans", nl: "3 tot 5 jaar" },
  { key: "5y", fr: "Plus de 5 ans", nl: "Meer dan 5 jaar" },
] as const;

export type MiniJob = { role: string; company: string; duration: string };
export type MiniInput = { jobs: MiniJob[]; diploma: string; about: string; firstJob: boolean };
export const EMPTY_MINI: MiniInput = { jobs: [{ role: "", company: "", duration: "" }], diploma: "", about: "", firstJob: false };

const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001F]/g, " ").trim().slice(0, max) : "");

export function sanitizeMini(raw: unknown): MiniInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const jobs = (Array.isArray(r.jobs) ? r.jobs : []).slice(0, 2).map((j) => {
    const o = (j && typeof j === "object" ? j : {}) as Record<string, unknown>;
    const d = DURATIONS.find((x) => x.key === o.duration)?.key ?? "";
    return { role: s(o.role, 80), company: s(o.company, 80), duration: d };
  }).filter((j) => j.role);
  const firstJob = r.firstJob === true;
  const out = { jobs, diploma: s(r.diploma, 100), about: s(r.about, 300), firstJob };
  return jobs.length || firstJob || out.diploma || out.about ? out : null;
}

/** Le mini-CV est-il suffisant pour être envoyé ? (au moins un poste, ou « premier emploi ») */
export const miniReady = (m: MiniInput) => m.firstJob || m.jobs.some((j) => j.role.trim().length >= 2);

export function miniToCv(m: MiniInput, lang: "fr" | "nl" = "fr"): CvData {
  const dur = (k: string) => { const d = DURATIONS.find((x) => x.key === k); return d ? (lang === "nl" ? d.nl : d.fr) : ""; };
  return {
    ...EMPTY_CV,
    headline: m.jobs[0]?.role ?? "",
    summary: m.about || (m.firstJob ? (lang === "nl" ? "Op zoek naar een eerste job, gemotiveerd en snel inzetbaar." : "À la recherche d'un premier emploi, motivé(e) et disponible rapidement.") : ""),
    experiences: m.jobs.map((j) => ({ role: j.role, company: j.company, city: "", from: dur(j.duration), to: "", details: "" })),
    education: m.diploma ? [{ title: m.diploma, school: "", year: "" }] : [],
  };
}

export type MiniDoc = { v: 1; base: CvBase; cv: CvData };
