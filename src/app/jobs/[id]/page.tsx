import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Euro, Briefcase, Clock, Users,
  ArrowRight, CheckCircle, ChevronRight, Star,
} from "lucide-react";
import { labels } from "@/lib/utils";
import { getDict } from "@/lib/i18n/server";
import { SiteNav } from "@/components/layout/SiteNav";
import ShareButtons from "@/components/jobs/ShareButtons";

/* ─── Photos Unsplash par secteur ────────────────────── */
const SECTOR_PHOTOS: Record<string, string> = {
  industrie:    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1400&auto=format&fit=crop&q=80",
  construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&auto=format&fit=crop&q=80",
  transport:    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1400&auto=format&fit=crop&q=80",
  logistique:   "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1400&auto=format&fit=crop&q=80",
  medical:      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1400&auto=format&fit=crop&q=80",
  securite:     "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1400&auto=format&fit=crop&q=80",
  nettoyage:    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=1400&auto=format&fit=crop&q=80",
  default:      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&auto=format&fit=crop&q=80",
};

/* ─── Metadata ───────────────────────────────────────── */
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_offers")
    .select("title, city, sector, organizations(name)")
    .eq("id", params.id).single();
  const { lang } = getDict();
  const SECTOR_LABELS = labels(lang).sector;
  if (!data) return { title: lang === "nl" ? "Vacature niet gevonden — Wolko" : "Offre introuvable — Wolko" };
  const orgRaw = data.organizations as unknown as { name: string }[] | { name: string } | null;
  const org = Array.isArray(orgRaw) ? (orgRaw[0] ?? null) : orgRaw;
  return {
    title: `${data.title} — ${org?.name ?? ""} | Wolko`,
    description: lang === "nl"
      ? `Vacature ${SECTOR_LABELS[data.sector] ?? data.sector} in ${data.city}. Solliciteer nu op Wolko.`
      : `Offre ${SECTOR_LABELS[data.sector] ?? data.sector} à ${data.city}. Postulez maintenant sur Wolko.`,
  };
}

/* ─── Page ───────────────────────────────────────────── */
export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const { lang } = getDict();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const LB = labels(lang);
  const CONTRACT_LABELS = LB.contract, SECTOR_LABELS = LB.sector, REGION_LABELS = LB.region;
  const numLocale = lang === "nl" ? "nl-BE" : "fr-BE";
  const supabase = await createClient();

  const { data: offer } = await supabase
    .from("job_offers")
    .select(`*, organizations(name, city, logo_url, primary_color, description)`)
    .eq("id", params.id).eq("status", "active").single();

  if (!offer) notFound();

  const org = offer.organizations as {
    name: string; city: string | null;
    logo_url: string | null; primary_color: string | null;
    description: string | null;
  } | null;

  const salary = offer.show_salary && offer.salary_min
    ? offer.salary_period === "heure"
      ? `${offer.salary_min}–${offer.salary_max}€/h`
      : `${offer.salary_min?.toLocaleString(numLocale)}–${offer.salary_max?.toLocaleString(numLocale)}€/${l("mois", "maand")}`
    : null;

  const heroPhoto = SECTOR_PHOTOS[offer.sector] ?? SECTOR_PHOTOS.default;
  const sectorLabel = SECTOR_LABELS[offer.sector] ?? offer.sector;

  /* Offres similaires */
  const { data: similar } = await supabase
    .from("job_offers")
    .select("id, title, city, contract_type, organizations(name)")
    .eq("status", "active").eq("sector", offer.sector).neq("id", params.id).limit(3);

  /* Compter les candidatures */
  const { count: nbCandidatures } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("job_offer_id", params.id);

  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body pb-24">
      <SiteNav />

      {/* ══ HERO — image plein écran + titre overlaid ═════ */}
      <div className="brand-on-dark relative pt-[60px]">
        <div className="relative h-[48vh] min-h-[340px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroPhoto}
            alt={sectorLabel}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dégradé sombre vers le bas */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#101F43]/20 via-[#101F43]/55 to-[#101F43]" />

          {/* Contenu hero */}
          <div className="relative h-full max-w-6xl mx-auto px-6 flex flex-col justify-end pb-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-white/40 text-[11px] mb-4 flex-wrap">
              {[
                { label: l("Accueil", "Home"), href: "/" },
                { label: l("Annonces", "Advertenties"), href: "/jobs" },
                { label: l("Offres", "Vacatures"), href: "/jobs" },
              ].map((c, i, arr) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={9} className="text-white/20" />}
                  {i < arr.length - 1
                    ? <Link href={c.href} className="hover:text-white/70 transition">{c.label}</Link>
                    : <span className="text-white/55">{c.label}</span>
                  }
                </span>
              ))}
            </nav>

            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                {offer.is_urgent && (
                  <span className="inline-block text-[10px] font-black text-brand bg-brand/15 border border-brand/30 px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                    🔴 {l("Offre urgente", "Dringende vacature")}
                  </span>
                )}
                <h1
                  className="font-display font-black text-white uppercase leading-[0.88]"
                  style={{ fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "-0.02em" }}
                >
                  {offer.title}
                </h1>
                {org?.name && (
                  <p className="text-white/55 font-semibold mt-2 text-[15px] uppercase tracking-wide font-display">
                    {org.name}
                  </p>
                )}
              </div>

              {/* POSTULER — desktop */}
              <Link
                href={`/postuler/${offer.id}`}
                className="hidden md:inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase px-7 py-3.5 rounded-xl transition text-[13px] shrink-0"
                style={{ letterSpacing: "0.06em" }}
              >
                {l("Postuler maintenant", "Nu solliciteren")}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── STATS STRIP (fond sombre) ────────────────── */}
        <div className="bg-[#101F43] border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex flex-wrap items-center gap-x-7 gap-y-2">
            {salary && (
              <div className="flex items-center gap-2">
                <Euro size={12} className="text-brand" />
                <span className="text-white font-black font-display text-sm uppercase">{salary}</span>
              </div>
            )}
            {offer.experience_years && (
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-white/30" />
                <span className="text-white/60 text-sm font-semibold">
                  {offer.experience_years} {lang === "nl" ? "jaar" : `an${offer.experience_years > 1 ? "s" : ""}`} min.
                </span>
              </div>
            )}
            {offer.contract_type && (
              <div className="flex items-center gap-2">
                <Briefcase size={12} className="text-white/30" />
                <span className="text-white/60 text-sm font-semibold">
                  {CONTRACT_LABELS[offer.contract_type] ?? offer.contract_type}
                </span>
              </div>
            )}
            {(offer.city || offer.region) && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-white/30" />
                <span className="text-white/60 text-sm font-semibold">
                  {[offer.city, REGION_LABELS[offer.region as string]].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            <span className="text-white/25 text-sm font-semibold">{sectorLabel} · BE</span>
          </div>
        </div>
      </div>

      {/* ══ MAIN LAYOUT — fond clair ══════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[1fr_300px] gap-7">

          {/* ── COLONNE PRINCIPALE ──────────────────────── */}
          <div className="space-y-5">

            {/* Notre mission */}
            <div className="bg-white border border-ink-100 rounded-2xl p-6">
              <h2 className="font-display font-black text-ink uppercase tracking-wide text-[13px] mb-5 flex items-center gap-2.5">
                <span className="w-1 h-5 bg-brand rounded-full shrink-0" />
                {l("Notre mission", "Onze opdracht")}
              </h2>
              {offer.description ? (
                <div
                  className="text-ink-600 text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: offer.description.replace(/\n/g, "<br />") }}
                />
              ) : (
                <p className="text-[15px] text-ink-500">
                  {l("Aucune description détaillée pour le moment. Postulez pour en savoir plus auprès de l'employeur.", "Nog geen gedetailleerde beschrijving. Solliciteer om meer te weten te komen bij de werkgever.")}
                </p>
              )}
            </div>

            {/* Compétences requises */}
            <div className="bg-white border border-ink-100 rounded-2xl p-6">
              <h2 className="font-display font-black text-ink uppercase tracking-wide text-[13px] mb-5 flex items-center gap-2.5">
                <span className="w-1 h-5 bg-brand rounded-full shrink-0" />
                {l("Compétences requises", "Vereiste vaardigheden")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {[
                  ...(offer.caces_types ?? []).map((c: string) => `CACES ${c}`),
                  ...(offer.licenses ?? []).map((lic: string) => `${l("Permis", "Rijbewijs")} ${lic}`),
                  sectorLabel,
                  CONTRACT_LABELS[offer.contract_type] ?? offer.contract_type,
                ].map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[11px] font-black bg-[#FBF1D8] border border-ink-100 text-ink-600 px-3.5 py-2 rounded-lg uppercase tracking-wide"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contrat & salaire */}
            <div className="bg-white border border-ink-100 rounded-2xl p-6">
              <h2 className="font-display font-black text-ink uppercase tracking-wide text-[13px] mb-5 flex items-center gap-2.5">
                <span className="w-1 h-5 bg-brand rounded-full shrink-0" />
                {l("Contrat et salaire", "Contract en loon")}
              </h2>
              <p className="flex items-start gap-3 text-[15px] text-ink-600">
                <CheckCircle size={15} className="text-brand shrink-0 mt-0.5" />
                {l("Contrat", "Contract")} {CONTRACT_LABELS[offer.contract_type] ?? offer.contract_type}{salary ? ` — ${l("Salaire", "Loon")} : ${salary}` : ""}.
              </p>
            </div>

            {/* Postuler — mobile uniquement */}
            <Link
              href={`/postuler/${offer.id}`}
              className="md:hidden flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase py-4 rounded-xl transition text-[14px] w-full"
              style={{ letterSpacing: "0.06em" }}
            >
              {l("Postuler maintenant", "Nu solliciteren")}
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* ── SIDEBAR ─────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-[80px] lg:self-start">

            {/* Postuler CTA */}
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <Link
                href={`/postuler/${offer.id}`}
                className="flex items-center justify-center gap-2 font-display font-black uppercase text-white bg-brand hover:bg-brand-dark transition rounded-xl py-3.5 text-[14px] w-full"
                style={{ letterSpacing: "0.05em" }}
              >
                {l("Postuler maintenant", "Nu solliciteren")}
                <ArrowRight size={14} />
              </Link>
              <p className="text-ink-300 text-[11px] text-center mt-3">
                {l("Gratuit · Sans engagement", "Gratis · Vrijblijvend")}
              </p>
            </div>

            {/* Carte entreprise */}
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest mb-4">
                {l("Entreprise", "Bedrijf")}
              </p>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl border border-ink-100 flex items-center justify-center shrink-0 font-display font-black text-lg text-ink-400"
                  style={{ background: org?.primary_color ? `${org.primary_color}15` : "#FBF1D8" }}
                >
                  {org?.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={org.logo_url} alt={org?.name} className="w-full h-full object-contain rounded-xl" />
                    : (org?.name?.[0] ?? "H")
                  }
                </div>
                <div>
                  <p className="font-display font-black text-ink uppercase text-sm">
                    {org?.name ?? l("Entreprise", "Bedrijf")}
                  </p>
                  {org?.city && <p className="text-ink-400 text-xs">{org.city}</p>}
                </div>
              </div>

              <p className="text-ink-500 text-xs leading-relaxed mb-4 line-clamp-3">
                {org?.description ?? (lang === "nl" ? `Bedrijf actief in de sector ${sectorLabel.toLowerCase()}. Werft aan via Wolko.` : `Entreprise active dans le secteur ${sectorLabel.toLowerCase()}. Recrutement en cours via Wolko.`)}
              </p>

              <Link
                href={`/jobs?secteur=${offer.sector}`}
                className="block text-center w-full border border-ink-200 hover:border-brand text-ink-500 hover:text-brand font-display font-black uppercase text-[11px] py-2.5 rounded-xl transition tracking-widest"
              >
                {l("Voir les offres similaires", "Bekijk vergelijkbare vacatures")}
              </Link>
            </div>

            {/* Infos pratiques */}
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest mb-3">
                {l("Infos pratiques", "Praktische info")}
              </p>
              <div className="space-y-2.5">
                {(nbCandidatures ?? 0) > 0 && (
                  <div className="flex items-center gap-2.5 text-xs text-ink-500">
                    <Users size={12} className="text-ink-300 shrink-0" />
                    {lang === "nl" ? `${nbCandidatures} ${(nbCandidatures ?? 0) > 1 ? "sollicitaties" : "sollicitatie"} ingediend` : `${nbCandidatures} candidature${(nbCandidatures ?? 0) > 1 ? "s" : ""} déposée${(nbCandidatures ?? 0) > 1 ? "s" : ""}`}
                  </div>
                )}
                {offer.city && (
                  <div className="flex items-center gap-2.5 text-xs text-ink-500">
                    <MapPin size={12} className="text-ink-300 shrink-0" />
                    {offer.city}{offer.region ? ` · ${REGION_LABELS[offer.region as string] ?? offer.region}` : ""}
                  </div>
                )}
              </div>
            </div>

            {/* Offres similaires */}
            {(similar ?? []).length > 0 && (
              <div className="bg-white border border-ink-100 rounded-2xl p-5">
                <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest mb-3">
                  {l("Offres similaires", "Vergelijkbare vacatures")}
                </p>
                <div className="divide-y divide-ink-50">
                  {(similar ?? []).map(s => {
                    const sOrgRaw = s.organizations as unknown as { name: string }[] | { name: string } | null;
                    const sOrg = Array.isArray(sOrgRaw) ? (sOrgRaw[0] ?? null) : sOrgRaw;
                    return (
                      <Link key={s.id} href={`/jobs/${s.id}`}
                        className="flex items-center justify-between py-3 group">
                        <div className="min-w-0">
                          <p className="text-sm font-display font-black text-ink group-hover:text-brand uppercase tracking-tight truncate transition">
                            {s.title}
                          </p>
                          <p className="text-[11px] text-ink-400 mt-0.5">
                            {sOrg?.name ?? ""}{s.city ? ` · ${s.city}` : ""}
                          </p>
                        </div>
                        <ArrowRight size={12} className="text-ink-200 group-hover:text-brand transition shrink-0 ml-3" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Partager */}
            <div className="bg-white border border-ink-100 rounded-2xl p-5">
              <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest mb-3">
                {l("Partager", "Delen")}
              </p>
              <ShareButtons
                url={`https://wolko.be/jobs/${offer.id}`}
                title={offer.title}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ STICKY BOTTOM BAR ═════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#101F43]/95 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display font-black text-white uppercase text-sm leading-none truncate">
              {offer.title}
            </p>
            <p className="text-white/35 text-xs mt-0.5">
              {org?.name ?? ""}
              {salary ? ` · ${salary}` : ""}
            </p>
          </div>
          <Link
            href={`/postuler/${offer.id}`}
            className="bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm px-7 py-2.5 rounded-xl transition shrink-0"
            style={{ letterSpacing: "0.06em" }}
          >
            {l("Postuler", "Solliciteren")}
          </Link>
        </div>
      </div>
    </div>
  );
}
