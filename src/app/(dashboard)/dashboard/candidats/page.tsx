import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CandidatsList from "@/components/candidats/CandidatsList";
import type { Candidate } from "@/lib/supabase/types";

interface SearchParams {
  q?: string;
  disponibilite?: string;
  secteurs?: string;       // comma-separated
  caces?: string;
  permis?: string;
  region?: string;
}

export default async function CandidatsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  const orgId = profile.organization_id;

  /* ── Vérifier l'abonnement ──────────────────────────── */
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", orgId)
    .in("status", ["active", "trial"])
    .maybeSingle();

  const hasSubscription = sub !== null && (sub.plan === "pro" || sub.plan === "agency" || sub.status === "trial");

  /* ── Requête candidats ──────────────────────────────── */
  let query = supabase
    .from("candidates")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (searchParams.disponibilite) query = query.eq("availability", searchParams.disponibilite);
  if (searchParams.caces)         query = query.eq("has_caces", true);
  if (searchParams.permis)        query = query.contains("licenses", [searchParams.permis]);
  if (searchParams.region)        query = query.eq("region", searchParams.region);
  if (searchParams.q)             query = query.or(`first_name.ilike.%${searchParams.q}%,last_name.ilike.%${searchParams.q}%,city.ilike.%${searchParams.q}%`);

  // Filtres secteurs (multi)
  if (searchParams.secteurs) {
    const sectList = searchParams.secteurs.split(",").filter(Boolean);
    if (sectList.length > 0) query = query.contains("sectors", sectList);
  }

  const { data: candidats } = await query;

  /* ── Offres actives pour le matching ────────────────── */
  const { data: offresActives } = await supabase
    .from("job_offers")
    .select("id, title, sector, required_licenses, required_languages, status")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .limit(5);

  const { count: total } = await supabase
    .from("candidates")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  return (
    <CandidatsList
      candidats={(candidats ?? []) as Candidate[]}
      total={total ?? 0}
      searchParams={searchParams}
      offresActives={offresActives ?? []}
      hasSubscription={hasSubscription}
    />
  );
}
