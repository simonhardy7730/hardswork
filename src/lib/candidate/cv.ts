/** Données du CV construit sur Wolko (stockées dans candidates.cv_data). Tout est saisi par le candidat. */
export type CvExperience = { role: string; company: string; city: string; from: string; to: string; details: string };
export type CvEducation = { title: string; school: string; year: string };
export type CvData = { headline: string; summary: string; experiences: CvExperience[]; education: CvEducation[]; skills: string[]; hobbies: string };

export const EMPTY_CV: CvData = { headline: "", summary: "", experiences: [], education: [], skills: [], hobbies: "" };

const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : "");
const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);

export function sanitizeCv(raw: unknown): CvData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    headline: s(r.headline, 90),
    summary: s(r.summary, 600),
    experiences: arr(r.experiences).map((e) => ({
      role: s(e.role, 80), company: s(e.company, 80), city: s(e.city, 60), from: s(e.from, 20), to: s(e.to, 20), details: s(e.details, 400),
    })).filter((e) => e.role || e.company).slice(0, 8),
    education: arr(r.education).map((e) => ({ title: s(e.title, 100), school: s(e.school, 100), year: s(e.year, 12) })).filter((e) => e.title || e.school).slice(0, 6),
    skills: (Array.isArray(r.skills) ? r.skills : []).map((x) => s(x, 40)).filter(Boolean).slice(0, 15),
    hobbies: s(r.hobbies, 200),
  };
}

export function asCv(v: unknown): CvData { return { ...EMPTY_CV, ...sanitizeCv(v) }; }
