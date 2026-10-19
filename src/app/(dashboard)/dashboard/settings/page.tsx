import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsPage, { type BillingView } from "@/components/settings/SettingsPage";
import type { Organization, User, Subscription } from "@/lib/supabase/types";
import { commitmentFor, phaseAt, nextBillingDay, brusselsDay, priceAfterCommitment } from "@/lib/billing/contract";
import { evaluateAccess, publicPrice, isLaunchOfferActive, type SubscriptionRow } from "@/lib/billing/pricing";

export default async function SettingsRoute() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();
  if (!profile) redirect("/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single();

  const { data: members } = await supabase
    .from("users")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: true });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .single();

  // Invitations en attente (table créée par la migration 005 ; vide si pas encore appliquée)
  const { data: invites } = await supabase
    .from("team_invites")
    .select("id, email, role, expires_at")
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Historique du contrat (table créée par la migration 023 ; vide si pas encore appliquée)
  const { data: events } = await supabase
    .from("subscription_events")
    .select("id, event_type, details, created_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(30);

  const now = new Date(); // horloge du serveur
  const access = evaluateAccess((subscription as SubscriptionRow | null) ?? null, now);
  const sub = subscription as Subscription | null;
  const founderActive =
    !!sub?.founder_price_cents && !!sub.founder_price_ends_at && new Date(sub.founder_price_ends_at).getTime() > now.getTime();
  let contract: BillingView["contract"] = null;
  if (sub?.subscribed_at && (sub.plan === "pro" || sub.plan === "agency") && sub.status === "active") {
    const at = new Date(sub.subscribed_at);
    const c = commitmentFor(at);
    const cancelEnd = sub.cancel_effective_at ? new Date(sub.cancel_effective_at) : null;
    contract = {
      startDay: c.startDay,
      endDay: c.endDay,
      noticeDeadlineDay: c.noticeDeadlineDay,
      phase: phaseAt(c, now),
      nextBillingDay: cancelEnd ? null : nextBillingDay(at, now),
      priceAfterCents: priceAfterCommitment(sub.plan, { founderPriceCents: sub.founder_price_cents ?? null, founderEndsAt: sub.founder_price_ends_at ? new Date(sub.founder_price_ends_at) : null }, at),
      termsVersion: sub.terms_version ?? null,
      cancel: sub.cancel_requested_at && cancelEnd
        ? { requestedDay: brusselsDay(new Date(sub.cancel_requested_at)), lastDay: brusselsDay(new Date(cancelEnd.getTime() - 1)), noticeRespected: sub.cancel_notice_respected !== false, effective: cancelEnd.getTime() > now.getTime() }
        : null,
    };
  }
  const billing = {
    contract,
    history: (events ?? []).map((e) => ({ id: e.id as string, type: e.event_type as string, at: e.created_at as string })),
    hasAccess: access.hasAccess,
    state: access.state,
    trialDaysLeft: access.trialDaysLeft,
    trialEndsAtIso: access.trialEndsAt ? access.trialEndsAt.toISOString() : null,
    pro: publicPrice("pro", now),
    agency: publicPrice("agency", now),
    launch: isLaunchOfferActive(now),
    founderPrice: founderActive ? (sub!.founder_price_cents as number) / 100 : null,
    founderEndsAtIso: founderActive ? (sub!.founder_price_ends_at as string) : null,
  };

  return (
    <SettingsPage
      org={org as Organization}
      currentUser={profile as User}
      members={(members ?? []) as User[]}
      subscription={subscription as Subscription | null}
      billing={billing}
      invites={(invites ?? []) as { id: string; email: string; role: string; expires_at: string }[]}
    />
  );
}
