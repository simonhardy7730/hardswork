/** Calendrier de disponibilités (étape 3). Récurrent : jour × créneau. Ponctuel : dates précises. */
export const DAYS = [
  { key: "mon", fr: "Lun", nl: "Ma", frLong: "Lundi", nlLong: "Maandag" },
  { key: "tue", fr: "Mar", nl: "Di", frLong: "Mardi", nlLong: "Dinsdag" },
  { key: "wed", fr: "Mer", nl: "Wo", frLong: "Mercredi", nlLong: "Woensdag" },
  { key: "thu", fr: "Jeu", nl: "Do", frLong: "Jeudi", nlLong: "Donderdag" },
  { key: "fri", fr: "Ven", nl: "Vr", frLong: "Vendredi", nlLong: "Vrijdag" },
  { key: "sat", fr: "Sam", nl: "Za", frLong: "Samedi", nlLong: "Zaterdag" },
  { key: "sun", fr: "Dim", nl: "Zo", frLong: "Dimanche", nlLong: "Zondag" },
  { key: "holiday", fr: "Fériés", nl: "Feest", frLong: "Jours fériés", nlLong: "Feestdagen" },
] as const;

export const SLOTS = [
  { key: "morning",   fr: "Matin",       nl: "Voormiddag" },
  { key: "afternoon", fr: "Après-midi",  nl: "Namiddag" },
  { key: "evening",   fr: "Soirée",      nl: "Avond" },
  { key: "night",     fr: "Nuit",        nl: "Nacht" },
] as const;

export interface Exception {
  kind: "available" | "unavailable";
  date_from: string; // YYYY-MM-DD
  date_to: string;
  note: string;
}
export interface AvailabilityState {
  recurring: string[]; // "mon:evening"
  exceptions: Exception[];
}
export const EMPTY_AVAILABILITY: AvailabilityState = { recurring: [], exceptions: [] };

const dayKeys: string[] = DAYS.map((d) => d.key);
const slotKeys: string[] = SLOTS.map((s) => s.key);
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));

/** Liste blanche stricte avant toute écriture en base. */
export function sanitizeAvailability(raw: unknown): AvailabilityState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const recurring = Array.from(
    new Set(
      (Array.isArray(r.recurring) ? r.recurring : []).filter((x: unknown) => {
        if (typeof x !== "string") return false;
        const [d, s] = x.split(":");
        return dayKeys.includes(d) && slotKeys.includes(s);
      }) as string[]
    )
  );
  const exceptions: Exception[] = (Array.isArray(r.exceptions) ? r.exceptions : [])
    .slice(0, 50)
    .filter((e: any) => e && (e.kind === "available" || e.kind === "unavailable") && isDate(e.date_from) && isDate(e.date_to) && e.date_to >= e.date_from)
    .map((e: any) => ({
      kind: e.kind,
      date_from: e.date_from,
      date_to: e.date_to,
      note: typeof e.note === "string" ? e.note.trim().slice(0, 120) : "",
    }));
  return { recurring, exceptions };
}
