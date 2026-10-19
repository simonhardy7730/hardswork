import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Réservé aux organisations de type « agence » (vérifié côté base, jamais via l'URL). */
export async function requireAgency() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, organization_id, organizations(type)")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/auth/redirect");

  const org = profile.organizations as unknown as { type?: string } | null;
  if (org?.type !== "agency") redirect("/dashboard");

  return { supabase, orgId: profile.organization_id as string, userId: user.id };
}
