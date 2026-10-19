import { createClient as createAdmin, type SupabaseClient } from "@supabase/supabase-js";
import { commitmentFor, brusselsDay, renewalReminderDue, priceAfterCommitment, TERMS_VERSION } from "./contract";
import { PRICES, type BillablePlan } from "./pricing";
import { orgRecipients, sendSubscriptionMail, type SubscriptionMail } from "@/lib/email/subscription";

const DAY = 86_400_000;
type Flag = "trial_reminder_sent_at" | "trial_expired_sent_at" | "confirmation_sent_at" | "renewal_reminder_sent_at" | "end_sent_at";

export const adminClient = () => createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function logEvent(db: SupabaseClient, orgId: string, type: string, details: Record<string, unknown> = {}, actor?: string) {
  const { error } = await db.from("subscription_events").insert({ organization_id: orgId, event_type: type, details, actor_user_id: actor ?? null });
  if (error) console.error("subscription_events:", error.message);
}

/** Réserve l'envoi (un seul processus gagne) ; remet le drapeau à zéro si l'e-mail échoue. */
async function claimAndSend(db: SupabaseClient, subId: string, orgId: string, flag: Flag, mail: SubscriptionMail, now: Date): Promise<boolean> {
  const { data: claimed } = await db.from("subscriptions").update({ [flag]: now.toISOString() }).eq("id", subId).is(flag, null).select("id");
  if (!claimed || claimed.length === 0) return false;
  const ok = await sendSubscriptionMail(await orgRecipients(db, orgId), mail);
  if (!ok) { await db.from("subscriptions").update({ [flag]: null }).eq("id", subId); return false; }
  await logEvent(db, orgId, `email_${mail.kind}`);
  return true;
}

const planName = (p: string) => (p === "agency" ? "Agence" : "Pro");

/** Passe quotidienne : essais, confirmations, rappels et fins de contrat. Idempotente. */
export async function runSubscriptionLifecycle(db: SupabaseClient, now: Date = new Date()) {
  const stats = { trial_reminder: 0, trial_expired: 0, subscribed: 0, renewal_reminder: 0, ended: 0, errors: 0 };
  const { data: subs, error } = await db.from("subscriptions").select("*, organizations(name)");
  if (error) throw new Error(error.message);

  for (const s of subs ?? []) {
    try {
      const orgName = ((s.organizations as { name?: string } | null)?.name) ?? "votre organisation";
      const t = now.getTime();
      const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at) : null;

      if (s.status === "trial" && trialEnd && s.trial_started_at && trialEnd.getTime() - new Date(s.trial_started_at).getTime() > 3_600_000) {
        const left = trialEnd.getTime() - t;
        if (left > 0 && left <= 2 * DAY && !s.trial_reminder_sent_at) {
          if (await claimAndSend(db, s.id, s.organization_id, "trial_reminder_sent_at", { kind: "trial_reminder", orgName, endDay: brusselsDay(trialEnd), daysLeft: Math.ceil(left / DAY) }, now)) stats.trial_reminder++;
        } else if (left <= 0 && left > -7 * DAY && !s.trial_expired_sent_at) {
          if (await claimAndSend(db, s.id, s.organization_id, "trial_expired_sent_at", { kind: "trial_expired", orgName }, now)) stats.trial_expired++;
        }
        continue;
      }

      if (!s.subscribed_at || (s.plan !== "pro" && s.plan !== "agency")) continue;
      const subscribedAt = new Date(s.subscribed_at);
      const c = commitmentFor(subscribedAt);
      const plan = s.plan as BillablePlan;
      const terms = { founderPriceCents: s.founder_price_cents ?? null, founderEndsAt: s.founder_price_ends_at ? new Date(s.founder_price_ends_at) : null };
      const priceCents = s.monthly_price_cents ?? PRICES.standard[plan] * 100;
      const priceAfterCents = priceAfterCommitment(plan, terms, subscribedAt);

      const cancelEnd = s.cancel_effective_at ? new Date(s.cancel_effective_at) : null;
      if (cancelEnd && cancelEnd.getTime() <= t) {
        if (!s.end_sent_at && await claimAndSend(db, s.id, s.organization_id, "end_sent_at", { kind: "ended", orgName }, now)) {
          stats.ended++;
          await logEvent(db, s.organization_id, "ended", { effective_at: s.cancel_effective_at });
        }
        continue;
      }

      if (!s.confirmation_sent_at) {
        if (await claimAndSend(db, s.id, s.organization_id, "confirmation_sent_at", {
          kind: "subscribed", orgName, planName: planName(plan), priceCents, startDay: c.startDay, endDay: c.endDay,
          noticeDeadlineDay: c.noticeDeadlineDay, priceAfterCents, founder: !!terms.founderPriceCents, termsVersion: s.terms_version ?? TERMS_VERSION,
        }, now)) stats.subscribed++;
      }

      if (!s.renewal_reminder_sent_at && !s.cancel_requested_at && renewalReminderDue(subscribedAt, now)) {
        if (await claimAndSend(db, s.id, s.organization_id, "renewal_reminder_sent_at", {
          kind: "renewal_reminder", orgName, planName: planName(plan), endDay: c.endDay, noticeDeadlineDay: c.noticeDeadlineDay, priceCents, priceAfterCents,
        }, now)) stats.renewal_reminder++;
      }
    } catch (e) {
      stats.errors++;
      console.error("lifecycle error", s.id, e);
    }
  }
  return stats;
}
