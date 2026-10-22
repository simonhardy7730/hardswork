import { createClient } from "@/lib/supabase/server";
import { maskOrgs, publicOrgName } from "@/lib/confidential";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Clock, XCircle, Eye, ArrowRight,
  MapPin, Briefcase, Star, FileText, Bell, CalendarCheck,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { getDict } from "@/lib/i18n/server";
import CvRequests, { type CvRequestRow } from "@/components/candidat/CvRequests";
import CvNudge from "@/components/candidat/CvNudge";
import AlertPromo from "@/components/ressources/AlertPromo";
import { adminClient } from "@/lib/billing/lifecycle";
import { asCv } from "@/lib/candidate/cv";
import { cvFilled } from "@/lib/candidate/pool-cv";
import { profileCompletion, COMPLETION_LABEL } from "@/lib/candidate/completion";
import { suggestOffers, canPersonalize, REASON_LABEL } from "@/lib/candidate/suggestions";
import { contractLabel } from "@/lib/contract-label";

export async function generateMetadata() {
  return { title: (await getDict()).lang === "nl" ? "Mijn dashboard — Wolko" : "Mon tableau de bord — Wolko" };
}

const STATUS_CONFIG: Record<string, { label: string; nl: string; color: string; icon: React.ElementType }> = {
  nouveau:   { label: "En attente", nl: "In behandeling",  color: "text-blue-600 bg-blue-50 border-blue-200",    icon: Clock       },
  contacte:  { label: "Vu", nl: "Bekeken",          color: "text-amber-600 bg-amber-50 border-amber-200",  icon: Eye         },
  entretien: { label: "Entretien", nl: "Gesprek",    color: "text-purple-600 bg-purple-50 border-purple-200",icon: CheckCircle },
  place:     { label: "Recruté ✓", nl: "Aangeworven ✓",    color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle },
  refuse:    { label: "Non retenu", nl: "Niet weerhouden",   color: "text-red-500 bg-red-50 border-red-200",         icon: XCircle     },
};

const listJoin = (a: string[], and: string) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} ${and} ${a[a.length - 1]}`);

export default async function CandidatDashboardPage() {
  const { lang } = await getDict();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = user.email ?? "";
  const fullName = (user.user_metadata?.full_name as string) ?? "";

  /* Candidatures du candidat */
  const { data: applications } = await supabase
    .from("applications")
    .select("*, job_offers(id, title, sector, city, contract_type, hide_company, organizations(name))")
    .eq("applicant_email", email)
    .order("applied_at", { ascending: false });

  const apps = applications ?? [];

  /* Demandes de CV reçues (vide si la migration 019 n'est pas encore lancée) */
  const { data: cvReqRaw } = await supabase
    .from("cv_requests")
    .select("id, org_name, job_title, status, cv_name")
    .order("created_at", { ascending: false });
  const cvRequests = (cvReqRaw ?? []) as CvRequestRow[];

  /* A-t-il un CV ? (document « CV », CV joint à une candidature, ou CV créé sur Wolko) */
  const [{ count: docCount }, { data: candRow }] = await Promise.all([
    supabase.from("candidate_documents").select("id", { count: "exact", head: true }).ilike("label", "cv%"),
    supabase.from("candidates").select("cv_data").eq("auth_user_id", user.id).maybeSingle(),
  ]);
  const { data: base } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, phone, city, sectors, licenses, has_caces, experience_years, job_types, is_student")
    .eq("auth_user_id", user.id).maybeSingle();
  const { data: tr } = await supabase.from("candidates").select("trades, trade_other").eq("auth_user_id", user.id).maybeSingle();
  const { count: slotCount } = base?.id
    ? await supabase.from("candidate_availabilities").select("id", { count: "exact", head: true }).eq("candidate_id", base.id).eq("kind", "recurring")
    : { count: 0 };
  const hasCv = (docCount ?? 0) > 0 || cvRequests.some((r) => r.status === "fulfilled")
    || cvFilled(asCv((candRow as { cv_data?: unknown } | null)?.cv_data));

  const { data: alertRow } = await adminClient().from("job_alerts").select("active").eq("user_id", user.id).maybeSingle();
  const alertActive = !!alertRow?.active;

  /* Profil → complétion réelle + offres suggérées (règles explicables, voir lib/candidate/suggestions) */
  const profile = {
    city: (base?.city as string | null) ?? null,
    sectors: (base?.sectors as string[] | null) ?? [],
    trades: (tr?.trades as string[] | null) ?? [],
    jobTypes: (base?.job_types as string[] | null) ?? [],
  };
  const completion = profileCompletion({
    fullName: fullName || `${base?.first_name ?? ""} ${base?.last_name ?? ""}`,
    phone: (base?.phone as string | null) ?? null,
    city: profile.city,
    sectors: profile.sectors,
    trades: profile.trades,
    tradeOther: (tr?.trade_other as string | null) ?? null,
    jobTypes: profile.jobTypes,
    experienceYears: (base?.experience_years as number | null) ?? null,
    isStudent: !!base?.is_student,
    licenses: (base?.licenses as string[] | null) ?? [],
    hasCaces: !!base?.has_caces,
    recurringSlots: slotCount ?? 0,
    hasCv,
  });
  const profileScore = completion.percent;

  const { data: recentRaw } = await supabase
    .from("job_offers")
    .select("id, title, sector, city, contract_type, hide_company, organizations(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(60);
  const recent = maskOrgs(recentRaw, lang);
  const personalized = canPersonalize(profile);
  const matches = personalized ? suggestOffers(profile, recent, 4) : [];
  // Profil sans infos exploitables : simples offres récentes (présentées comme telles, sans prétendre à une correspondance).
  const suggested = personalized ? matches.map((m) => ({ ...m.offer, reasons: m.reasons })) : recent.slice(0, 4).map((o) => ({ ...o, reasons: [] as never[] }));
  const contractLabels: Record<string, string> = {
    interim: l("Intérim", "Interim"), cdi: "CDI", cdd: "CDD",
    apprentissage: l("Apprentissage", "Leerovereenkomst"), interim_cdi: l("Intérim → CDI", "Interim → CDI"),
  };

  /* Stats */
  const stats = {
    total:     apps.length,
    entretien: apps.filter(a => a.status === "entretien").length,
    place:     apps.filter(a => a.status === "place").length,
    active:    apps.filter(a => !["refuse", "place"].includes(a.status)).length,
  };

  return (
    <div className="space-y-6 max-w-4xl">

      <CvRequests userId={user.id} requests={cvRequests} />
      {!hasCv && <CvNudge userId={user.id} />}
      {!alertActive && <AlertPromo />}
      {hasCv && (
        <div className="bg-white border border-ink-100 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <FileText size={18} className="text-brand shrink-0" />
          <p className="flex-1 min-w-[10rem] text-sm font-body font-semibold text-ink">{l("Ton CV est enregistré.", "Je cv is opgeslagen.")}</p>
          <Link href="/candidat/cv" className="h-11 px-4 inline-flex items-center rounded-xl border border-ink-100 text-sm font-body font-bold text-ink hover:border-brand">
            {l("Consulter / mettre à jour", "Bekijken / bijwerken")}
          </Link>
          <Link href="/candidat/compte" className="h-11 px-4 inline-flex items-center rounded-xl text-sm font-body font-bold text-brand">
            {l("Remplacer le fichier", "Bestand vervangen")}
          </Link>
        </div>
      )}

      {/* ── WELCOME ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.01em" }}
          >
            {l("Bonjour,", "Hallo,")}{" "}
            <span className="text-brand">
              [{(fullName.split(" ")[0] || l("Candidat", "Kandidaat")).toUpperCase()}].
            </span>
          </h1>
          <p className="text-ink-500 text-sm font-body mt-1">
            {stats.active > 0
              ? (lang === "nl" ? `${stats.active} ${stats.active > 1 ? "sollicitaties" : "sollicitatie"} lopend · Veel succes!` : `${stats.active} candidature${stats.active > 1 ? "s" : ""} en cours · Bonne chance !`)
              : l("Retrouve tes candidatures et découvre les offres qui te correspondent.", "Vind je sollicitaties terug en ontdek de vacatures die bij jou passen.")}
          </p>
        </div>
        <Link href="/jobs"
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-xs px-4 py-3 min-h-11 rounded-xl transition shrink-0"
          style={{ letterSpacing: "0.05em" }}>
          {l("Voir les offres", "Bekijk de vacatures")} <ArrowRight size={13} />
        </Link>
      </div>

      {/* ── STATS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: l("Candidatures", "Sollicitaties"),  value: stats.total,     color: "text-ink" },
          { label: l("En cours", "Lopend"),      value: stats.active,    color: "text-blue-600" },
          { label: l("Entretiens", "Gesprekken"),    value: stats.entretien,  color: "text-purple-600" },
          { label: l("Recrutements", "Aanwervingen"),  value: stats.place,      color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-ink-100 rounded-2xl p-4 text-center">
            <p className={`font-display font-black text-3xl ${color}`}>{value}</p>
            <p className="text-ink-500 text-xs font-body mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">

        {/* ── CANDIDATURES ─────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest">
            {l("Mes candidatures", "Mijn sollicitaties")}
          </h2>

          {apps.length === 0 ? (
            <div className="bg-white border border-ink-100 rounded-2xl p-6 sm:p-8 text-center">
              <Briefcase size={32} className="text-brand mx-auto mb-3" />
              <p className="font-display font-black text-ink text-base mb-1">
                {l("Ton prochain emploi t'attend peut-être déjà !", "Je volgende job wacht misschien al op je!")}
              </p>
              <p className="text-ink-500 text-sm font-body mb-4">
                {l("Explore les offres disponibles et envoie ta première candidature en quelques instants.", "Verken de beschikbare vacatures en stuur je eerste sollicitatie in enkele ogenblikken.")}
              </p>
              <Link href="/jobs"
                className="inline-flex items-center justify-center gap-2 bg-brand text-white font-body font-bold text-sm px-5 min-h-12 rounded-xl hover:bg-brand-dark transition">
                {l("Découvrir les offres", "Vacatures ontdekken")} <ArrowRight size={13} />
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
                const org = (job as { hide_company?: boolean } | null)?.hide_company ? { name: publicOrgName(true, null, lang) } : Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
                const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.nouveau;
                const Icon = status.icon;

                return (
                  <div key={app.id}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-ink-100 last:border-0">
                    {/* Statut */}
                    <div className={`shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${status.color}`}>
                      <Icon size={10} />
                      {lang === "nl" ? status.nl : status.label}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-black text-ink text-sm uppercase tracking-tight truncate">
                        {job?.title ?? l("Poste", "Functie")}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {org?.name && <span className="text-[11px] text-ink-500">{org.name}</span>}
                        {job?.city && (
                          <span className="flex items-center gap-1 text-[11px] text-ink-300">
                            <MapPin size={9} />{job.city}
                          </span>
                        )}
                        <span className="text-[11px] text-ink-300">
                          {formatRelative(app.applied_at, lang)}
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

          {/* Complétion du profil (calculée sur les données réelles) */}
          <div className="bg-white border border-ink-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
                {l("Profil", "Profiel")}
              </p>
              <span className="font-display font-black text-brand text-lg">{profileScore}%</span>
            </div>
            <div className="h-2 bg-ink-100 rounded-full mb-3" role="progressbar" aria-valuenow={profileScore} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${profileScore}%` }} />
            </div>
            {completion.missing.length === 0 ? (
              <p className="text-sm font-body text-ink-700">{l("Ton profil est complet : les recruteurs ont tout ce qu'il faut pour te trouver.", "Je profiel is compleet: recruiters hebben alles om je te vinden.")}</p>
            ) : (
              <>
                <p className="text-sm font-body text-ink-700 mb-3">
                  {l(`Ton profil est complété à ${profileScore} %. Ajoute ${listJoin(completion.missing.slice(0, 2).map((m) => COMPLETION_LABEL[m.key].add.fr), "et")} pour aider les recruteurs à mieux te trouver.`,
                    `Je profiel is voor ${profileScore} % ingevuld. Voeg ${listJoin(completion.missing.slice(0, 2).map((m) => COMPLETION_LABEL[m.key].add.nl), "en")} toe zodat recruiters je beter vinden.`)}
                </p>
                <div className="space-y-1">
                  {completion.missing.map((m) => (
                    <Link key={m.key} href={m.href} className="flex items-center justify-between gap-2 min-h-11 text-sm font-body font-semibold text-brand hover:text-brand-dark">
                      <span>+ {lang === "nl" ? COMPLETION_LABEL[m.key].nl : COMPLETION_LABEL[m.key].fr}</span>
                      <ArrowRight size={13} className="shrink-0" />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Offres suggérées */}
          <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
              <Star size={12} className="text-brand" />
              <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
                {personalized ? l("Offres pour toi", "Vacatures voor jou") : l("Offres récentes", "Recente vacatures")}
              </p>
            </div>
            {suggested.length === 0 ? (
              <div className="px-4 py-5 text-sm font-body text-ink-700">
                <p className="mb-3">{l("Aucune offre ne correspond encore à ton profil. Découvre toutes les offres disponibles.", "Er is nog geen vacature die bij je profiel past. Ontdek alle beschikbare vacatures.")}</p>
                <Link href="/jobs" className="inline-flex items-center justify-center gap-2 bg-brand text-white font-bold px-4 min-h-11 rounded-xl hover:bg-brand-dark">
                  {l("Explorer toutes les offres", "Alle vacatures verkennen")} <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {suggested.map((s) => {
                  const sOrgRaw = s.organizations as unknown;
                  const sOrg = Array.isArray(sOrgRaw) ? (sOrgRaw as { name: string }[])[0] : sOrgRaw as { name: string } | null;
                  return (
                    <Link key={s.id} href={`/jobs/${s.id}`} className="block px-4 py-3 hover:bg-surface transition-colors group">
                      <p className="font-display font-black text-ink text-xs uppercase tracking-tight group-hover:text-brand transition-colors">{s.title}</p>
                      <p className="text-xs font-body text-ink-500 mt-0.5">
                        {[sOrg?.name, s.city, contractLabel(contractLabels, s)].filter(Boolean).join(" · ")}
                      </p>
                      {s.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {s.reasons.map((r) => (
                            <span key={r} className="text-[10px] font-body font-bold bg-brand/10 text-ink-700 rounded-full px-2 py-0.5">
                              {lang === "nl" ? REASON_LABEL[r].nl : REASON_LABEL[r].fr}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-body font-bold text-brand">
                        {l("Voir l'offre", "Bekijk de vacature")} <ArrowRight size={11} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
            {suggested.length > 0 && (
              <div className="px-4 border-t border-ink-100">
                <Link href="/jobs" className="min-h-11 text-xs font-body font-bold text-brand hover:text-brand-dark transition-colors flex items-center gap-1">
                  {l("Voir toutes les offres", "Bekijk alle vacatures")} <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </div>

          {/* Entretiens / recrutements : états vides explicites */}
          {stats.entretien === 0 && stats.place === 0 && (
            <div className="bg-white border border-ink-100 rounded-2xl p-4 flex gap-3">
              <CalendarCheck size={18} className="text-brand shrink-0 mt-0.5" />
              <p className="text-sm font-body text-ink-700">{l("Pas encore d'entretien. Dès qu'une entreprise te propose un rendez-vous, il apparaît ici.", "Nog geen gesprek. Zodra een bedrijf een afspraak voorstelt, verschijnt die hier.")}</p>
            </div>
          )}
          <Link href="/candidat/alertes" className="bg-white border border-ink-100 rounded-2xl p-4 flex gap-3 hover:border-brand">
            <Bell size={18} className="text-brand shrink-0 mt-0.5" />
            <p className="text-sm font-body text-ink-700">{l("Active une alerte : on te prévient quand une offre correspond à ta recherche.", "Activeer een alert: we verwittigen je zodra een vacature bij je zoekopdracht past.")}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
