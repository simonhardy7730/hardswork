import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Clock, XCircle, Eye, ArrowRight,
  MapPin, Briefcase, Star,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";

export const metadata = { title: "Mon tableau de bord — HardSwork" };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  nouveau:   { label: "En attente",   color: "text-blue-600 bg-blue-50 border-blue-200",    icon: Clock       },
  contacte:  { label: "Vu",           color: "text-amber-600 bg-amber-50 border-amber-200",  icon: Eye         },
  entretien: { label: "Entretien",    color: "text-purple-600 bg-purple-50 border-purple-200",icon: CheckCircle },
  place:     { label: "Recruté ✓",    color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle },
  refuse:    { label: "Non retenu",   color: "text-red-500 bg-red-50 border-red-200",         icon: XCircle     },
};

export default async function CandidatDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? "";
  const fullName = (user.user_metadata?.full_name as string) ?? "";

  /* Candidatures du candidat */
  const { data: applications } = await supabase
    .from("applications")
    .select("*, job_offers(id, title, sector, city, contract_type, organizations(name))")
    .eq("applicant_email", email)
    .order("applied_at", { ascending: false });

  const apps = applications ?? [];

  /* Offres suggérées (récentes, tout secteur) */
  const { data: suggestedRaw } = await supabase
    .from("job_offers")
    .select("id, title, sector, city, contract_type, organizations(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);
  const suggested = suggestedRaw ?? [];

  /* Stats */
  const stats = {
    total:     apps.length,
    entretien: apps.filter(a => a.status === "entretien").length,
    place:     apps.filter(a => a.status === "place").length,
    active:    apps.filter(a => !["refuse", "place"].includes(a.status)).length,
  };

  /* Score profil (0-100) */
  const profileScore = Math.min(100, [
    email ? 20 : 0,
    fullName ? 20 : 0,
    apps.length > 0 ? 20 : 0,
    20, // toujours : connecté
    20, // bonus de base
  ].reduce((a, b) => a + b, 0));

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── WELCOME ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.01em" }}
          >
            Bonjour,{" "}
            <span className="text-brand">
              [{(fullName.split(" ")[0] || "Candidat").toUpperCase()}].
            </span>
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            {stats.active > 0
              ? `${stats.active} candidature${stats.active > 1 ? "s" : ""} en cours · Bonne chance !`
              : "Retrouvez vos candidatures et les offres disponibles."}
          </p>
        </div>
        <Link href="/jobs"
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-xs px-4 py-2.5 rounded-xl transition shrink-0"
          style={{ letterSpacing: "0.05em" }}>
          Voir les offres <ArrowRight size={13} />
        </Link>
      </div>

      {/* ── STATS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Candidatures",  value: stats.total,     color: "text-ink" },
          { label: "En cours",      value: stats.active,    color: "text-blue-600" },
          { label: "Entretiens",    value: stats.entretien,  color: "text-purple-600" },
          { label: "Recrutements",  value: stats.place,      color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-ink-100 rounded-2xl p-4 text-center">
            <p className={`font-display font-black text-3xl ${color}`}>{value}</p>
            <p className="text-ink-500 text-xs mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* ── CANDIDATURES ─────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest">
            Mes candidatures
          </h2>

          {apps.length === 0 ? (
            <div className="bg-white border border-ink-100 rounded-2xl p-8 text-center">
              <Briefcase size={36} className="text-ink-100 mx-auto mb-3" />
              <p className="font-display font-black text-ink text-base mb-1">
                Aucune candidature
              </p>
              <p className="text-ink-500 text-sm mb-4">
                Trouvez votre prochain poste parmi nos offres disponibles.
              </p>
              <Link href="/jobs"
                className="inline-flex items-center gap-2 bg-brand text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-brand-dark transition">
                Explorer les offres <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
              {apps.map((app) => {
                const jobRaw = app.job_offers as unknown;
                const job = jobRaw as {
                  id: string; title: string; sector: string;
                  city: string; contract_type: string;
                  organizations: { name: string }[] | { name: string } | null;
                } | null;
                const orgRaw = job?.organizations;
                const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
                const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.nouveau;
                const Icon = status.icon;

                return (
                  <div key={app.id}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-ink-100 last:border-0">
                    {/* Statut */}
                    <div className={`shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${status.color}`}>
                      <Icon size={10} />
                      {status.label}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-black text-ink text-sm uppercase tracking-tight truncate">
                        {job?.title ?? "Poste"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {org?.name && <span className="text-[11px] text-ink-500">{org.name}</span>}
                        {job?.city && (
                          <span className="flex items-center gap-1 text-[11px] text-ink-300">
                            <MapPin size={9} />{job.city}
                          </span>
                        )}
                        <span className="text-[11px] text-ink-300">
                          {formatRelative(app.applied_at)}
                        </span>
                      </div>
                    </div>

                    {/* Lien offre */}
                    {job?.id && (
                      <Link href={`/jobs/${job.id}`}
                        className="shrink-0 text-ink-300 hover:text-brand transition-colors">
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SIDEBAR ──────────────────────────────────── */}
        <div className="space-y-4">

          {/* Score profil */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
                Profil
              </p>
              <span className="font-display font-black text-brand text-lg">{profileScore}%</span>
            </div>
            {/* Barre */}
            <div className="h-2 bg-ink-100 rounded-full mb-3">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${profileScore}%` }}
              />
            </div>
            <div className="space-y-2">
              {[
                { label: "Email vérifié",     done: !!email },
                { label: "Nom renseigné",     done: !!fullName },
                { label: "1ère candidature",  done: apps.length > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-brand" : "bg-ink-100"}`}>
                    {done && <CheckCircle size={10} className="text-white" />}
                  </div>
                  <span className={done ? "text-ink-700 font-medium" : "text-ink-300"}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Offres suggérées */}
          {suggested.length > 0 && (
            <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
                <Star size={12} className="text-brand" />
                <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
                  Offres suggérées
                </p>
              </div>
              <div className="divide-y divide-ink-100">
                {suggested.map((s) => {
                  const sOrgRaw = s.organizations as unknown;
                  const sOrg = Array.isArray(sOrgRaw) ? (sOrgRaw as {name:string}[])[0] : sOrgRaw as {name:string}|null;
                  return (
                    <Link key={s.id} href={`/jobs/${s.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors group">
                      <div className="min-w-0">
                        <p className="font-display font-black text-ink text-xs uppercase tracking-tight truncate group-hover:text-brand transition-colors">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-ink-400">
                          {sOrg?.name ?? "—"} · {s.city}
                        </p>
                      </div>
                      <ArrowRight size={12} className="text-ink-100 group-hover:text-brand transition-colors shrink-0 ml-2" />
                    </Link>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-ink-100">
                <Link href="/jobs"
                  className="text-[11px] font-bold text-brand hover:text-brand-dark transition-colors flex items-center gap-1">
                  Voir toutes les offres <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
