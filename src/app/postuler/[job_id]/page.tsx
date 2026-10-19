import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import CandidatureForm from "@/components/candidature/CandidatureForm";
import QuickApplyForm from "@/components/candidature/QuickApplyForm";
import { labels } from "@/lib/utils";
import { getDict } from "@/lib/i18n/server";
import { LangSwitch } from "@/components/layout/LangSwitch";
import type { JobOffer, JobPlanning, Organization } from "@/lib/supabase/types";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { WolfBadge } from "@/components/ui/WolfMascot";
import { MapPin, Briefcase, Zap, CheckCircle, ArrowLeft } from "lucide-react";

export async function generateMetadata() {
  const { lang } = await getDict();
  return lang === "nl"
    ? { title: "Solliciteren — Wolko", description: "Solliciteer in minder dan 2 minuten. Wolko brengt kandidaten en werkgevers samen." }
    : { title: "Postuler — Wolko", description: "Postulez en moins de 2 minutes. Wolko met en relation les candidats avec les employeurs." };
}


export default async function PostulerPage(
  props: {
    params: Promise<{ job_id: string }>;
  }
) {
  const params = await props.params;
  const { lang } = await getDict();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const LB = labels(lang);
  const CONTRACT_LABELS = LB.contract, SECTOR_LABELS = LB.sector;
  const supabase = await createClient();

  const { data: offre } = await supabase
    .from("job_offers")
    .select("*, organizations(name, logo_url, primary_color)")
    .eq("id", params.job_id)
    .eq("status", "active")
    .single();

  if (!offre) notFound();

  const job = offre as JobOffer & { organizations: Organization };
  const orgRaw = job.organizations as unknown;
  const org = Array.isArray(orgRaw) ? (orgRaw as Organization[])[0] : orgRaw as Organization | null;

  // Candidature rapide (étudiant / flexi-job) : préremplie si le candidat est connecté.
  const isQuick = job.contract_type === "etudiant" || job.contract_type === "flexi";
  let prefill: { first_name: string; last_name: string; phone: string; email: string; slots: string[] } | null = null;
  if (isQuick) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: cand } = await supabase
        .from("candidates")
        .select("id, first_name, last_name, phone, email")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (cand) {
        const { data: av } = await supabase
          .from("candidate_availabilities")
          .select("day_key, slot")
          .eq("candidate_id", cand.id)
          .eq("kind", "recurring");
        prefill = {
          first_name: (cand.first_name as string) ?? "",
          last_name: (cand.last_name as string) ?? "",
          phone: (cand.phone as string) ?? "",
          email: (cand.email as string) ?? user.email ?? "",
          slots: (av ?? []).map((r) => `${r.day_key}:${r.slot}`),
        };
      }
    }
  }

  const sectorLabel = SECTOR_LABELS[job.sector] ?? job.sector;
  const contractLabel = CONTRACT_LABELS[job.contract_type] ?? job.contract_type;

  return (
    <div className="min-h-screen font-body flex">

      {/* ── LEFT PANEL (photo + info) ─────────────────────── */}
      <div className="brand-on-dark hidden lg:flex lg:w-[42%] relative flex-col">
        {/* Fond de marque + mascotte (plus de photo de secteur hors-sujet) */}
        <div className="absolute inset-0 bg-[#101F43]" />
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-brand/10 blur-3xl" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#101F43] via-[#101F43] to-[#16275A]" />
        <div className="absolute right-8 top-1/2 -translate-y-[62%] w-36 xl:w-44 z-10">
          <WolfBadge sign="POSTULE !" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link href="/" className="mb-auto">
            <HardSworkLogo size="md" dark />
          </Link>

          {/* Main headline */}
          <div className="my-auto">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">
                {sectorLabel}
              </span>
            </div>
            <h1
              className="font-display font-black text-white uppercase leading-none mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
            >
              {l("VOTRE", "JOUW")}<br />
              {l("PROCHAINE", "VOLGENDE")}<br />
              <span className="text-brand">{l("[MISSION].", "[OPDRACHT].")}</span>
            </h1>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              {l("Postulez en moins de 2 minutes.", "Solliciteer in minder dan 2 minuten.")}
              {l(" Sans compte, sans prise de tête.", " Zonder account, zonder gedoe.")}
            </p>
          </div>

          {/* Job summary card */}
          <div className="bg-white/[0.08] border border-white/[0.12] rounded-2xl p-5 backdrop-blur-sm">
            {/* Org */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.1]">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shrink-0">
                <span className="font-display font-black text-white text-sm">
                  {(org?.name?.[0] ?? "H").toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{org?.name ?? "Wolko"}</p>
              </div>
            </div>

            <h2 className="font-display font-black text-white uppercase text-base leading-tight mb-3"
              style={{ letterSpacing: "-0.01em" }}>
              {job.title}
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: MapPin,     label: job.city ?? l("Lieu non précisé", "Plaats niet opgegeven") },
                { icon: Briefcase,  label: contractLabel },
                ...(job.is_urgent ? [{ icon: Zap, label: l("Urgent", "Dringend") }] : []),
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <Icon size={11} className="shrink-0 text-brand" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Guarantee badges */}
            <div className="mt-4 pt-4 border-t border-white/[0.1] flex flex-wrap gap-2">
              {[l("✓ Gratuit", "✓ Gratis"), l("✓ Sans inscription", "✓ Zonder registratie"), l("✓ Confidentiel", "✓ Vertrouwelijk")].map((b) => (
                <span key={b} className="text-[10px] font-black text-white/40 uppercase tracking-wide">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ────────────────────────────── */}
      <div className="flex-1 bg-[#FFFBF2] flex flex-col">
        {/* Mobile nav */}
        <header className="lg:hidden px-5 h-14 flex items-center justify-between border-b border-ink-100 bg-white">
          <Link href="/"><HardSworkLogo size="sm" /></Link>
          <LangSwitch tone="light" />
          <Link href={`/jobs/${job.id}`}
            className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand transition-colors font-medium">
            <ArrowLeft size={13} />
            {l("Retour à l'offre", "Terug naar de vacature")}
          </Link>
        </header>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-md mx-auto px-5 pt-10 pb-16">

            {/* Back link (desktop) */}
            <Link href={`/jobs/${job.id}`}
              className="hidden lg:flex items-center gap-1.5 text-xs text-ink-400 hover:text-brand transition-colors font-medium mb-8">
              <ArrowLeft size={13} />
              {l("Retour à l'offre", "Terug naar de vacature")}
            </Link>

            {/* Mobile job summary */}
            <div className="lg:hidden bg-white border border-ink-100 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
                  <span className="font-display font-black text-white text-xs">
                    {(org?.name?.[0] ?? "H").toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-ink text-xs">{org?.name ?? "Wolko"}</p>
                </div>
              </div>
              <h2 className="font-display font-black text-ink uppercase text-sm leading-tight mb-2"
                style={{ letterSpacing: "-0.01em" }}>
                {job.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-medium text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full">{sectorLabel}</span>
                <span className="text-[10px] font-medium text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full">{job.city}</span>
                <span className="text-[10px] font-medium text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full">{contractLabel}</span>
                {job.is_urgent && (
                  <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded-full">⚡ {l("URGENT", "DRINGEND")}</span>
                )}
              </div>
            </div>

            {/* Form header */}
            <div className="mb-7">
              <h2
                className="font-display font-black text-ink uppercase leading-none mb-2"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}
              >
                {l("Déposez votre", "Dien je")}{" "}
                <span className="text-brand">{l("[candidature].", "[sollicitatie] in.")}</span>
              </h2>
              <p className="text-ink-500 text-sm">
                {l("2 minutes · Sans compte · CV facultatif", "2 minuten · Zonder account · CV optioneel")}
              </p>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { icon: CheckCircle, label: l("100% gratuit", "100% gratis") },
                { icon: CheckCircle, label: l("Données protégées", "Beschermde gegevens") },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px] text-ink-500 font-medium">
                  <Icon size={11} className="text-brand" />
                  {label}
                </div>
              ))}
            </div>

            {/* The form itself */}
            <div className="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
              {isQuick ? (
                <QuickApplyForm
                  jobId={job.id}
                  orgName={org?.name ?? "Wolko"}
                  flexi={job.contract_type === "flexi"}
                  offerDays={(job as JobOffer & JobPlanning).days_needed ?? []}
                  offerSlots={(job as JobOffer & JobPlanning).time_slots ?? []}
                  prefill={prefill}
                />
              ) : (
                <CandidatureForm jobId={job.id} orgName={org?.name ?? "Wolko"} />
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-[11px] text-ink-300 mt-6">
              {l("Propulsé par", "Mogelijk gemaakt door")}{" "}
              <Link href="/" className="font-bold text-brand hover:text-brand-dark transition-colors">
                Wolko
              </Link>
              {" "}· {l("Plateforme de recrutement", "Wervingsplatform")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
