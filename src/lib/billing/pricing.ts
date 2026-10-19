// Offre de lancement WOLKO — logique tarifaire PURE (aucune dépendance au navigateur).
// La date "maintenant" est toujours passée en paramètre : les composants serveur utilisent
// l'horloge du serveur (new Date()), jamais celle du navigateur. Miroir SQL : migration 015.

export type BillablePlan = "pro" | "agency";

/** 1er janvier 2027 à 00:00 heure de Bruxelles (CET, UTC+1) = 31 décembre 2026 à 23:00 UTC. */
export const LAUNCH_END = new Date(Date.UTC(2026, 11, 31, 23, 0, 0));
/** Dernier jour affiché de l'offre de lancement. */
export const LAUNCH_END_LABEL = { fr: "31 décembre 2026", nl: "31 december 2026" } as const;

export const TRIAL_DAYS = 7;
export const FOUNDER_MONTHS = 12;
export const NETWORK_FROM_EUR = 499;

/** Prix mensuels HT en euros. */
export const PRICES = {
  standard: { pro: 119, agency: 349 },
  launch: { pro: 89, agency: 249 },
} as const;

export function isLaunchOfferActive(now: Date): boolean {
  return now.getTime() < LAUNCH_END.getTime();
}

/** Remise affichée (arrondie) : Pro −25 %, Agence −29 %. */
export function discountPercent(plan: BillablePlan): number {
  const { standard, launch } = PRICES;
  return Math.round(((standard[plan] - launch[plan]) / standard[plan]) * 100);
}

export interface PublicPrice {
  /** Prix à payer (€/mois HT) */
  price: number;
  /** Ancien prix de référence barré, seulement pendant l'offre de lancement */
  strikethrough: number | null;
  /** Badge "−25 %", seulement pendant l'offre de lancement */
  discount: number | null;
  launch: boolean;
}

export function publicPrice(plan: BillablePlan, now: Date): PublicPrice {
  if (isLaunchOfferActive(now)) {
    return { price: PRICES.launch[plan], strikethrough: PRICES.standard[plan], discount: discountPercent(plan), launch: true };
  }
  return { price: PRICES.standard[plan], strikethrough: null, discount: null, launch: false };
}

/** Prix (centimes) d'une NOUVELLE souscription à la date donnée. */
export function newSubscriptionPriceCents(plan: BillablePlan, now: Date): number {
  return (isLaunchOfferActive(now) ? PRICES.launch[plan] : PRICES.standard[plan]) * 100;
}

/** Ajoute des mois calendaires en UTC (31 janv. + 1 mois = 28/29 févr.). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export const trialEndsAt = (start: Date) => addDays(start, TRIAL_DAYS);

export interface FounderTerms {
  founderPriceCents: number | null;
  founderEndsAt: Date | null;
}

/** Tarif fondateur d'une souscription : verrouillé 12 mois si elle a lieu avant la bascule. */
export function founderTerms(plan: BillablePlan, subscribedAt: Date): FounderTerms {
  if (!isLaunchOfferActive(subscribedAt)) return { founderPriceCents: null, founderEndsAt: null };
  return { founderPriceCents: PRICES.launch[plan] * 100, founderEndsAt: addMonths(subscribedAt, FOUNDER_MONTHS) };
}

/** Prix (centimes) à facturer à un renouvellement : tarif fondateur tant que ses 12 mois courent. */
export function renewalPriceCents(
  plan: BillablePlan,
  terms: { founderPriceCents: number | null; founderEndsAt: Date | null },
  now: Date
): number {
  if (terms.founderPriceCents != null && terms.founderEndsAt && now.getTime() < terms.founderEndsAt.getTime()) {
    return terms.founderPriceCents;
  }
  return PRICES.standard[plan] * 100;
}

// ── Accès (essai / abonnement) ──────────────────────────────────────────────

export type SubscriptionRow = {
  plan: "starter" | "pro" | "agency";
  status: "trial" | "active" | "cancelled";
  trial_ends_at: string | null;
  current_period_end: string | null;
  /** Fin d'accès demandée (migration 023) : après cet instant, plus d'accès. */
  cancel_effective_at?: string | null;
};

export type AccessState = "trial" | "trial_expired" | "active" | "cancelled_running" | "ended" | "none";

export interface Access {
  hasAccess: boolean;
  state: AccessState;
  /** Jours entiers restants d'essai (arrondi au supérieur), 0 si terminé */
  trialDaysLeft: number;
  trialEndsAt: Date | null;
}

/** Même règle que org_has_access() en SQL. */
export function evaluateAccess(sub: SubscriptionRow | null, now: Date): Access {
  if (!sub) return { hasAccess: false, state: "none", trialDaysLeft: 0, trialEndsAt: null };
  const t = now.getTime();
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const paidPlan = sub.plan === "pro" || sub.plan === "agency";
  const cancelEnd = sub.cancel_effective_at ? new Date(sub.cancel_effective_at) : null;
  if (cancelEnd && cancelEnd.getTime() <= t && sub.status !== "trial") {
    return { hasAccess: false, state: "ended", trialDaysLeft: 0, trialEndsAt: trialEnd };
  }

  if (sub.status === "trial") {
    const running = !!trialEnd && trialEnd.getTime() > t;
    return {
      hasAccess: running,
      state: running ? "trial" : "trial_expired",
      trialDaysLeft: running ? Math.ceil((trialEnd!.getTime() - t) / 86_400_000) : 0,
      trialEndsAt: trialEnd,
    };
  }
  if (sub.status === "active" && paidPlan && (!periodEnd || periodEnd.getTime() > t)) {
    return { hasAccess: true, state: "active", trialDaysLeft: 0, trialEndsAt: trialEnd };
  }
  if (sub.status === "cancelled" && paidPlan && periodEnd && periodEnd.getTime() > t) {
    return { hasAccess: true, state: "cancelled_running", trialDaysLeft: 0, trialEndsAt: trialEnd };
  }
  return { hasAccess: false, state: "ended", trialDaysLeft: 0, trialEndsAt: trialEnd };
}
