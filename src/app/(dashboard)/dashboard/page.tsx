import { HardieIcon } from "@/components/ui/HardieIcon";
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
import { labels, formatRelative } from "@/lib/utils";
import { getLang } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const lang = await getLang();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const { sector: SECTOR_LABELS, status: STATUS_LABELS } = labels(lang);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, full_name, organizations(type)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const orgId = profile.organization_id;
  const isAgency = (profile.organizations as unknown as { type?: string } | null)?.type === "agency";

  // Espace agence : indicateurs clients / missions (0 si la migration 006 n'est pas encore appliquée)
  let agencyClients = 0;
  let agencyMissions = 0;
  if (isAgency) {
    const [c, m] = await Promise.all([
      supabase.from("agency_clients").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "actif"),
      supabase.from("agency_missions").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["ouverte", "en_cours"]),
    ]);
    agencyClients = c.count ?? 0;
    agencyMissions = m.count ?? 0;
  }

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
    ...(isAgency ? [
      { label: l("Clients actifs", "Actieve klanten"), value: agencyClients, icon: Users, color: "bg-brand/10 text-brand", href: "/dashboard/clients" },
      { label: l("Missions en cours", "Lopende opdrachten"), value: agencyMissions, icon: Briefcase, color: "bg-amber-50 text-amber-600", href: "/dashboard/missions" },
    ] : []),
    {
      label: l("Offres actives", "Actieve vacatures"),
      value: offresResult.count ?? 0,
      icon: Briefcase,
      color: "bg-brand/10 text-brand",
      href: "/dashboard/offres",
    },
    {
      label: l("Nouvelles candidatures", "Nieuwe sollicitaties"),
      sublabel: l("7 derniers jours", "Laatste 7 dagen"),
      value: candidaturesResult.count ?? 0,
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
      href: "/dashboard/offres",
    },
    {
      label: l("Candidats dans la base", "Kandidaten in de database"),
      value: candidatsResult.count ?? 0,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
      href: "/dashboard/candidats",
    },
    {
      label: l("Placements ce mois", "Plaatsingen deze maand"),
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
          <h1 className="text-xl font-bold text-[#101F43]">
            {l("Bonjour,", "Hallo,")}{" "}
            {profile.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {l("Voici ce qui se passe sur votre espace Wolko", "Dit gebeurt er in uw Wolko-omgeving")}
          </p>
        </div>
        <Link
          href="/dashboard/offres/nouvelle"
          className="btn-brand"
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
        >
          <Plus size={16} />
          {l("Nouvelle offre", "Nieuwe vacature")}
        </Link>
      </div>

      {/* Métriques */}
      <div className={`grid grid-cols-2 gap-4 ${isAgency ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="bg-white rounded-xl border border-ink-100 p-5 hover:shadow-sm hover:border-brand/30 transition-all group"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.color} mb-3`}
            >
              <m.icon size={18} />
            </div>
            <div className="text-2xl font-bold text-[#101F43] mb-0.5">
              {m.value}
            </div>
            <div className="text-xs text-ink-500">{m.label}</div>
            {m.sublabel && (
              <div className="text-[10px] text-ink-300">{m.sublabel}</div>
            )}
          </Link>
        ))}
      </div>

      {/* Feed d'activité */}
      <div className="bg-white rounded-xl border border-ink-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="font-semibold text-[#101F43] text-sm">
            {l("Dernières candidatures", "Laatste sollicitaties")}
          </h2>
          <Link
            href="/dashboard/offres"
            className="text-xs text-brand hover:underline flex items-center gap-1"
          >
            {l("Voir tout", "Alles bekijken")} <ArrowRight size={12} />
          </Link>
        </div>

        {!recentApps || recentApps.length === 0 ? (
          <div className="py-12 text-center">
            <HardieIcon size={48} className="mx-auto mb-3" />
            <p className="text-sm text-ink-300">
              {l("Aucune candidature pour le moment.", "Nog geen sollicitaties.")}
            </p>
            <Link
              href="/dashboard/offres/nouvelle"
              className="text-sm text-brand hover:underline mt-1 inline-block"
            >
              {l("Créer une offre d'emploi →", "Een vacature aanmaken →")}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
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
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface transition group"
                >
                  {/* Avatar initiales */}
                  <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-brand text-xs font-bold">
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
                      <span className="text-sm font-semibold text-[#101F43]">
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
                    <div className="text-xs text-ink-500 truncate">
                      {job?.title} ·{" "}
                      {SECTOR_LABELS[job?.sector ?? ""] ?? job?.sector} ·{" "}
                      {job?.city}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {app.applicant_phone && (
                      <span className="flex items-center gap-1 text-xs text-ink-500">
                        <Phone size={13} />
                        <span className="hidden sm:block">
                          {app.applicant_phone}
                        </span>
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-ink-300">
                      <Clock size={11} />
                      {formatRelative(app.applied_at, lang)}
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[#EADFC4] group-hover:text-brand transition"
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
          className="bg-white rounded-xl border border-ink-100 p-4 hover:shadow-sm hover:border-brand/30 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Plus size={18} className="text-brand" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#101F43]">
              {l("Nouvelle offre", "Nieuwe vacature")}
            </div>
            <div className="text-xs text-ink-300">{l("Publier en 2 minutes", "Publiceren in 2 minuten")}</div>
          </div>
        </Link>
        <Link
          href="/dashboard/candidats"
          className="bg-white rounded-xl border border-ink-100 p-4 hover:shadow-sm hover:border-brand/30 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
            <Users size={18} className="text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#101F43]">
              {l("Base candidats", "Kandidatendatabase")}
            </div>
            <div className="text-xs text-ink-300">{l("Gérer vos profils", "Beheer uw profielen")}</div>
          </div>
        </Link>
        <Link
          href="/dashboard/settings"
          className="bg-white rounded-xl border border-ink-100 p-4 hover:shadow-sm hover:border-brand/30 transition-all flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <UserCheck size={18} className="text-green-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#101F43]">
              {l("Inviter l'équipe", "Team uitnodigen")}
            </div>
            <div className="text-xs text-ink-300">{l("Ajouter des recruteurs", "Recruiters toevoegen")}</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
