import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import OffresTable from "@/components/offres/OffresTable";
import OffresFilters from "@/components/offres/OffresFilters";
import type { JobOffer } from "@/lib/supabase/types";

interface SearchParams {
  secteur?: string;
  statut?: string;
  region?: string;
}

export default async function OffresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  let query = supabase
    .from("job_offers")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (searchParams.secteur) query = query.eq("sector", searchParams.secteur);
  if (searchParams.statut) query = query.eq("status", searchParams.statut);
  if (searchParams.region) query = query.eq("region", searchParams.region);

  const { data: offres } = await query;

  // Compteurs par statut
  const { data: allOffres } = await supabase
    .from("job_offers")
    .select("status")
    .eq("organization_id", profile.organization_id);

  const counts = {
    total: allOffres?.length ?? 0,
    active: allOffres?.filter((o) => o.status === "active").length ?? 0,
    draft: allOffres?.filter((o) => o.status === "draft").length ?? 0,
    paused: allOffres?.filter((o) => o.status === "paused").length ?? 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F0E0D]">
            Offres d&apos;emploi
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {counts.total} offre{counts.total > 1 ? "s" : ""} · {counts.active}{" "}
            active{counts.active > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/offres/nouvelle"
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition"
        >
          <Plus size={16} />
          Nouvelle offre
        </Link>
      </div>

      {/* Filtres */}
      <OffresFilters searchParams={searchParams} counts={counts} />

      {/* Table */}
      <OffresTable offres={(offres ?? []) as JobOffer[]} />
    </div>
  );
}
