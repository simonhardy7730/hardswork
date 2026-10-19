// Contrat d'abonnement B2B WOLKO — logique PURE (dates en heure de Bruxelles, aucune dépendance navigateur).
// Règles de fonctionnement WOLKO (à valider par un juriste belge avant mise en production) :
//  • engagement initial de 12 mois à compter de l'activation de l'abonnement payant ;
//  • préavis de 30 jours avant l'échéance pour demander la non-reconduction ;
//  • ensuite : durée indéterminée, facturation mensuelle, résiliation avec 30 jours de préavis ;
//  • aucune pénalité inventée : une demande tardive prend simplement fin 30 jours après la demande.
import { renewalPriceCents, type BillablePlan } from "./pricing";

export const COMMITMENT_MONTHS = 12;
export const NOTICE_DAYS = 30;
export const RENEWAL_REMINDER_DAYS = 45;
export const TZ = "Europe/Brussels";
/** Version des conditions affichée/acceptée : à incrémenter à chaque changement de conditions. */
export const TERMS_VERSION = "2026-10";

/** Date calendaire "YYYY-MM-DD" (jour civil à Bruxelles). */
export type Ymd = string;

const dtf = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
});

function parts(t: number) {
  const o: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(t))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour };
}

const pad = (n: number) => String(n).padStart(2, "0");
const toYmd = (y: number, m: number, d: number): Ymd => `${y}-${pad(m)}-${pad(d)}`;
const fromYmd = (s: Ymd) => { const [y, m, d] = s.split("-").map(Number); return { y, m, d }; };

/** Jour civil (Bruxelles) d'un instant. */
export function brusselsDay(at: Date): Ymd {
  const p = parts(at.getTime());
  return toYmd(p.y, p.m, p.d);
}

/** Instant du minuit (heure de Bruxelles) qui ouvre le jour donné. */
export function brusselsMidnight(day: Ymd): Date {
  const { y, m, d } = fromYmd(day);
  for (const off of [1, 2]) {
    const t = Date.UTC(y, m - 1, d) - off * 3_600_000;
    const p = parts(t);
    if (p.y === y && p.m === m && p.d === d && p.h === 0) return new Date(t);
  }
  return new Date(Date.UTC(y, m - 1, d) - 3_600_000);
}

export function addDaysYmd(day: Ymd, n: number): Ymd {
  const { y, m, d } = fromYmd(day);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return toYmd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** + n mois calendaires, jour ramené au dernier jour du mois si besoin (31 janv. + 1 mois = 28/29 févr.). */
export function addMonthsYmd(day: Ymd, n: number): Ymd {
  const { y, m, d } = fromYmd(day);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return toYmd(first.getUTCFullYear(), first.getUTCMonth() + 1, Math.min(d, last));
}

export interface Commitment {
  /** Premier jour de l'engagement (jour de l'activation) */
  startDay: Ymd;
  /** Dernier jour inclus de l'engagement initial (ex. souscription le 15/11/2026 → 14/11/2027) */
  endDay: Ymd;
  /** Dernier jour pour demander la non-reconduction (endDay − 30 jours, inclus) */
  noticeDeadlineDay: Ymd;
  /** Instant exact de fin (minuit Bruxelles suivant le dernier jour) */
  endsAt: Date;
}

export function commitmentFor(subscribedAt: Date): Commitment {
  const startDay = brusselsDay(subscribedAt);
  const endDay = addDaysYmd(addMonthsYmd(startDay, COMMITMENT_MONTHS), -1);
  return {
    startDay,
    endDay,
    noticeDeadlineDay: addDaysYmd(endDay, -NOTICE_DAYS),
    endsAt: brusselsMidnight(addDaysYmd(endDay, 1)),
  };
}

/** Prochaine date de facturation mensuelle (anniversaire mensuel de l'activation), strictement après `now`. */
export function nextBillingDay(subscribedAt: Date, now: Date): Ymd {
  const start = brusselsDay(subscribedAt);
  const today = brusselsDay(now);
  let k = 1;
  while (addMonthsYmd(start, k) <= today) k++;
  return addMonthsYmd(start, k);
}

export type Phase = "initial" | "indefinite";
export const phaseAt = (c: Commitment, now: Date): Phase => (now.getTime() < c.endsAt.getTime() ? "initial" : "indefinite");

export interface CancellationPlan {
  phase: Phase;
  /** Préavis respecté (sinon : demande tardive, signalée à l'équipe pour examen) */
  noticeRespected: boolean;
  /** Dernier jour inclus du contrat */
  lastDay: Ymd;
  /** Instant de fin d'accès (minuit Bruxelles suivant le dernier jour) */
  endsAt: Date;
}

/**
 * Calcule la fin du contrat pour une demande de résiliation / non-reconduction.
 *  • engagement initial + préavis respecté → fin à l'échéance des 12 mois ;
 *  • engagement initial + demande tardive  → fin 30 jours après la demande (jamais de nouvelle année imposée) ;
 *  • après l'engagement initial            → fin 30 jours après la demande.
 */
export function planCancellation(subscribedAt: Date, requestedAt: Date): CancellationPlan {
  const c = commitmentFor(subscribedAt);
  const today = brusselsDay(requestedAt);
  const phase = phaseAt(c, requestedAt);
  let lastDay: Ymd; let noticeRespected: boolean;
  if (phase === "initial" && today <= c.noticeDeadlineDay) {
    lastDay = c.endDay; noticeRespected = true;
  } else {
    lastDay = addDaysYmd(today, NOTICE_DAYS);
    noticeRespected = phase === "indefinite";
  }
  return { phase, noticeRespected, lastDay, endsAt: brusselsMidnight(addDaysYmd(lastDay, 1)) };
}

/** Prix mensuel (centimes) applicable après l'engagement initial, selon le tarif contractuel verrouillé. */
export function priceAfterCommitment(
  plan: BillablePlan,
  terms: { founderPriceCents: number | null; founderEndsAt: Date | null },
  subscribedAt: Date
): number {
  const endsAt = commitmentFor(subscribedAt).endsAt;
  // Le tarif de lancement est verrouillé pour l'engagement initial : il s'arrête avec lui.
  const founderEndsAt = terms.founderEndsAt && terms.founderEndsAt.getTime() < endsAt.getTime() ? terms.founderEndsAt : endsAt;
  return renewalPriceCents(plan, { founderPriceCents: terms.founderPriceCents, founderEndsAt }, endsAt);
}

/** Vrai quand le rappel des 45 jours doit partir (et pas avant l'échéance dépassée). */
export function renewalReminderDue(subscribedAt: Date, now: Date): boolean {
  const c = commitmentFor(subscribedAt);
  const remindFrom = brusselsMidnight(addDaysYmd(c.endDay, -RENEWAL_REMINDER_DAYS));
  return now.getTime() >= remindFrom.getTime() && now.getTime() < c.endsAt.getTime();
}

export function formatDay(day: Ymd, locale = "fr-BE"): string {
  const { y, m, d } = fromYmd(day);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
