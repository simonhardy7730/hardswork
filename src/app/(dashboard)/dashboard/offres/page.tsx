import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import OffresTable from "@/components/offres/OffresTable";
import OffresFilters from "@/components/offres/OffresFilters";
import type { JobOffer } from "@/lib/supabase/types";
import { getL } from "@/lib/i18n/server";

interface SearchParams {
  secteur?: string;
  statut?: string;
  region?: string;
}

export default async function OffresPage(
  props: {
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const l = await getL();
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

  // Candidatures refusées par offre (les supprimées viennent du compteur de l'offre)
  const refusedByOffer: Record<string, number> = {};
  const { data: refusedApps } = await supabase
    .from("applications")
    .select("job_offer_id")
    .eq("status", "refuse");
  for (const a of refusedApps ?? []) {
    const id = a.job_offer_id as string;
    refusedByOffer[id] = (refusedByOffer[id] ?? 0) + 1;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#101F43]">
            {l("Offres d'emploi", "Vacatures")}
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {counts.total} {counts.total > 1 ? l("offres", "vacatures") : l("offre", "vacature")} · {counts.active}{" "}
            {counts.active > 1 ? l("actives", "actief") : l("active", "actief")}
          </p>
        </div>
        <Link
          href="/dashboard/offres/nouvelle"
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition"
        >
          <Plus size={16} />
          {l("Nouvelle offre", "Nieuwe vacature")}
        </Link>
      </div>

      {/* Filtres */}
      <OffresFilters searchParams={searchParams} counts={counts} />

      {/* Table */}
      <OffresTable offres={(offres ?? []) as JobOffer[]} refusedByOffer={refusedByOffer} />
    </div>
  );
}
