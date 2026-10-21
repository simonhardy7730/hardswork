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
          noticeDeadlineDay: c.noticeDeadlineDay, priceAfterCents, founder: !!terms.founderPriceCents, termsVersion: s.terms_version ?? TERMS_VERSION, setupFeeCents: s.setup_fee_cents ?? null,
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

// ─── WOLKO Flash : expirations, rappels, propositions (idempotent, aucun renouvellement ni commande automatique) ───
import { sendFlashMail, flashRecipients, type FlashMail } from "@/lib/email/flash";

type CreditFlag = "reminder7_sent_at" | "reminder2_sent_at" | "expired_sent_at";

async function claimCreditMail(db: SupabaseClient, creditId: string, orgId: string, billingEmail: string | undefined, flag: CreditFlag, mail: FlashMail, now: Date) {
  const { data: claimed } = await db.from("flash_credits").update({ [flag]: now.toISOString() }).eq("id", creditId).is(flag, null).select("id");
  if (!claimed || claimed.length === 0) return false;
  const ok = await sendFlashMail(await flashRecipients(db, orgId, billingEmail), mail);
  if (!ok) { await db.from("flash_credits").update({ [flag]: null }).eq("id", creditId); return false; }
  return true;
}

export async function runFlashLifecycle(db: SupabaseClient, now: Date = new Date()) {
  const stats = { expired: 0, lapsed: 0, reminder7: 0, reminder2: 0, pro_proposal: 0, errors: 0 };

  // 1. Expiration (la visibilité publique est déjà coupée par expires_at ; ceci met à jour les statuts et ferme l'offre)
  const { error: expErr } = await db.rpc("flash_expire_due");
  if (expErr) { console.error("flash_expire_due:", expErr.message); return { ...stats, errors: 1 }; }

  const { data: credits } = await db.from("flash_credits")
    .select("id, organization_id, status, job_offer_id, expires_at, reminder7_sent_at, reminder2_sent_at, expired_sent_at, flash_orders(billing)")
    .in("status", ["active", "expired"]);
  const titleIds = (credits ?? []).map((c) => c.job_offer_id as string | null).filter(Boolean) as string[];
  const { data: offers } = titleIds.length ? await db.from("job_offers").select("id, title").in("id", titleIds) : { data: [] as { id: string; title: string }[] };
  const titles = new Map((offers ?? []).map((o) => [o.id as string, o.title as string]));

  for (const c of credits ?? []) {
    try {
      const ord = c.flash_orders as unknown as { billing?: { email?: string } } | { billing?: { email?: string } }[] | null;
      const email = (Array.isArray(ord) ? ord[0] : ord)?.billing?.email;
      const title = titles.get(c.job_offer_id as string) ?? "Votre annonce";
      const exp = c.expires_at ? new Date(c.expires_at) : null;
      if (c.status === "expired") {
        if (!c.expired_sent_at && exp && now.getTime() - exp.getTime() < 14 * DAY &&
            await claimCreditMail(db, c.id, c.organization_id, email, "expired_sent_at", { kind: "expired", jobTitle: title }, now)) stats.expired++;
        continue;
      }
      if (!exp) continue;
      const left = exp.getTime() - now.getTime();
      if (left > 0 && left <= 2 * DAY && !c.reminder2_sent_at) {
        if (await claimCreditMail(db, c.id, c.organization_id, email, "reminder2_sent_at", { kind: "reminder", jobTitle: title, daysLeft: 2, expiresAt: exp.toISOString() }, now)) stats.reminder2++;
      } else if (left > 2 * DAY && left <= 7 * DAY && !c.reminder7_sent_at) {
        if (await claimCreditMail(db, c.id, c.organization_id, email, "reminder7_sent_at", { kind: "reminder", jobTitle: title, daysLeft: 7, expiresAt: exp.toISOString() }, now)) stats.reminder7++;
      }
    } catch (e) { stats.errors++; console.error("flash lifecycle", c.id, e); }
  }

  // 2. Proposition de passage à Pro : 14 jours après la confirmation du paiement, une seule fois, si pas déjà abonné
  const { data: orders } = await db.from("flash_orders").select("id, organization_id, billing, paid_at, organizations(name)")
    .eq("payment_status", "confirmed").is("pro_proposal_sent_at", null).lte("paid_at", new Date(now.getTime() - 14 * DAY).toISOString());
  for (const o of orders ?? []) {
    try {
      const { data: sub } = await db.from("subscriptions").select("status, plan, subscribed_at").eq("organization_id", o.organization_id).maybeSingle();
      const alreadyPro = sub?.status === "active" && sub.subscribed_at && (sub.plan === "pro" || sub.plan === "agency");
      const { data: claimed } = await db.from("flash_orders").update({ pro_proposal_sent_at: now.toISOString() }).eq("id", o.id).is("pro_proposal_sent_at", null).select("id");
      if (!claimed?.length || alreadyPro) continue;
      const org = o.organizations as unknown as { name?: string } | { name?: string }[] | null;
      const name = (Array.isArray(org) ? org[0]?.name : org?.name) ?? "votre entreprise";
      const ok = await sendFlashMail(await flashRecipients(db, o.organization_id, (o.billing as { email?: string })?.email), { kind: "pro_proposal", orgName: name });
      if (ok) stats.pro_proposal++; else await db.from("flash_orders").update({ pro_proposal_sent_at: null }).eq("id", o.id);
    } catch (e) { stats.errors++; console.error("flash pro proposal", o.id, e); }
  }
  return stats;
}
