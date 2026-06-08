import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsPage from "@/components/settings/SettingsPage";
import type { Organization, User, Subscription } from "@/lib/supabase/types";

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

  return (
    <SettingsPage
      org={org as Organization}
      currentUser={profile as User}
      members={(members ?? []) as User[]}
      subscription={subscription as Subscription | null}
    />
  );
}
