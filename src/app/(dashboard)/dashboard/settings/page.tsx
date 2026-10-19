import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsPage from "@/components/settings/SettingsPage";
import type { Organization, User, Subscription } from "@/lib/supabase/types";
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

  const now = new Date(); // horloge du serveur
  const access = evaluateAccess((subscription as SubscriptionRow | null) ?? null, now);
  const sub = subscription as Subscription | null;
  const founderActive =
    !!sub?.founder_price_cents && !!sub.founder_price_ends_at && new Date(sub.founder_price_ends_at).getTime() > now.getTime();
  const billing = {
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
