import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Search, ArrowRight, Bell, ChevronRight } from "lucide-react";
import { CONTRACT_LABELS, SECTOR_LABELS, REGION_LABELS } from "@/lib/utils";
import { HardieIcon } from "@/components/ui/HardieIcon";
import { SiteNav } from "@/components/layout/SiteNav";

/* ── Photos miniatures par secteur ─────────────────────── */
const SECTOR_PHOTOS: Record<string, string> = {
  logistique:   "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=70",
  transport:    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200&auto=format&fit=crop&q=70",
  industrie:    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&auto=format&fit=crop&q=70",
  construction: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&auto=format&fit=crop&q=70",
  medical:      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&auto=format&fit=crop&q=70",
  securite:     "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=200&auto=format&fit=crop&q=70",
  nettoyage:    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&auto=format&fit=crop&q=70",
  autre:        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&auto=format&fit=crop&q=70",
};

/* ── Filtres chips ─────────────────────────────────────── */
const SECTOR_CHIPS = [
  { key: "construction", label: "Construction" },
  { key: "logistique",   label: "Logistique"   },
  { key: "transport",    label: "Transport"     },
  { key: "medical",      label: "Médical"       },
  { key: "industrie",    label: "Industrie"     },
  { key: "securite",     label: "Sécurité"      },
  { key: "nettoyage",    label: "Nettoyage"     },
  { key: "autre",        label: "Horeca / Autre"},
];

interface SearchParams {
  q?: string; secteur?: string; region?: string; contrat?: string;
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();

  /* ── Requête offres principales ─────────────────────── */
  let query = supabase
    .from("job_offers")
    .select("*, organizations(name, logo_url, primary_color)")
    .eq("status", "active")
    .order("is_urgent", { ascending: false })
    .order("created_at",  { ascending: false })
    .limit(50);

  if (searchParams.secteur) query = query.eq("sector",        searchParams.secteur);
  if (searchParams.region)  query = query.eq("region",        searchParams.region);
  if (searchParams.contrat) query = query.eq("contract_type", searchParams.contrat);
  if (searchParams.q)       query = query.ilike("title",      `%${searchParams.q}%`);

  const { data: offersRaw } = await query;
  const offers = offersRaw ?? [];

  /* ── Offres premium (urgentes ou récentes) pour sidebar ─ */
  const { data: premiumRaw } = await supabase
    .from("job_offers")
    .select("id, title, sector, city, contract_type, salary_min, salary_max, salary_period, show_salary, organizations(name)")
    .eq("status", "active")
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);
  const premium = premiumRaw ?? [];

  /* ── Total ──────────────────────────────────────────── */
  const { count: total } = await supabase
    .from("job_offers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const hasFilters = searchParams.secteur || searchParams.region || searchParams.q;

  return (
    <div className="min-h-screen bg-[#F4F1EC] font-body pb-20">
      <SiteNav />

      {/* ══ HERO SOMBRE ════════════════════════════════════ */}
      <div className="bg-[#0F0E0D] pt-[60px]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">

          {/* Headline */}
          <h1
            className="font-display font-black text-white uppercase leading-none mb-6"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}
          >
            Votre prochain job est{" "}
            <span className="text-brand">[ici].</span>
          </h1>

          {/* Barre de recherche */}
          <form method="GET" className="flex gap-2 mb-5 flex-wrap sm:flex-nowrap">
            {/* Mots-clés */}
            <div className="flex items-center gap-2.5 bg-white border border-white/10 rounded-xl px-4 h-12 flex-1 min-w-0">
              <Search size={14} className="text-ink-300 shrink-0" />
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder="Mots-clés, chauffeur SPL, soudeur..."
                className="bg-transparent text-ink placeholder-ink-300 text-sm flex-1 focus:outline-none"
              />
            </div>
            {/* Secteur */}
            <select
              name="secteur"
              defaultValue={searchParams.secteur ?? ""}
              className="bg-white border border-white/10 text-ink text-sm px-4 h-12 rounded-xl focus:outline-none appearance-none cursor-pointer min-w-[130px]"
            >
              <option value="">Secteur</option>
              {SECTOR_CHIPS.map(({ key, label }) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {/* Lieu */}
            <div className="flex items-center gap-2 bg-white border border-white/10 rounded-xl px-4 h-12 min-w-[120px]">
              <MapPin size={13} className="text-ink-300 shrink-0" />
              <select
                name="region"
                defaultValue={searchParams.region ?? ""}
                className="bg-transparent text-ink text-sm focus:outline-none appearance-none cursor-pointer flex-1"
              >
                <option value="">Lieu</option>
                {Object.entries(REGION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {/* Bouton */}
            <button
              type="submit"
              className="h-12 px-7 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm rounded-xl transition-colors shrink-0"
              style={{ letterSpacing: "0.05em" }}
            >
              Rechercher
            </button>
          </form>

          {/* Chips secteurs */}
          <div className="flex items-center gap-2 flex-wrap pb-5">
            <Link
              href="/jobs"
              className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all ${
                !searchParams.secteur
                  ? "bg-white text-ink"
                  : "border border-white/20 text-white/60 hover:text-white hover:border-white/40"
              }`}
            >
              Tous secteurs
            </Link>
            {SECTOR_CHIPS.map(({ key, label }) => (
              <Link
                key={key}
                href={`/jobs?secteur=${key}${searchParams.q ? `&q=${searchParams.q}` : ""}`}
                className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all ${
                  searchParams.secteur === key
                    ? "bg-brand text-white"
                    : "border border-white/20 text-white/60 hover:text-white hover:border-white/40"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══ CONTENU PRINCIPAL ══════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">

          {/* ── COLONNE GAUCHE : liste offres ──────────────── */}
          <div>
            {/* Compteur + filtres actifs */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm text-ink-500">
                <span className="font-black text-ink">{offers.length}</span> offre{offers.length !== 1 ? "s" : ""}
                {hasFilters && <span className="text-ink-300"> · filtres actifs</span>}
              </p>
              {hasFilters && (
                <Link href="/jobs" className="text-[11px] text-brand hover:underline font-bold">
                  Effacer les filtres
                </Link>
              )}
            </div>

            {/* Empty state */}
            {offers.length === 0 && (
              <div className="bg-white rounded-2xl border border-ink-100 py-16 text-center">
                <HardieIcon size={80} />
                <p className="font-display font-black text-ink text-xl mt-4 mb-2">
                  Aucune offre trouvée
                </p>
                <p className="text-sm text-ink-500 mb-5">
                  Essayez d&apos;autres critères ou élargissez votre recherche.
                </p>
                <Link href="/jobs" className="bg-brand text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors inline-flex items-center gap-2">
                  Voir toutes les offres <ArrowRight size={14} />
                </Link>
              </div>
            )}

            {/* Liste des offres */}
            {offers.length > 0 && (
              <div className="space-y-2">
                {offers.map((offer) => {
                  const orgArr = offer.organizations as { name: string; logo_url: string | null; primary_color: string | null }[] | null;
                  const org = Array.isArray(orgArr) ? orgArr[0] ?? null : orgArr;
                  const salary = offer.show_salary && offer.salary_min
                    ? offer.salary_period === "heure"
                      ? `${offer.salary_min}–${offer.salary_max}€/h`
                      : `${offer.salary_min?.toLocaleString("fr-BE")}–${offer.salary_max?.toLocaleString("fr-BE")}€/mois`
                    : "Salaire : Compétitif";

                  const sectorPhoto = SECTOR_PHOTOS[offer.sector] ?? SECTOR_PHOTOS.autre;

                  return (
                    <div
                      key={offer.id}
                      className={`bg-white rounded-xl border flex items-center gap-4 px-4 py-3 transition-all hover:shadow-md hover:border-brand/20 group ${
                        offer.is_urgent ? "border-brand/40" : "border-ink-100"
                      }`}
                    >
                      {/* Photo miniature secteur */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sectorPhoto}
                          alt={offer.sector}
                          className="w-full h-full object-cover"
                          style={{ filter: "brightness(0.85) saturate(0.9)" }}
                        />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {offer.is_urgent && (
                            <span className="text-[9px] font-black text-white bg-brand px-1.5 py-0.5 rounded uppercase tracking-wide">
                              Urgent
                            </span>
                          )}
                          <h2 className="font-display font-black text-ink uppercase text-sm tracking-tight group-hover:text-brand transition-colors">
                            {offer.title}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] bg-ink-100 text-ink-600 font-bold px-2 py-0.5 rounded">
                            {CONTRACT_LABELS[offer.contract_type] ?? offer.contract_type}
                          </span>
                          <span className="text-[11px] bg-ink-100 text-ink-600 font-bold px-2 py-0.5 rounded">
                            Salaire : {offer.show_salary && offer.salary_min ? salary : "Compétitif"}
                          </span>
                          {offer.city && (
                            <span className="flex items-center gap-1 text-[11px] bg-ink-100 text-ink-600 font-bold px-2 py-0.5 rounded">
                              <MapPin size={9} />
                              Lieu : {offer.city}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CTA Postuler — toujours visible */}
                      <div className="shrink-0">
                        <Link
                          href={`/postuler/${offer.id}`}
                          className="bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-[11px] px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                          style={{ letterSpacing: "0.05em" }}
                        >
                          Postuler
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* ── COLONNE DROITE : sidebar ───────────────────── */}
          <div className="space-y-4">

            {/* Offres Premium */}
            {premium.length > 0 && (
              <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-ink-100">
                  <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
                    Offres Premium
                  </p>
                </div>
                <div className="divide-y divide-ink-100">
                  {premium.map((p) => {
                    const pOrgArr = p.organizations as unknown as { name: string }[] | { name: string } | null;
                    const pOrg = Array.isArray(pOrgArr) ? (pOrgArr[0] ?? null) : pOrgArr;
                    const sectorPhoto = SECTOR_PHOTOS[p.sector] ?? SECTOR_PHOTOS.autre;
                    return (
                      <Link
                        key={p.id}
                        href={`/jobs/${p.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors group"
                      >
                        {/* Miniature */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sectorPhoto} alt={p.sector}
                            className="w-full h-full object-cover"
                            style={{ filter: "brightness(0.8)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-black text-ink text-[12px] uppercase leading-tight group-hover:text-brand transition-colors truncate">
                            {p.title}
                          </p>
                          {p.show_salary && p.salary_min ? (
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                              {p.salary_period === "heure" ? `${p.salary_min}–${p.salary_max}€/h` : "Salaire compétitif"}
                            </p>
                          ) : (
                            <p className="text-[10px] text-ink-300 mt-0.5">Salaire : Compétitif</p>
                          )}
                          <span className="inline-block text-[9px] font-black bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full uppercase mt-1">
                            {CONTRACT_LABELS[p.contract_type] ?? p.contract_type}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alerte email avec photo */}
            <div className="rounded-2xl border border-ink-100 overflow-hidden">
              {/* Photo worker */}
              <div className="h-36 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80"
                  alt="Travailleur"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0D]/80 to-transparent" />
              </div>
              <div className="bg-white p-4 text-center">
                <p className="font-display font-black text-ink uppercase text-sm leading-tight mb-1">
                  Nous recherchons les meilleures offres pour vous.
                </p>
                <p className="text-[11px] text-ink-500 mb-4">
                  Recevez les nouvelles offres qui correspondent à votre profil.
                </p>
                <Link
                  href="/signup/candidat"
                  className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-[12px] py-2.5 rounded-xl transition-colors w-full"
                  style={{ letterSpacing: "0.04em" }}
                >
                  <Bell size={12} />
                  Créer une alerte email
                </Link>
              </div>
            </div>

            {/* CTA Recruteur sidebar */}
            <div className="bg-[#0F0E0D] rounded-2xl p-5">
              <p className="font-display font-black text-white uppercase text-sm leading-tight mb-1">
                Vous recrutez ?
              </p>
              <p className="text-white/40 text-[11px] mb-4 leading-relaxed">
                Publiez votre offre en 2 minutes.<br />
                Les candidats viennent à vous.
              </p>
              <Link
                href="/recrute"
                className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-[12px] py-2.5 rounded-xl transition-colors w-full"
                style={{ letterSpacing: "0.04em" }}
              >
                Publier une offre
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BARRE STICKY BAS ════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F0E0D]/95 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div>
            <p className="font-display font-black text-white uppercase text-sm leading-none">
              Vous recrutez ? Publiez votre offre en 2 minutes.
            </p>
            <p className="text-white/45 text-xs mt-0.5">
              Les candidats viennent à vous.
            </p>
          </div>
          <Link
            href="/recrute"
            className="bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm px-6 py-2.5 rounded-xl transition-colors shrink-0"
            style={{ letterSpacing: "0.04em" }}
          >
            Publier une offre
          </Link>
        </div>
      </div>
    </div>
  );
}
