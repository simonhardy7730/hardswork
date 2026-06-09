import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, MapPin, CheckCircle, ArrowUpRight } from "lucide-react";
import { CONTRACT_LABELS, SECTOR_LABELS } from "@/lib/utils";
import { SearchModule } from "@/components/home/SearchModule";
import { HardSworkLogo, HardieIcon } from "@/components/ui/HardieIcon";
import { SiteNav } from "@/components/layout/SiteNav";

/* ─── TYPES ──────────────────────────────────────────── */
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

/* ─── HERO COLLAGE ───────────────────────────────────── */
/* 6 photos — 3 colonnes × 2 rangées, métiers variés et lumineux */
const HERO_COLLAGE = [
  /* ligne du haut */
  { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&auto=format&fit=crop&q=80", pos: "center 25%" },  // construction BTP
  { src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=700&auto=format&fit=crop&q=80", pos: "center center" }, // médecin stéthoscope
  { src: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=700&auto=format&fit=crop&q=80", pos: "center 40%" },   // camion Scania
  /* ligne du bas */
  { src: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=700&auto=format&fit=crop&q=80", pos: "center 60%" },   // usine industrielle
  { src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=700&auto=format&fit=crop&q=80", pos: "center center" }, // entrepôt logistique
  { src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&auto=format&fit=crop&q=80", pos: "center 30%" },   // infirmière hôpital
];

/* ─── STATIC ─────────────────────────────────────────── */
const SECTORS = [
  {
    key: "logistique",
    label: "Logistique",
    count: "840+",
    bg: "linear-gradient(135deg, #1a1512 0%, #2d2420 100%)",
    accent: "#D93B12",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=70",
  },
  {
    key: "transport",
    label: "Transport",
    count: "620+",
    bg: "linear-gradient(135deg, #0f1a24 0%, #1a2d3d 100%)",
    accent: "#3B82F6",
    img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=70",
  },
  {
    key: "industrie",
    label: "Industrie",
    count: "510+",
    bg: "linear-gradient(135deg, #1a1a0f 0%, #2d2d1a 100%)",
    accent: "#F59E0B",
    img: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&auto=format&fit=crop&q=70",
  },
  {
    key: "construction",
    label: "Construction",
    count: "390+",
    bg: "linear-gradient(135deg, #1a1209 0%, #2d1f0f 100%)",
    accent: "#F97316",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=70",
  },
  {
    key: "nettoyage",
    label: "Nettoyage",
    count: "280+",
    bg: "linear-gradient(135deg, #0f1a17 0%, #1a2d26 100%)",
    accent: "#10B981",
    img: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=70",
  },
  {
    key: "securite",
    label: "Sécurité",
    count: "190+",
    bg: "linear-gradient(135deg, #12120f 0%, #1f1f17 100%)",
    accent: "#8B5CF6",
    img: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=70",
  },
  {
    key: "medical",
    label: "Médical",
    count: "320+",
    bg: "linear-gradient(135deg, #0f1a1a 0%, #1a2d2d 100%)",
    accent: "#06B6D4",
    img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=70",
  },
];

const CONTRACT_STYLE: Record<string, string> = {
  interim: "bg-orange-50 text-orange-700 border border-orange-200",
  cdi: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cdd: "bg-blue-50 text-blue-700 border border-blue-200",
  apprentissage: "bg-purple-50 text-purple-700 border border-purple-200",
};


/* ─── PAGE ───────────────────────────────────────────── */
export default async function HomePage() {
  const supabase = await createClient();

  const { data: featuredRaw } = await supabase
    .from("job_offers")
    .select("id, title, city, sector, contract_type, salary_min, salary_max, salary_period, show_salary, is_urgent, organizations(name, primary_color)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  const { count: totalJobs } = await supabase
    .from("job_offers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const { count: totalCandidates } = await supabase
    .from("candidates")
    .select("id", { count: "exact", head: true });

  const jobs = (featuredRaw ?? []) as unknown as JobOffer[];

  /* demo jobs if DB empty */
  const displayJobs: JobOffer[] = jobs.length > 0 ? jobs : [
    { id: "1", title: "Chauffeur SPL longue distance", city: "Liège", sector: "transport", contract_type: "cdi", salary_min: 2200, salary_max: 2600, salary_period: "mois", show_salary: true, is_urgent: true, organizations: { name: "Transport Dubois", primary_color: null } },
    { id: "2", title: "Cariste CACES 3 et 5", city: "Bruxelles", sector: "logistique", contract_type: "interim", salary_min: 16, salary_max: 18, salary_period: "heure", show_salary: true, is_urgent: false, organizations: { name: "LogiPro SA", primary_color: null } },
    { id: "3", title: "Soudeur TIG/MIG certifié", city: "Gand", sector: "industrie", contract_type: "cdd", salary_min: 20, salary_max: 24, salary_period: "heure", show_salary: true, is_urgent: false, organizations: { name: "Métal Plus", primary_color: null } },
    { id: "4", title: "Maçon coffreur bancheur", city: "Namur", sector: "construction", contract_type: "cdi", salary_min: 2100, salary_max: 2500, salary_period: "mois", show_salary: true, is_urgent: true, organizations: { name: "BatiGroup", primary_color: null } },
    { id: "5", title: "Opérateur de production alimentaire", city: "Leuven", sector: "industrie", contract_type: "cdi", salary_min: 2000, salary_max: 2300, salary_period: "mois", show_salary: true, is_urgent: false, organizations: { name: "AB InBev", primary_color: null } },
    { id: "6", title: "Agent de sécurité SSIAP 1", city: "Anvers", sector: "securite", contract_type: "interim", salary_min: 15, salary_max: 17, salary_period: "heure", show_salary: true, is_urgent: false, organizations: { name: "SecuBelgique", primary_color: null } },
  ];

  const statsJobs   = (totalJobs ?? 0) > 0 ? `${(totalJobs ?? 0).toLocaleString("fr-BE")}` : "500";
  const statsCands  = (totalCandidates ?? 0) > 0 ? `${(totalCandidates ?? 0).toLocaleString("fr-BE")}` : "2 400";

  return (
    <div className="bg-surface font-body">

      {/* ── NAV ──────────────────────────────────────── */}
      <SiteNav />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 pt-[60px] overflow-hidden noise">
        {/* Background — 6 photos, grille 3×2 */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2" style={{ zIndex: 0 }}>
          {HERO_COLLAGE.map((photo, i) => (
            <div key={i} className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: photo.pos, filter: "brightness(0.78) saturate(0.90)" }}
              />
            </div>
          ))}
        </div>

        {/* Overlay — réduit pour laisser respirer les photos des deux côtés */}
        <div className="absolute inset-0" style={{
          zIndex: 1,
          background: "linear-gradient(100deg, rgba(15,14,13,0.78) 0%, rgba(15,14,13,0.62) 30%, rgba(15,14,13,0.35) 58%, rgba(15,14,13,0.06) 100%)",
        }} />

        {/* Bottom fade into search section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-surface to-transparent" style={{ zIndex: 2 }} />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 w-full" style={{ zIndex: 3 }}>
          <div className="max-w-3xl">


            {/* Headline */}
            <h1 className="font-display font-black text-white leading-none tracking-tight mb-8 animate-fade-up-1"
              style={{
                fontSize: "clamp(3.5rem, 8vw, 7.5rem)",
                textShadow: "0 2px 24px rgba(15,14,13,0.7), 0 1px 6px rgba(15,14,13,0.5)",
              }}>
              Recrutez les
              <br />
              <em className="not-italic text-brand">meilleurs</em>
              <br />
              du terrain.
            </h1>

            {/* Sub */}
            <p className="text-white/80 text-lg leading-relaxed max-w-xl mb-10 animate-fade-up-2"
              style={{
                fontFamily: "var(--font-body)",
                textShadow: "0 1px 12px rgba(15,14,13,0.8)",
              }}>
              La plateforme de recrutement pensée pour les professionnels
              du terrain belge — logistique, transport, construction, médical et plus.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up-3">
              <Link href="/recrute" className="btn-brand">
                Je recrute gratuitement
                <ArrowRight size={15} />
              </Link>
              <Link href="/jobs" className="btn-ghost-dark">
                Voir les offres d&apos;emploi
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH MODULE ─────────────────────────────── */}
      <SearchModule />


      {/* ── NUMBERS ──────────────────────────────────── */}
      <section className="bg-[#0F0E0D] py-20 noise">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { num: `${statsJobs}+`, label: "offres actives", sub: "en Belgique" },
              { num: `${statsCands}+`, label: "candidats inscrits", sub: "prêts à être contactés" },
              { num: "48h", label: "délai moyen", sub: "première candidature reçue" },
              { num: "7", label: "secteurs couverts", sub: "du terrain à la gestion" },
            ].map((s, i) => (
              <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="font-display font-black text-white mb-2"
                  style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", lineHeight: 1 }}>
                  {s.num}
                </div>
                <div className="text-sm font-bold text-white/80 mb-1">{s.label}</div>
                <div className="text-xs text-white/35">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTORS ──────────────────────────────────── */}
      <section id="secteurs" className="bg-[#0F0E0D] pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-3">Secteurs</p>
              <h2 className="font-display font-black text-white"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 0.95 }}>
                Chaque métier,<br />une offre.
              </h2>
            </div>
            <Link href="/jobs"
              className="hidden md:inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors font-medium">
              Toutes les offres <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SECTORS.map((s) => (
              <Link key={s.key} href={`/jobs?secteur=${s.key}`} className="sector-card group">
                <div className="relative h-52 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.img}
                    alt={s.label}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0D] via-[#0F0E0D]/40 to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-between" style={{ zIndex: 2 }}>
                    <div className="flex justify-end">
                      <span className="text-[11px] font-bold text-white/60 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        {s.count} offres
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-black text-white text-2xl leading-none mb-2 group-hover:text-brand transition-colors">
                        {s.label}
                      </h3>
                      <div className="flex items-center gap-1 text-white/50 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Voir les offres <ArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ─────────────────────────────── */}
      <section className="bg-surface py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="section-label mb-3">Offres récentes</p>
              <h2 className="font-display font-black text-ink"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 0.95 }}>
                Les postes<br />du moment.
              </h2>
            </div>
            <Link href="/jobs"
              className="hidden md:inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink transition-colors font-medium">
              Toutes les offres <ArrowUpRight size={14} />
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
                      <div className="w-2 h-2 rounded-full bg-brand shrink-0" title="Urgent" />
                    )}
                    {!job.is_urgent && (
                      <div className="w-2 h-2 rounded-full bg-surface-3 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-display font-bold text-ink text-lg leading-tight truncate group-hover:text-brand transition-colors">
                        {job.title}
                      </p>
                      <p className="text-sm text-ink-500 mt-0.5 truncate">
                        {job.organizations?.name ?? "Organisation"}
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
                      {CONTRACT_LABELS[job.contract_type] ?? job.contract_type}
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
            <Link href="/jobs" className="btn-dark">
              Voir toutes les offres d&apos;emploi
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AUDIENCE SPLIT ────────────────────────────── */}
      <section className="grid md:grid-cols-2 min-h-[80vh]">
        {/* Recruiter side */}
        <div className="relative overflow-hidden noise group cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&auto=format&fit=crop&q=75"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F0E0D]/95 via-[#0F0E0D]/70 to-[#D93B12]/20" />
          <div className="relative h-full flex flex-col justify-end p-10 md:p-14 min-h-[50vh]" style={{ zIndex: 2 }}>
            <p className="section-label text-brand/80 mb-4">Pour les recruteurs</p>
            <h2 className="font-display font-black text-white mb-4"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3.25rem)", lineHeight: 0.95 }}>
              Trouvez le
              <br />
              bon profil.
              <br />
              Vite.
            </h2>
            <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-xs">
              Publiez en 2 minutes. Recevez des candidatures filtrées par permis, CACES et expérience.
            </p>
            <div>
              <Link href="/signup" className="btn-brand inline-flex">
                Créer mon espace recruteur
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Worker side */}
        <div className="relative overflow-hidden noise group cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&auto=format&fit=crop&q=75"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#F2EDE7]/95 via-[#F2EDE7]/70 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-10 md:p-14 min-h-[50vh]" style={{ zIndex: 2 }}>
            <p className="section-label mb-4">Pour les chercheurs d&apos;emploi</p>
            <h2 className="font-display font-black text-ink"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3.25rem)", lineHeight: 0.95 }}>
              Votre métier
              <br />
              mérite
              <br />
              <em className="not-italic text-brand">mieux.</em>
            </h2>
            <p className="text-ink-500 text-sm leading-relaxed mb-8 max-w-xs">
              Créez votre profil, uploadez votre CV. Les recruteurs viennent à vous — pas l&apos;inverse.
            </p>
            <div>
              <Link href="/signup/candidat" className="btn-dark inline-flex">
                Créer mon profil gratuitement
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section className="bg-surface-2 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16">
            <p className="section-label mb-3">Simple par design</p>
            <h2 className="font-display font-black text-ink"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 0.95 }}>
              Prêt en 10 minutes.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Créez votre espace",
                body: "Inscrivez votre agence ou PME. 2 minutes. Aucune carte bancaire. Aucun engagement.",
                cta: "Commencer",
                href: "/signup",
              },
              {
                n: "02",
                title: "Publiez vos offres",
                body: "Décrivez le poste, les permis requis, le salaire. Formulaire adapté au terrain, pas au bureau.",
                cta: "Voir un exemple",
                href: "/jobs",
              },
              {
                n: "03",
                title: "Recrutez directement",
                body: "Candidatures filtrées, coordonnées révélées avec l'abonnement. Aucun intermédiaire.",
                cta: "Voir les tarifs",
                href: "/#tarifs",
              },
            ].map((step) => (
              <div key={step.n} className="group">
                <div className="font-display font-black text-ink-100 text-7xl leading-none mb-6 select-none">
                  {step.n}
                </div>
                <div className="w-10 h-[3px] bg-brand mb-5" />
                <h3 className="font-display font-bold text-ink text-2xl mb-3">{step.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed mb-5">{step.body}</p>
                <Link href={step.href}
                  className="text-sm font-bold text-brand inline-flex items-center gap-1.5 underline-grow">
                  {step.cta} <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT MASKING ───────────────────────────── */}
      <section className="bg-[#0F0E0D] py-24 noise">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <p className="section-label text-brand/70 mb-5">Modèle de confiance</p>
              <h2 className="font-display font-black text-white mb-6"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 0.95 }}>
                Les profils sont là.
                <br />
                Aux abonnés de les
                <br />
                <em className="not-italic text-brand">contacter.</em>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8 text-base">
                Comme HelloWork ou LinkedIn — les CV et profils sont visibles par tous. Seuls les recruteurs abonnés accèdent aux coordonnées directes.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Profils candidats et CV accessibles gratuitement",
                  "Téléphone et email masqués sans abonnement",
                  "Révélés instantanément avec un plan actif",
                  "Sans engagement — résiliez quand vous voulez",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                    <CheckCircle size={15} className="text-brand mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-brand">
                Commencer gratuitement
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Right: demo UI */}
            <div className="space-y-3">
              {/* Without */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500/70" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Sans abonnement</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center font-display font-black text-white/40 text-lg shrink-0">
                    MB
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold mb-0.5">Mehdi B. — Cariste CACES 3 & 5</p>
                    <p className="text-white/35 text-sm mb-3">Anvers · Disponible immédiatement · 6 ans d&apos;exp.</p>
                    <div className="flex gap-2 flex-wrap">
                      <div className="h-8 w-36 rounded-lg bg-white/[0.06]" style={{ filter: "blur(3px)" }}>
                        <div className="h-full w-full rounded-lg bg-white/10 flex items-center px-3">
                          <span className="text-white/20 text-xs font-mono">+32 4•• ••• •••</span>
                        </div>
                      </div>
                      <div className="h-8 w-44 rounded-lg bg-white/[0.06]" style={{ filter: "blur(3px)" }}>
                        <div className="h-full w-full rounded-lg bg-white/10 flex items-center px-3">
                          <span className="text-white/20 text-xs font-mono">mehdi•••@gmail.com</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* With */}
              <div className="bg-brand/[0.08] border border-brand/25 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Avec abonnement</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center font-display font-black text-brand text-lg shrink-0">
                    MB
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold mb-0.5">Mehdi B. — Cariste CACES 3 & 5</p>
                    <p className="text-white/35 text-sm mb-3">Anvers · Disponible immédiatement · 6 ans d&apos;exp.</p>
                    <div className="flex gap-2 flex-wrap">
                      <div className="h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center px-3 gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-emerald-300 text-xs font-mono font-semibold">+32 476 28 33 91</span>
                      </div>
                      <div className="h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center px-3 gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-emerald-300 text-xs font-mono font-semibold">m.benaissa@gmail.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-white/25 text-xs text-center pt-1">
                Exemple illustratif. Les données sont fictives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section id="tarifs" className="bg-surface-2 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Tarifs</p>
            <h2 className="font-display font-black text-ink mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 0.95 }}>
              Transparent.<br />Sans surprise.
            </h2>
            <p className="text-ink-500 text-base">Commencez gratuitement. Passez à un plan quand vous recrutez activement.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white border border-ink-100 rounded-2xl p-8">
              <p className="font-display font-bold text-ink text-xl mb-1">Gratuit</p>
              <p className="text-ink-500 text-sm mb-6">Pour découvrir la plateforme</p>
              <div className="mb-6">
                <span className="font-display font-black text-ink" style={{ fontSize: "2.75rem", lineHeight: 1 }}>0€</span>
                <span className="text-ink-500 text-sm ml-1">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {["1 offre active", "Profils candidats visibles", "Candidatures reçues", "Tableau de bord basique"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-ink-700">
                    <CheckCircle size={14} className="text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center font-bold text-sm bg-ink-100 hover:bg-surface-3 text-ink py-3 rounded-xl transition">
                Commencer →
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#0F0E0D] rounded-2xl p-8 relative shadow-2xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-brand text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                  Plus populaire
                </span>
              </div>
              <p className="font-display font-bold text-white text-xl mb-1">Pro</p>
              <p className="text-white/40 text-sm mb-6">Pour les PME en croissance</p>
              <div className="mb-6">
                <span className="font-display font-black text-white" style={{ fontSize: "2.75rem", lineHeight: 1 }}>89€</span>
                <span className="text-white/40 text-sm ml-1">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {["5 offres actives", "Coordonnées des candidats", "CV téléchargeables", "Export CSV des candidatures", "Support prioritaire"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-white/75">
                    <CheckCircle size={14} className="text-brand shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-brand block text-center">
                Essai 14 jours gratuit →
              </Link>
            </div>

            {/* Agency */}
            <div className="bg-white border border-ink-100 rounded-2xl p-8">
              <p className="font-display font-bold text-ink text-xl mb-1">Agence</p>
              <p className="text-ink-500 text-sm mb-6">Pour les agences multi-sites</p>
              <div className="mb-6">
                <span className="font-display font-black text-ink" style={{ fontSize: "2.75rem", lineHeight: 1 }}>249€</span>
                <span className="text-ink-500 text-sm ml-1">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {["Offres illimitées", "Multi-agences centralisé", "API & intégrations", "Tableau de bord analytique", "Account manager dédié"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-ink-700">
                    <CheckCircle size={14} className="text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center font-bold text-sm bg-ink-100 hover:bg-surface-3 text-ink py-3 rounded-xl transition">
                Contacter l&apos;équipe →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────── */}
      <section className="relative overflow-hidden noise">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1558470598-a5dda4d5142b?w=1920&auto=format&fit=crop&q=70"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0 bg-[#0F0E0D]/90" style={{ zIndex: 1 }} />

        <div className="relative max-w-5xl mx-auto px-6 py-28 text-center" style={{ zIndex: 2 }}>
          <h2 className="font-display font-black text-white mb-6"
            style={{ fontSize: "clamp(3rem, 7vw, 7rem)", lineHeight: 0.92, letterSpacing: "-0.02em" }}>
            Votre prochain
            <br />
            <em className="not-italic text-brand">recrutement</em>
            <br />
            commence ici.
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Rejoignez les centaines d&apos;entreprises belges qui font confiance à HardSwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-brand" style={{ fontSize: "1rem", padding: "1rem 2rem" }}>
              Démarrer gratuitement
              <ArrowRight size={16} />
            </Link>
            <Link href="/jobs" className="btn-ghost-dark" style={{ fontSize: "1rem", padding: "1rem 2rem" }}>
              Voir les offres d&apos;emploi
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="bg-[#0A0909] border-t border-white/[0.05] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <HardSworkLogo size="md" dark={true} />
              </div>
              <p className="text-white/30 text-sm leading-relaxed max-w-xs">
                La plateforme de recrutement pensée pour les professionnels du terrain en Belgique.
              </p>
            </div>

            {[
              {
                title: "Plateforme",
                links: [
                  { label: "Offres d'emploi", href: "/jobs" },
                  { label: "Je recrute", href: "/signup" },
                  { label: "Je cherche un emploi", href: "/signup/candidat" },
                  { label: "Tarifs", href: "/#tarifs" },
                ],
              },
              {
                title: "Secteurs",
                links: SECTORS.slice(0, 4).map((s) => ({
                  label: s.label,
                  href: `/jobs?secteur=${s.key}`,
                })),
              },
              {
                title: "Compte",
                links: [
                  { label: "Se connecter", href: "/login" },
                  { label: "S'inscrire", href: "/signup" },
                  { label: "Tableau de bord", href: "/dashboard" },
                  { label: "Paramètres", href: "/dashboard/settings" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href}
                        className="text-sm text-white/40 hover:text-white/75 transition-colors underline-grow">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-white/[0.05]">
            <p className="text-xs text-white/20">© 2026 HardSwork · Belgique 🇧🇪 · Tous droits réservés</p>
            <div className="flex gap-5 text-xs text-white/20">
              <Link href="/legal/privacy" className="hover:text-white/50 transition-colors">Confidentialité</Link>
              <Link href="/legal/cgu" className="hover:text-white/50 transition-colors">Conditions d&apos;utilisation</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
