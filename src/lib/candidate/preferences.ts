/**
 * Préférences de recherche d'emploi (étape 2 du brief jobs étudiants / flexi-jobs).
 * Un seul profil candidat : un candidat peut cocher plusieurs types en même temps.
 * Aucune règle légale n'est codée ici : l'éligibilité reste « à confirmer ».
 */
export const JOB_TYPES = [
  { key: "cdi_cdd",  fr: "CDI / CDD",    nl: "Onbepaalde / bepaalde duur" },
  { key: "interim",  fr: "Intérim",      nl: "Interim" },
  { key: "etudiant", fr: "Job étudiant", nl: "Studentenjob" },
  { key: "flexi",    fr: "Flexi-job",    nl: "Flexi-job" },
  { key: "stage",    fr: "Stage",        nl: "Stage" },
  { key: "autre",    fr: "Autre",        nl: "Andere" },
] as const;

export const STUDENT_SLOTS = [
  { key: "after_class", fr: "Après les cours", nl: "Na de les" },
  { key: "weekend",     fr: "Week-end",        nl: "Weekend" },
  { key: "evening",     fr: "Soirée",          nl: "Avond" },
] as const;

export const FLEXI_SITUATIONS = [
  { key: "",          fr: "Je préfère ne pas préciser",          nl: "Liever niet zeggen" },
  { key: "employee",  fr: "Salarié(e) chez un autre employeur",  nl: "Werknemer bij een andere werkgever" },
  { key: "retired",   fr: "Pensionné(e)",                        nl: "Gepensioneerd" },
  { key: "other",     fr: "Autre situation",                     nl: "Andere situatie" },
  { key: "unknown",   fr: "Je ne sais pas",                      nl: "Ik weet het niet" },
] as const;

export const MISSION_TYPES = [
  { key: "",          fr: "Peu importe",  nl: "Maakt niet uit" },
  { key: "ponctuelle", fr: "Ponctuelles", nl: "Eenmalig" },
  { key: "reguliere",  fr: "Régulières",  nl: "Regelmatig" },
] as const;

export interface StudentProfile {
  study_field?: string;
  school?: string;
  avail_school_year?: string[];
  avail_holidays?: boolean;
  mobility_km?: number | null;
  skills?: string;
  experience?: string;
}
export interface FlexiProfile {
  radius_km?: number | null;
  avail_week?: boolean;
  avail_evening?: boolean;
  avail_weekend?: boolean;
  avail_holidays?: boolean;
  start_date?: string;
  mission_type?: string;
  situation?: string;
}
export interface Preferences {
  job_types: string[];
  is_student: boolean;
  student_profile: StudentProfile;
  flexi_profile: FlexiProfile;
}

export const EMPTY_PREFERENCES: Preferences = {
  job_types: [],
  is_student: false,
  student_profile: { avail_school_year: [] },
  flexi_profile: {},
};

const keys = (list: readonly { key: string }[]) => list.map((x) => x.key);
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const km = (v: unknown) => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 0 && n <= 500 ? Math.round(n) : null;
};
const bool = (v: unknown) => v === true;

/** Nettoyage côté serveur : liste blanche, tailles limitées. Ne donne jamais d'éligibilité. */
export function sanitizePreferences(raw: unknown) {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const allowedTypes = keys(JOB_TYPES);
  const job_types = Array.isArray(r.job_types)
    ? Array.from(new Set(r.job_types.filter((k: unknown) => typeof k === "string" && allowedTypes.includes(k))))
    : [];
  const wantsStudent = job_types.includes("etudiant");
  const wantsFlexi = job_types.includes("flexi");

  const sp = (r.student_profile ?? {}) as Record<string, any>;
  const fp = (r.flexi_profile ?? {}) as Record<string, any>;
  const slots = keys(STUDENT_SLOTS);

  const student_profile: StudentProfile = wantsStudent || r.is_student === true
    ? {
        study_field: str(sp.study_field),
        school: str(sp.school),
        avail_school_year: Array.isArray(sp.avail_school_year)
          ? sp.avail_school_year.filter((k: unknown) => typeof k === "string" && slots.includes(k))
          : [],
        avail_holidays: bool(sp.avail_holidays),
        mobility_km: km(sp.mobility_km),
        skills: str(sp.skills, 300),
        experience: str(sp.experience, 500),
      }
    : {};

  const sit = keys(FLEXI_SITUATIONS);
  const mis = keys(MISSION_TYPES);
  const start = str(fp.start_date, 10);
  const flexi_profile: FlexiProfile = wantsFlexi
    ? {
        radius_km: km(fp.radius_km),
        avail_week: bool(fp.avail_week),
        avail_evening: bool(fp.avail_evening),
        avail_weekend: bool(fp.avail_weekend),
        avail_holidays: bool(fp.avail_holidays),
        start_date: /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : "",
        mission_type: mis.includes(fp.mission_type) ? fp.mission_type : "",
        situation: sit.includes(fp.situation) ? fp.situation : "",
      }
    : {};

  return {
    job_types,
    is_student: wantsStudent || r.is_student === true,
    student_profile,
    flexi_interested: wantsFlexi,
    flexi_profile,
  };
}
