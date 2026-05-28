import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Users,
  TrendingUp,
  UserCheck,
  Plus,
  ArrowRight,
  Phone,
  Clock,
} from "lucide-react";
import {
  SECTOR_LABELS,
  formatRelative,
  STATUS_LABELS,
} from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const orgId = profile.organization_id;

  // Fetch métriques en parallèle
  const [offresResult, candidaturesResult, candidatsResult, placementsResult] =
    await Promise.all([
      // Offres actives
      supabase
        .from("job_offers")
        .select("id", { count: "exact" })
        .eq("organization_id", orgId)
        .eq("status", "active"),

      // Nouvelles candidatures (7 derniers jours)
      supabase
        .from("applications")
        .select("id, job_offer_id", { count: "exact" })
        .gte(
          "applied_at",
          new Date(Date.now() - 7 * 86400000).toISOString()
        )
        .in(
          "job_offer_id",
          (
            await supabase
              .from("job_offers")
              .select("id")
              .eq("organization_id", orgId)
          ).data?.map((j) => j.id) ?? []
        ),

      // Total candidats
      supabase
        .from("candidates")
        .select("id", { count: "exact" })
        .eq("organization_id", orgId),

      // Placements ce mois
      supabase
        .from("applications")
        .select("id", { count: "exact" })
        .eq("status", "place")
        .gte(
          "updated_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        )
        .in(
          "job_offer_id",
          (
            await supabase
              .from("job_offers")
              .select("id")
              .eq("organization_id", orgId)
          ).data?.map((j) => j.id) ?? []
        ),
    ]);

  // Feed d'activité récente
  const { data: recentApps } = await supabase
    .from("applications")
    .select("*, job_offers(title, sector, city)")
    .in(
      "job_offer_id",
      (
        await supabase
          .from("job_offers")
          .select("id")
          .eq("organization_id", orgId)
      ).data?.map((j) => j.id) ?? []
    )
    .order("applied_at", { ascending: false })
    .limit(10);

  const metrics = [
    {
      label: "Offres actives",
      value: offresResult.count ?? 0,
      icon: Briefcase,
      color: "bg-blue-50 text-[#1E40AF]",
      href: "/dashboard/offres",
    },
    {
      label: "Nouvelles candidatures",
      sublabel: "7 derniers jours",
      value: candidaturesResult.count ?? 0,
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
      href: "/dashboard/offres",
    },
    {
      label: "Candidats dans la base",
      value: candidatsResult.count ?? 0,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
      href: "/dashboard/candidats",
    },
    {
      label: "Placements ce mois",
      value: placementsResult.count ?? 0,
      icon: UserCheck,
      color: "bg-green-50 text-green-600",
      href: "/dashboard/offres",
    },
  ];

  const STATUS_COLORS: Record<string, string> = {
    nouveau: "bg-blue-100 text-blue-700",
    contacte: "bg-amber-100 text-amber-700",
    entretien: "bg-purple-100 text-purple-700",
    place: "bg-green-100 text-green-700",
    refuse: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">
            Bonjour,{" "}
            {profile.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Voici ce qui se passe sur votre espace Rekruut
          </p>
        </div>
        <Link
          href="/dashboard/offres/nouvelle"
          className="flex items-center gap-2 bg-[#1E40AF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          <Plus size={16} />
          Nouvelle offre
        </Link>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-sm hover:border-[#1E40AF]/30 transition-all group"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.color} mb-3`}
            >
              <m.icon size={18} />
            </div>
            <div className="text-2xl font-bold text-[#1E293B] mb-0.5">
              {m.value}
            </div>
            <div className="text-xs text-[#64748B]">{m.label}</div>
            {m.sublabel && (
              <div className="text-[10px] text-[#94A3B8]">{m.sublabel}</div>
            )}
          </Link>
        ))}
      </div>

      {/* Feed d'activité */}
      <div className="bg-white rounded-xl border border-[#E2E8F0]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#1E293B] text-sm">
            Dernières candidatures
          </h2>
          <Link
            href="/dashboard/offres"
            className="text-xs text-[#1E40AF] hover:underline flex items-center gap-1"
          >
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>

        {!recentApps || recentApps.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">
              Aucune candidature pour le moment.
            </p>
            <Link
              href="/dashboard/offres/nouvelle"
              className="text-sm text-[#1E40AF] hover:underline mt-1 inline-block"
            >
              Créer une offre d&apos;emploi →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {recentApps.map((app) => {
              const job = app.job_offers as {
                title: string;
                sector: string;
                city: string;
              } | null;
              return (
                <Link
                  key={app.id}
                  href={`/dashboard/offres/${app.job_offer_id}/candidatures`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition group"
                >
                  {/* Avatar initiales */}
                  <div className="w-9 h-9 rounded-full bg-[#1E40AF]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#1E40AF] text-xs font-bold">
                      {app.applicant_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#1E293B]">
                        {app.applicant_name}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[app.status] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[app.status]}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] truncate">
                      {job?.title} ·{" "}
                      {SECTOR_LABELS[job?.sector ?? ""] ?? job?.sector} ·{" "}
                      {job?.city}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {app.applicant_phone && (
                      <a
                        href={`tel:${app.applicant_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1E40AF] transition"
                      >
                        <Phone size={13} />
                        <span className="hidden sm:block">
                          {app.applicant_phone}
                        </span>
                      </a>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                      <Clock size={11} />
                      {formatRelative(app.applied_at)}
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[#E2E8F0] group-hover:text-[#1E40AF] transition"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/offres/nouvelle"
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-sm hover:border-[#1E40AF]/30 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Plus size={18} className="text-[#1E40AF]" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#1E293B]">
              Nouvelle offre
            </div>
            <div className="text-xs text-[#94A3B8]">Publier en 2 minutes</div>
          </div>
        </Link>
        <Link
          href="/dashboard/candidats"
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-sm hover:border-[#1E40AF]/30 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
            <Users size={18} className="text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#1E293B]">
              Base candidats
            </div>
            <div className="text-xs text-[#94A3B8]">Gérer vos profils</div>
          </div>
        </Link>
        <Link
          href="/dashboard/settings"
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-sm hover:border-[#1E40AF]/30 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <UserCheck size={18} className="text-green-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#1E293B]">
              Inviter l&apos;équipe
            </div>
            <div className="text-xs text-[#94A3B8]">Ajouter des recruteurs</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
