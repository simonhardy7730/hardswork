import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Euro, Briefcase, Clock, Users,
  ArrowRight, CheckCircle, ChevronRight,
} from "lucide-react";
import { CONTRACT_LABELS, SECTOR_LABELS, REGION_LABELS } from "@/lib/utils";
import { SiteNav } from "@/components/layout/SiteNav";

/* ─── Photos Unsplash par secteur ────────────────────── */
const SECTOR_PHOTOS: Record<string, string> = {
  industrie:    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&auto=format&fit=crop&q=80",
  construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80",
  transport:    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&auto=format&fit=crop&q=80",
  logistique:   "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80",
  medical:      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&auto=format&fit=crop&q=80",
  securite:     "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1200&auto=format&fit=crop&q=80",
  nettoyage:    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=1200&auto=format&fit=crop&q=80",
  default:      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80",
};

const CONTRACT_STYLE: Record<string, string> = {
  interim:       "bg-orange-50 text-orange-700 border border-orange-200",
  cdi:           "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cdd:           "bg-blue-50 text-blue-700 border border-blue-200",
  apprentissage: "bg-purple-50 text-purple-700 border border-purple-200",
};

/* ─── Metadata ───────────────────────────────────────── */
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_offers")
    .select("title, city, sector, organizations(name)")
    .eq("id", params.id).single();
  if (!data) return { title: "Offre introuvable — HardSwork" };
  const orgRaw = data.organizations as unknown as { name: string }[] | { name: string } | null;
  const org = Array.isArray(orgRaw) ? (orgRaw[0] ?? null) : orgRaw;
  return {
    title: `${data.title} — ${org?.name ?? ""} | HardSwork`,
    description: `Offre ${SECTOR_LABELS[data.sector] ?? data.sector} à ${data.city}. Postulez maintenant sur HardSwork.`,
  };
}

/* ─── Page ───────────────────────────────────────────── */
export default async function JobDetailPage({ params }: { params: { id: string } }) {
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
      : `${offer.salary_min?.toLocaleString("fr-BE")}–${offer.salary_max?.toLocaleString("fr-BE")}€/mois`
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
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      <SiteNav />

      <div className="pt-[60px]">

        {/* ── BREADCRUMB ──────────────────────────────── */}
        <div className="bg-white border-b border-ink-100">
          <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center gap-1.5 text-[11px] text-ink-300 flex-wrap">
            {[
              { label: "HardSwork", href: "/" },
              { label: "Offres d'emploi", href: "/jobs" },
              { label: sectorLabel, href: `/jobs?secteur=${offer.sector}` },
              { label: "Détails de l'offre", href: "#" },
              { label: offer.title, href: "#" },
            ].map((crumb, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={10} className="text-ink-100" />}
                {i < arr.length - 1
                  ? <Link href={crumb.href} className="hover:text-brand transition-colors font-medium">{crumb.label}</Link>
                  : <span className="text-ink-500 font-semibold truncate max-w-[200px]">{crumb.label}</span>
                }
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* ── TITRE + TAG ────────────────────────────── */}
          <div className="mb-6 flex items-start gap-3 flex-wrap">
            <div className="flex-1">
              {offer.is_urgent && (
                <span className="inline-block text-[10px] font-black text-brand bg-brand/10 px-2.5 py-1 rounded-full uppercase tracking-widest mb-3">
                  🔴 Offre urgente
                </span>
              )}
              <h1
                className="font-display font-black text-ink uppercase leading-none"
                style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", letterSpacing: "-0.01em" }}
              >
                {offer.title} <span className="text-ink-300 font-black text-2xl">(H/F)</span>
              </h1>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className="text-[11px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest"
                  style={{ background: "#D93B12" }}
                >
                  #{sectorLabel.toUpperCase()}
                </span>
                {offer.contract_type && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${CONTRACT_STYLE[offer.contract_type] ?? "bg-surface-2 text-ink-500"}`}>
                    {CONTRACT_LABELS[offer.contract_type] ?? offer.contract_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6">

            {/* ══ COLONNE PRINCIPALE ══════════════════════ */}
            <div className="space-y-6">

              {/* Company at a glance */}
              <div className="bg-white border border-ink-100 rounded-2xl p-5">
                <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest mb-4">
                  Company at a glance
                </p>
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div
                    className="w-14 h-14 rounded-xl border border-ink-100 flex items-center justify-center shrink-0 font-display font-black text-xl text-ink-300"
                    style={{ background: org?.primary_color ? `${org.primary_color}15` : "#F2EDE7" }}
                  >
                    {org?.logo_url
                      ? <img src={org.logo_url} alt={org?.name} className="w-full h-full object-contain rounded-xl" />
                      : (org?.name?.[0] ?? "H")
                    }
                  </div>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {org?.name && (
                      <div>
                        <p className="text-[10px] text-ink-300 font-semibold uppercase tracking-wide">Entreprise</p>
                        <p className="text-sm font-bold text-ink">{org.name}</p>
                      </div>
                    )}
                    {(offer.city || offer.region) && (
                      <div>
                        <p className="text-[10px] text-ink-300 font-semibold uppercase tracking-wide flex items-center gap-1">
                          <MapPin size={9} /> Location
                        </p>
                        <p className="text-sm font-bold text-ink">
                          {[offer.city, REGION_LABELS[offer.region as string]].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                    {salary && (
                      <div>
                        <p className="text-[10px] text-ink-300 font-semibold uppercase tracking-wide flex items-center gap-1">
                          <Euro size={9} /> Salary
                        </p>
                        <p className="text-sm font-bold text-emerald-700">{salary}</p>
                      </div>
                    )}
                    {offer.contract_type && (
                      <div>
                        <p className="text-[10px] text-ink-300 font-semibold uppercase tracking-wide flex items-center gap-1">
                          <Briefcase size={9} /> Type
                        </p>
                        <p className="text-sm font-bold text-ink">
                          {CONTRACT_LABELS[offer.contract_type] ?? offer.contract_type}
                        </p>
                      </div>
                    )}
                    {offer.experience_years && (
                      <div>
                        <p className="text-[10px] text-ink-300 font-semibold uppercase tracking-wide">Expérience</p>
                        <p className="text-sm font-bold text-ink">{offer.experience_years} ans min.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Image hero secteur */}
              <div className="rounded-2xl overflow-hidden h-56 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroPhoto}
                  alt={sectorLabel}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0D]/40 to-transparent" />
              </div>

              {/* Description structurée */}
              <div className="bg-white border border-ink-100 rounded-2xl p-6 space-y-6">
                {offer.description ? (
                  <div className="prose prose-sm max-w-none text-ink-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: offer.description.replace(/\n/g, "<br />") }} />
                ) : (
                  /* Sections par défaut si pas de description */
                  <>
                    <div>
                      <h2 className="font-display font-black text-ink uppercase tracking-wide text-base mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-brand rounded-full shrink-0" />
                        Votre mission
                      </h2>
                      <ul className="space-y-2">
                        {[
                          `Exercer le métier de ${offer.title} dans un environnement professionnel.`,
                          "Respecter les consignes de sécurité et les procédures qualité.",
                          "Travailler en équipe et rendre compte à votre responsable.",
                        ].map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                            <CheckCircle size={14} className="text-brand shrink-0 mt-0.5" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-ink-100 pt-5">
                      <h2 className="font-display font-black text-ink uppercase tracking-wide text-base mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-brand rounded-full shrink-0" />
                        Votre profil
                      </h2>
                      <ul className="space-y-2">
                        {[
                          `Expérience dans le domaine ${sectorLabel.toLowerCase()}.`,
                          "Sérieux(se), ponctuel(le) et motivé(e).",
                          offer.caces_types?.length > 0 ? `CACES requis : ${offer.caces_types.join(", ")}.` : "Autonome et rigoureux(se).",
                        ].map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                            <CheckCircle size={14} className="text-brand shrink-0 mt-0.5" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-ink-100 pt-5">
                      <h2 className="font-display font-black text-ink uppercase tracking-wide text-base mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-brand rounded-full shrink-0" />
                        Notre offre
                      </h2>
                      <ul className="space-y-2">
                        {[
                          `Contrat ${CONTRACT_LABELS[offer.contract_type] ?? offer.contract_type}.${salary ? ` Salaire : ${salary}.` : ""}`,
                          "Environnement de travail dynamique en Belgique.",
                          "Candidature traitée sous 48h.",
                        ].map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                            <CheckCircle size={14} className="text-brand shrink-0 mt-0.5" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* CACES / Certifications */}
              {(offer.caces_types?.length > 0 || offer.licenses?.length > 0) && (
                <div className="bg-white border border-ink-100 rounded-2xl p-5">
                  <h2 className="font-display font-black text-ink uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-brand rounded-full" />
                    Certifications requises
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {offer.caces_types?.map((c: string) => (
                      <span key={c} className="text-[11px] font-black bg-surface border border-ink-100 text-ink px-3 py-1.5 rounded-lg uppercase">
                        CACES {c}
                      </span>
                    ))}
                    {offer.licenses?.map((l: string) => (
                      <span key={l} className="text-[11px] font-black bg-surface border border-ink-100 text-ink px-3 py-1.5 rounded-lg uppercase">
                        Permis {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Offres similaires */}
              {(similar ?? []).length > 0 && (
                <div className="bg-white border border-ink-100 rounded-2xl p-5">
                  <h2 className="font-display font-black text-ink uppercase tracking-wide text-sm mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-brand rounded-full" />
                    Offres similaires
                  </h2>
                  <div className="divide-y divide-ink-100">
                    {(similar ?? []).map(s => {
                      const sOrgRaw = s.organizations as unknown as { name: string }[] | { name: string } | null;
                      const sOrg = Array.isArray(sOrgRaw) ? (sOrgRaw[0] ?? null) : sOrgRaw;
                      return (
                        <Link key={s.id} href={`/jobs/${s.id}`}
                          className="flex items-center justify-between py-3 hover:text-brand transition-colors group">
                          <div>
                            <p className="text-sm font-bold text-ink group-hover:text-brand transition-colors uppercase tracking-tight font-display">
                              {s.title}
                            </p>
                            <p className="text-xs text-ink-500">{sOrg?.name} · {s.city}</p>
                          </div>
                          <ArrowRight size={13} className="text-ink-100 group-hover:text-brand transition-colors shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ══ SIDEBAR DROITE ══════════════════════════ */}
            <div className="space-y-4">

              {/* ── Postuler ────────────────────────────── */}
              <div className="bg-white border border-ink-100 rounded-2xl p-5 sticky top-[76px]">
                <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest mb-3">
                  Postuler
                </p>

                <Link href={`/postuler/${offer.id}`}
                  className="flex items-center justify-center gap-2 font-display font-black uppercase tracking-wide text-white bg-brand hover:bg-brand-dark transition rounded-xl py-3.5 text-[15px] w-full mb-4"
                  style={{ letterSpacing: "0.05em" }}>
                  Postuler maintenant
                  <ArrowRight size={15} />
                </Link>

                <div className="text-[10px] text-ink-300 text-center mb-4">
                  Gratuit · Sans engagement · Réponse sous 48h
                </div>

                {/* Quick Info */}
                <div className="bg-surface rounded-xl p-3 space-y-2 border border-ink-100">
                  <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest">
                    Quick Info
                  </p>
                  <div className="flex items-center gap-2 text-xs text-ink-700">
                    <Clock size={12} className="text-ink-300 shrink-0" />
                    Offre récente
                  </div>
                  {(nbCandidatures ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <Users size={12} className="text-ink-300 shrink-0" />
                      {nbCandidatures} candidature{(nbCandidatures ?? 0) > 1 ? "s" : ""}
                    </div>
                  )}
                  {offer.city && (
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <MapPin size={12} className="text-ink-300 shrink-0" />
                      {offer.city}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Vous recrutez ? ─────────────────────── */}
              <div className="bg-[#0F0E0D] rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-black text-white text-sm uppercase mb-1">
                      Vous recrutez ?
                    </p>
                    <Link href="/jobs" className="text-brand text-xs font-bold hover:text-brand-light transition-colors underline-offset-2 hover:underline">
                      Voir les profils similaires →
                    </Link>
                  </div>
                </div>
                <Link href="/signup"
                  className="mt-4 flex items-center justify-center gap-2 font-display font-black uppercase text-white border border-white/20 hover:border-white/40 rounded-xl py-2.5 text-[12px] transition w-full"
                  style={{ letterSpacing: "0.05em" }}>
                  Créer mon espace recruteur
                </Link>
              </div>

              {/* ── Partager ────────────────────────────── */}
              <div className="bg-white border border-ink-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-ink-300 uppercase tracking-widest mb-3">
                  Partager cette offre
                </p>
                <div className="flex gap-2">
                  {[
                    { label: "LinkedIn", color: "#0A66C2" },
                    { label: "WhatsApp", color: "#25D366" },
                    { label: "Copier", color: "#0F0E0D" },
                  ].map(({ label, color }) => (
                    <button key={label}
                      className="flex-1 text-[10px] font-black text-white rounded-lg py-2 uppercase tracking-wide hover:opacity-80 transition"
                      style={{ background: color }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
