import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, MapPin, Clock, Briefcase, Lock,
  Phone, Mail, CheckCircle, Award, Star,
  Wrench, Zap, Shield, Truck, ArrowRight,
} from "lucide-react";
import { SECTOR_LABELS, REGION_LABELS } from "@/lib/utils";

/* ─── Icônes skills ───────────────────────────────────── */
const SKILL_ICONS: Record<string, React.ElementType> = {
  default: Wrench,
  electricite: Zap,
  securite: Shield,
  transport: Truck,
  soudure: Zap,
};

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: "Disponible immédiatement",
  "1_semaine": "Disponible sous 1 semaine",
  "1_mois": "Disponible sous 1 mois",
};

const AVAILABILITY_COLOR: Record<string, string> = {
  immediate: "text-emerald-600 bg-emerald-50 border-emerald-200",
  "1_semaine": "text-amber-600 bg-amber-50 border-amber-200",
  "1_mois": "text-ink-500 bg-surface-2 border-ink-100",
};

/* ─── Compétences générées depuis le profil ──────────── */
function buildSkills(candidate: {
  caces_types: string[];
  has_caces: boolean;
  licenses: string[];
  sectors: string[];
}): Array<{ label: string; icon: string }> {
  const skills: Array<{ label: string; icon: string }> = [];

  candidate.caces_types?.forEach(c => skills.push({ label: `CACES ${c}`, icon: "securite" }));
  candidate.licenses?.forEach(l => skills.push({ label: `Permis ${l}`, icon: "transport" }));
  candidate.sectors?.forEach(s => {
    const label = SECTOR_LABELS[s];
    if (label) skills.push({ label, icon: s });
  });

  return skills;
}

/* ─── Page ───────────────────────────────────────────── */
export default async function CandidatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  /* Auth */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, organizations(plan, subscriptions(plan, status))")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  const orgId = profile.organization_id;

  /* Candidat */
  const { data: candidat } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", orgId)
    .single();

  if (!candidat) notFound();

  /* Vérifier l'abonnement pour débloquer les coordonnées */
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", orgId)
    .in("status", ["active", "trial"])
    .maybeSingle();

  const hasActiveSubscription = sub !== null && (sub.plan === "pro" || sub.plan === "agency" || sub.status === "trial");

  /* Candidatures liées */
  const { data: applications } = await supabase
    .from("applications")
    .select("*, job_offers(title, sector, city)")
    .eq("applicant_email", candidat.email ?? "")
    .order("applied_at", { ascending: false })
    .limit(5);

  const initials = `${candidat.first_name?.[0] ?? ""}${candidat.last_name?.[0] ?? ""}`.toUpperCase();
  const skills = buildSkills(candidat);

  /* ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">

      {/* ── HEADER PROFIL ──────────────────────────────── */}
      <div className="bg-[#0F0E0D] noise">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Breadcrumb */}
          <Link href="/dashboard/candidats"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm font-medium transition-colors mb-6">
            <ChevronLeft size={14} />
            Retour à la candidathèque
          </Link>

          {/* Nom + avatar */}
          <div className="flex items-start gap-6">
            {/* Photo / Avatar */}
            <div className="shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-display font-black text-2xl text-white border-2 border-white/10"
                style={{ background: "linear-gradient(135deg, #D93B12 0%, #B52D0A 100%)" }}
              >
                {initials}
              </div>
            </div>

            {/* Nom + tags */}
            <div className="flex-1 min-w-0">
              {/* Headline PRÉNOM [NOM] */}
              <h1
                className="font-display font-black text-white uppercase leading-none mb-3"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.01em" }}
              >
                {candidat.first_name}{" "}
                <span className="text-brand">[{candidat.last_name.toUpperCase()}]</span>
              </h1>

              {/* Tags inline */}
              <div className="flex items-center gap-4 flex-wrap">
                {candidat.sectors?.[0] && (
                  <span className="flex items-center gap-1.5 text-white/50 text-sm font-semibold">
                    <Briefcase size={13} />
                    {candidat.sectors.map((s: string) => SECTOR_LABELS[s] ?? s).join(", ")}
                  </span>
                )}
                {candidat.city && (
                  <span className="flex items-center gap-1.5 text-white/50 text-sm font-semibold">
                    <MapPin size={13} />
                    {candidat.city}
                    {candidat.region && ` · ${REGION_LABELS[candidat.region as string] ?? candidat.region}`}
                  </span>
                )}
                {candidat.experience_years != null && (
                  <span className="flex items-center gap-1.5 text-white/50 text-sm font-semibold">
                    <Clock size={13} />
                    {candidat.experience_years === 0 ? "Débutant" : `${candidat.experience_years} an${candidat.experience_years > 1 ? "s" : ""} d'expérience`}
                  </span>
                )}
                {candidat.availability && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${AVAILABILITY_COLOR[candidat.availability] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                    {AVAILABILITY_LABELS[candidat.availability] ?? candidat.availability}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ──────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">

          {/* ── COLONNE PRINCIPALE ─────────────────────── */}
          <div className="space-y-5">

            {/* Compétences techniques */}
            {skills.length > 0 && (
              <section className="bg-white border border-ink-100 rounded-2xl p-6">
                <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest mb-4">
                  Compétences techniques
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => {
                    const Icon = SKILL_ICONS[skill.icon] ?? SKILL_ICONS.default;
                    return (
                      <span key={i}
                        className="inline-flex items-center gap-2 bg-surface border border-ink-100 text-ink-700 text-[12px] font-bold px-3 py-2 rounded-lg">
                        <Icon size={13} className="text-brand shrink-0" />
                        {skill.label}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Expériences — issues des candidatures */}
            {(applications ?? []).length > 0 && (
              <section className="bg-white border border-ink-100 rounded-2xl p-6">
                <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest mb-5">
                  Candidatures
                </h2>
                <div className="space-y-0">
                  {(applications ?? []).map((app, i) => {
                    const job = app.job_offers as { title: string; sector: string; city: string } | null;
                    return (
                      <div key={app.id} className="flex items-start gap-4 pb-4 mb-4 border-b border-ink-100 last:border-0 last:pb-0 last:mb-0">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center shrink-0 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                          {i < (applications?.length ?? 0) - 1 && (
                            <div className="w-px flex-1 bg-ink-100 mt-1.5 min-h-[24px]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="font-bold text-sm text-ink">{job?.title ?? "Poste inconnu"}</p>
                            <span className="text-[10px] font-bold text-white bg-brand px-2 py-0.5 rounded-full uppercase">
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-ink-500">
                            {SECTOR_LABELS[job?.sector ?? ""] ?? job?.sector}
                            {job?.city ? ` · ${job.city}` : ""}
                          </p>
                        </div>
                        <Link href={`/dashboard/offres/${app.job_offer_id}/candidatures`}
                          className="text-ink-300 hover:text-brand transition-colors shrink-0">
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Certifications */}
            {(candidat.caces_types?.length > 0 || candidat.licenses?.length > 0) && (
              <section className="bg-white border border-ink-100 rounded-2xl p-6">
                <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest mb-4">
                  Certifications & Permis
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {candidat.caces_types?.map((c: string) => (
                    <div key={c} className="flex items-center gap-3 bg-surface border border-ink-100 rounded-xl p-3">
                      <Award size={18} className="text-brand shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide">CACES</p>
                        <p className="text-sm font-black text-ink">{c}</p>
                      </div>
                    </div>
                  ))}
                  {candidat.licenses?.map((l: string) => (
                    <div key={l} className="flex items-center gap-3 bg-surface border border-ink-100 rounded-xl p-3">
                      <Truck size={18} className="text-brand shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide">Permis</p>
                        <p className="text-sm font-black text-ink">{l}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Notes */}
            {candidat.notes && !candidat.notes.startsWith("cv:") && (
              <section className="bg-white border border-ink-100 rounded-2xl p-6">
                <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest mb-3">
                  Notes
                </h2>
                <p className="text-sm text-ink-700 leading-relaxed">{candidat.notes}</p>
              </section>
            )}
          </div>

          {/* ── SIDEBAR DROITE ─────────────────────────── */}
          <div className="space-y-4">

            {/* CTA coordonnées — sticky */}
            <div className="bg-[#0F0E0D] rounded-2xl p-5 sticky top-20">

              {hasActiveSubscription ? (
                /* ── COORDONNÉES DÉBLOQUÉES ── */
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                      Coordonnées disponibles
                    </span>
                  </div>

                  <div className="space-y-3">
                    <a href={`tel:${candidat.phone}`}
                      className="flex items-center gap-3 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-xl p-3 transition group">
                      <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
                        <Phone size={14} className="text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wide">Téléphone</p>
                        <p className="text-sm font-bold text-white truncate">{candidat.phone}</p>
                      </div>
                    </a>

                    {candidat.email && (
                      <a href={`mailto:${candidat.email}`}
                        className="flex items-center gap-3 bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-xl p-3 transition group">
                        <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
                          <Mail size={14} className="text-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wide">Email</p>
                          <p className="text-sm font-bold text-white truncate">{candidat.email}</p>
                        </div>
                      </a>
                    )}

                    {/* CV */}
                    {candidat.notes?.startsWith("cv:") && (
                      <a href={candidat.notes.replace("cv:", "")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold text-sm rounded-xl py-3 transition mt-2">
                        Télécharger le CV
                        <ArrowRight size={13} />
                      </a>
                    )}
                  </div>
                </>
              ) : (
                /* ── COORDONNÉES VERROUILLÉES ── */
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Lock size={13} className="text-white/40 shrink-0" />
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-wide">
                      Coordonnées masquées
                    </span>
                  </div>

                  {/* Blurred preview */}
                  <div className="space-y-3 mb-4">
                    {[{ icon: Phone, text: "+32 4•• ••• •••" }, { icon: Mail, text: "•••••@••••.be" }].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          <Icon size={14} className="text-white/30" />
                        </div>
                        <p className="text-sm font-bold text-white/20 blur-[4px] select-none">{text}</p>
                      </div>
                    ))}
                  </div>

                  <Link href="/#tarifs"
                    className="flex items-center justify-center gap-2 font-display font-black uppercase tracking-wide text-white bg-brand hover:bg-brand-dark transition rounded-xl py-3.5 text-sm w-full"
                    style={{ letterSpacing: "0.05em" }}>
                    <Lock size={13} />
                    Débloquer les coordonnées
                  </Link>

                  <p className="text-white/25 text-[10px] text-center mt-3 leading-snug">
                    L&apos;accès complet aux coordonnées est réservé aux recruteurs abonnés.
                  </p>
                </>
              )}
            </div>

            {/* Score / Étoiles */}
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <p className="font-display font-black text-ink uppercase text-xs tracking-widest mb-3">
                Profil
              </p>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const score = Math.min(
                    5,
                    Math.floor(
                      ((skills.length > 0 ? 1 : 0) +
                        (candidat.experience_years ? 1 : 0) +
                        (candidat.city ? 1 : 0) +
                        (candidat.caces_types?.length > 0 ? 1 : 0) +
                        (candidat.notes?.startsWith("cv:") ? 1 : 0)) *
                        1
                    )
                  );
                  return (
                    <Star key={i} size={16}
                      className={i < score ? "text-brand fill-brand" : "text-ink-100 fill-ink-100"} />
                  );
                })}
              </div>
              <p className="text-xs text-ink-500">
                {candidat.notes?.startsWith("cv:") ? "CV disponible" : "Pas de CV uploadé"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
