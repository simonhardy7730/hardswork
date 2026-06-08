import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { CONTRACT_LABELS, SECTOR_LABELS } from "@/lib/utils";
import type { Application } from "@/lib/supabase/types";

export default async function CandidaturesPage({
  params,
}: {
  params: { id: string };
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

  /* Vérifier abonnement */
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", profile.organization_id)
    .in("status", ["active", "trial"])
    .maybeSingle();
  const hasSubscription = sub !== null && (sub.plan === "pro" || sub.plan === "agency" || sub.status === "trial");

  const { data: offre } = await supabase
    .from("job_offers")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!offre) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("job_offer_id", params.id)
    .order("applied_at", { ascending: false });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://hardswork.be";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/offres"
            className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center text-ink-500 hover:bg-surface-2 transition mt-0.5 shrink-0"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#0F0E0D]">{offre.title}</h1>
            <p className="text-sm text-ink-500 mt-0.5">
              {SECTOR_LABELS[offre.sector]} ·{" "}
              {CONTRACT_LABELS[offre.contract_type]} · {offre.city} ·{" "}
              <span className="font-medium text-brand">
                {applications?.length ?? 0} candidature
                {(applications?.length ?? 0) > 1 ? "s" : ""}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/postuler/${offre.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-100 rounded-lg text-ink-500 hover:bg-surface-2 transition"
          >
            <ExternalLink size={13} />
            Formulaire public
          </a>
          <Link
            href={`/dashboard/offres/${offre.id}/confirmation`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-ink-100 rounded-lg text-ink-500 hover:bg-surface-2 transition"
          >
            QR Code
          </Link>
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard
        applications={(applications ?? []) as Application[]}
        jobOfferId={params.id}
        candidatureUrl={`${appUrl}/postuler/${offre.id}`}
        hasSubscription={hasSubscription}
      />
    </div>
  );
}
