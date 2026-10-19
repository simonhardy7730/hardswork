import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, MapPin, CheckCircle, Search, Building2, Zap, LayoutGrid, HeartHandshake,
  HardHat, Package, Truck, Factory, Stethoscope, ShieldCheck, Sparkles, UtensilsCrossed, Laptop,
} from "lucide-react";
import { SearchModule } from "@/components/home/SearchModule";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WolfBadge } from "@/components/ui/WolfMascot";
import { getDict } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n/dict";

interface JobOffer {
  id: string;
  title: string;
  city: string;
  sector: string;
  contract_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  show_salary: boolean;
  is_urgent: boolean;
  organizations: { name: string; primary_color: string | null } | null;
}

/* ─── Mosaïque du hero : plusieurs métiers ───────────── */
const U = (id: string) => `https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=75`;
const MOSAIC = (m: Record<string, string>) => [
  { label: m.construction, src: U("photo-1504307651254-35680f356dfd"), pos: "center 25%" },
  { label: m.health,        src: U("photo-1576091160550-2173dba999ef"), pos: "center 30%" },
  { label: m.transport,    src: U("photo-1601584115197-04ecc0da31d7"), pos: "center 40%" },
  { label: m.industry,    src: U("photo-1565793298595-6a879b1d9492"), pos: "center 60%" },
  { label: m.logistics,   src: U("photo-1586528116311-ad8dd3c8310d"), pos: "center center" },
  { label: m.office,       src: U("photo-1556761175-5973dc0f32e7"),    pos: "center center" },
];

/* ─── Secteurs (extensible : ajouter une ligne) ──────── */
const SECTORS = (t: Dict["sectors"]) => [
  { label: t.construction, icon: HardHat,         href: "/jobs?secteur=construction" },
  { label: t.logistics,   icon: Package,         href: "/jobs?secteur=logistique" },
  { label: t.transport,    icon: Truck,           href: "/jobs?secteur=transport" },
  { label: t.industry,    icon: Factory,         href: "/jobs?secteur=industrie" },
  { label: t.medical,      icon: Stethoscope,     href: "/jobs?secteur=medical" },
  { label: t.security,     icon: ShieldCheck,     href: "/jobs?secteur=securite" },
  { label: t.cleaning,    icon: Sparkles,        href: "/jobs?secteur=nettoyage" },
  { label: t.horeca,       icon: UtensilsCrossed, href: "/jobs?secteur=autre" },
  { label: t.tech,    icon: Laptop,          href: "/jobs?q=informatique" },
];

const WHY_ICONS = [MapPin, Zap, LayoutGrid, HeartHandshake];

const CONTRACT_STYLE: Record<string, string> = {
  interim: "bg-orange-50 text-orange-700 border border-orange-200",
  cdi: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cdd: "bg-blue-50 text-blue-700 border border-blue-200",
  apprentissage: "bg-purple-50 text-purple-700 border border-purple-200",
};

const H2 = { fontSize: "clamp(2rem, 4.5vw, 3.5rem)", lineHeight: 0.95 } as const;

export default async function HomePage() {
  const { t } = getDict();
  const supabase = await createClient();

  /* Offres réelles uniquement — aucune offre factice n'est affichée. */
  const { data: featuredRaw } = await supabase
    .from("job_offers")
    .select("id, title, city, sector, contract_type, salary_min, salary_max, salary_period, show_salary, is_urgent, organizations(name, primary_color)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);
  const displayJobs = (featuredRaw ?? []) as unknown as JobOffer[];

  return (
    <div className="bg-surface font-body">
      <SiteNav />

      {/* ── HERO : deux publics dès l'arrivée ─────────── */}
      <section className="brand-on-dark relative bg-[#101F43] pt-[60px] overflow-hidden noise">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-14 items-center" style={{ zIndex: 2 }}>
          <div>
            <h1 className="font-display font-black text-white uppercase leading-[0.92] tracking-tight mb-6 animate-fade-up-1"
              style={{ fontSize: "clamp(2.75rem, 7vw, 5.75rem)" }}>
              {t.hero.h1a}<br />
              {t.hero.h1b}<span className="text-brand">{t.hero.h1c}</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xl mb-8 animate-fade-up-2">
              {t.hero.sub}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 animate-fade-up-3">
              {/* Candidat */}
              <div className="bg-[#FFFBF2] rounded-2xl p-5 flex flex-col shadow-lg">
                <div className="w-11 h-11 rounded-xl bg-[#101F43] flex items-center justify-center mb-4">
                  <Search size={20} className="text-[#FFB900]" aria-hidden />
                </div>
                <h2 className="font-display font-black text-[#101F43] text-2xl leading-tight mb-1.5">{t.hero.candTitle}</h2>
                <p className="text-sm text-[#64748B] leading-relaxed mb-5 flex-1">
                  {t.hero.candText}
                </p>
                <Link href="/jobs" className="btn-brand justify-center">{t.hero.candCta} <ArrowRight size={15} /></Link>
              </div>
              {/* Recruteur */}
              <div className="bg-[#1C3058] border border-white/15 rounded-2xl p-5 flex flex-col shadow-lg">
                <div className="w-11 h-11 rounded-xl bg-[#FFB900] flex items-center justify-center mb-4">
                  <Building2 size={20} className="text-[#101F43]" aria-hidden />
                </div>
                <h2 className="font-display font-black text-white text-2xl leading-tight mb-1.5">{t.hero.recTitle}</h2>
                <p className="text-sm text-white/70 leading-relaxed mb-5 flex-1">
                  {t.hero.recText}
                </p>
                <Link href="/recrute" className="btn-ghost-dark justify-center">{t.hero.recCta} <ArrowRight size={15} /></Link>
              </div>
            </div>
          </div>

          {/* Mosaïque multi-métiers + mascotte */}
          <div className="relative pb-6 lg:pb-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {MOSAIC(t.mosaic).map((m, i) => (
                <div key={m.label}
                  className={`relative overflow-hidden rounded-xl sm:rounded-2xl h-28 sm:h-44 lg:h-52 ${i % 3 === 1 ? "lg:translate-y-6" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.src} alt="" loading={i < 3 ? "eager" : "lazy"}
                    className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: m.pos }} />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0B1630]/80 to-transparent" />
                  <span className="absolute left-2 bottom-2 text-[10px] sm:text-xs font-bold text-white uppercase tracking-wide">{m.label}</span>
                </div>
              ))}
            </div>
            {/* Mascotte : discrète, en appui sur la mosaïque */}
            <WolfBadge className="absolute -bottom-2 -left-2 sm:-left-4 w-24 sm:w-32 lg:w-36 z-10" />
          </div>
        </div>
      </section>

      {/* ── RECHERCHE ─────────────────────────────────── */}
      <SearchModule />

      {/* ── OFFRES RÉCENTES (réelles, si elles existent) ── */}
      {displayJobs.length > 0 && (
        <section className="bg-surface py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="section-label mb-3">{t.recent.label}</p>
                <h2 className="font-display font-black text-ink" style={H2}>{t.recent.title[0]}<br />{t.recent.title[1]}</h2>
              </div>
              <Link href="/jobs" className="hidden md:inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink transition-colors font-medium">
                {t.recent.all} <ArrowUpRight size={14} />
              </Link>
            </div>
          {/* Editorial job list */}
          <div className="rounded-2xl overflow-hidden border border-ink-100 bg-white">
            {displayJobs.slice(0, 6).map((job) => {
              const salaryStr = job.show_salary && job.salary_min
                ? `${job.salary_min}–${job.salary_max ?? "?"}€/${job.salary_period === "heure" ? "h" : job.salary_period === "jour" ? "j" : "mois"}`
                : null;
              return (
                <Link key={job.id} href={`/postuler/${job.id}`} className="job-row group">
                  {/* Left: urgency dot + title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {job.is_urgent && (
                      <div className="w-2 h-2 rounded-full bg-brand shrink-0" title={t.recent.urgent} />
                    )}
                    {!job.is_urgent && (
                      <div className="w-2 h-2 rounded-full bg-surface-3 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink text-lg leading-tight truncate group-hover:text-brand transition-colors">
                        {job.title}
                      </p>
                      <p className="text-sm text-ink-500 mt-0.5 truncate">
                        {job.organizations?.name ?? t.recent.org}
                      </p>
                    </div>
                  </div>

                  {/* Middle: location + sector */}
                  <div className="hidden md:flex items-center gap-1.5 text-sm text-ink-500 shrink-0 w-36">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{job.city}</span>
                  </div>

                  {/* Contract badge */}
                  <div className="shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${CONTRACT_STYLE[job.contract_type] ?? "bg-surface-2 text-ink-500"}`}>
                      {t.contracts[job.contract_type] ?? job.contract_type}
                    </span>
                  </div>

                  {/* Salary */}
                  <div className="hidden md:block shrink-0 w-36 text-right">
                    {salaryStr ? (
                      <span className="text-sm font-bold text-success">{salaryStr}</span>
                    ) : (
                      <span className="text-sm text-ink-300">—</span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowUpRight size={16} className="text-ink-300 group-hover:text-brand transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>

            <div className="mt-6 flex justify-center">
              <Link href="/jobs" className="btn-dark">{t.recent.seeAll} <ArrowRight size={15} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ── COMMENT ÇA MARCHE ─────────────────────────── */}
      <section id="comment-ca-marche" className="bg-surface-2 py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="section-label mb-3">{t.how.label}</p>
          <h2 className="font-display font-black text-ink mb-8" style={H2}>{t.how.title}</h2>
          <HowItWorks t={t.how} />
        </div>
      </section>

      {/* ── POURQUOI NOUS CHOISIR ─────────────────────── */}
      <section className="bg-surface py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="section-label mb-3">{t.why.label}</p>
          <h2 className="font-display font-black text-ink mb-10" style={H2}>{t.why.title}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.why.items.map((w, i) => {
              const WIcon = WHY_ICONS[i];
              return (
              <div key={w.title} className="bg-white border border-[#EADFC4] rounded-2xl p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-[#101F43] flex items-center justify-center mb-5">
                  <WIcon size={20} className="text-[#FFB900]" aria-hidden />
                </div>
                <h3 className="font-display font-bold text-ink text-xl mb-2">{w.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{w.body}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTEURS D'ACTIVITÉ ───────────────────────── */}
      <section id="secteurs" className="bg-surface-2 py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-3">{t.sectors.label}</p>
              <h2 className="font-display font-black text-ink" style={H2}>{t.sectors.title[0]}<br />{t.sectors.title[1]}</h2>
            </div>
            <Link href="/jobs" className="hidden md:inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink transition-colors font-medium">
              {t.recent.all} <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SECTORS(t.sectors).map((s) => (
              <Link key={s.label} href={s.href}
                className="group flex items-center gap-4 bg-white border border-[#EADFC4] hover:border-[#FFB900] hover:shadow-md rounded-2xl p-4 sm:p-5 transition-all">
                <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-[#101F43] group-hover:bg-[#FFB900] flex items-center justify-center transition-colors">
                  <s.icon size={22} className="text-[#FFB900] group-hover:text-[#101F43] transition-colors" aria-hidden />
                </div>
                <span className="font-display font-black text-ink text-lg sm:text-xl leading-tight">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECRUTEURS ────────────────────────────────── */}
      <section className="brand-on-dark bg-[#101F43] py-20 noise">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6" style={{ zIndex: 2 }}>
          <p className="section-label mb-4">{t.recruiters.label}</p>
          <h2 className="font-display font-black text-white uppercase mb-10 max-w-3xl"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)", lineHeight: 0.95 }}>
            {t.recruiters.title1}<span className="text-brand">{t.recruiters.title2}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {t.recruiters.points.map((x) => (
              <div key={x.t} className="bg-[#1C3058] border border-white/10 rounded-2xl p-6">
                <CheckCircle size={20} className="text-[#FFB900] mb-4" aria-hidden />
                <h3 className="font-display font-bold text-white text-xl mb-2">{x.t}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{x.b}</p>
              </div>
            ))}
          </div>
          <Link href="/recrute" className="btn-brand">{t.recruiters.cta} <ArrowRight size={15} /></Link>
        </div>
      </section>

      {/* ── APPEL FINAL ───────────────────────────────── */}
      <section className="bg-surface py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display font-black text-ink uppercase mb-4" style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", lineHeight: 0.95 }}>
            {t.final.title}
          </h2>
          <p className="text-[#64748B] text-base sm:text-lg mb-8">{t.final.text}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup/candidat" className="btn-brand justify-center">{t.final.cand} <ArrowRight size={15} /></Link>
            <Link href="/recrute" className="btn-dark justify-center">{t.final.rec} <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
