import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Search, ArrowRight, Bell, ChevronRight } from "lucide-react";
import { labels } from "@/lib/utils";
import { getDict } from "@/lib/i18n/server";
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
  lieu?: string;
  q?: string; secteur?: string; region?: string; contrat?: string;
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const { lang } = getDict();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const LB = labels(lang);
  const CONTRACT_LABELS = LB.contract;
  const numLocale = lang === "nl" ? "nl-BE" : "fr-BE";
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
  // Ville ou code postal : les offres n'ont pas (encore) de code postal, on filtre donc sur la ville uniquement.
  const lieu = (searchParams.lieu ?? "").replace(/[%,()]/g, "").trim();
  if (lieu && !/^\d+$/.test(lieu)) query = query.ilike("city", `%${lieu}%`);

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

  const hasFilters = searchParams.secteur || searchParams.region || searchParams.q || lieu;

  return (
    <div className="min-h-screen bg-[#F4F1EC] font-body pb-20">
      <SiteNav />

      {/* ══ HERO SOMBRE ════════════════════════════════════ */}
      <div className="bg-[#101F43] pt-[60px]">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">

          {/* Headline */}
          <h1
            className="font-display font-black text-white uppercase leading-none mb-6"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}
          >
            {l("Votre prochain job est", "Je volgende job is")}{" "}
            <span className="text-brand">{l("[ici].", "[hier].")}</span>
          </h1>

          {/* Barre de recherche */}
          <form method="GET" className="flex gap-2 mb-5 flex-wrap sm:flex-nowrap">
            {/* Mots-clés */}
            <div className="flex items-center gap-2.5 bg-white border border-white/10 rounded-xl px-4 h-12 flex-1 min-w-0">
              <Search size={14} className="text-ink-300 shrink-0" />
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder={l("Mots-clés, chauffeur SPL, soudeur...", "Trefwoorden, vrachtwagenchauffeur, lasser...")}
                className="bg-transparent text-ink placeholder-ink-300 text-sm flex-1 focus:outline-none"
              />
            </div>
            {/* Secteur */}
            <select
              name="secteur"
              defaultValue={searchParams.secteur ?? ""}
              className="bg-white border border-white/10 text-ink text-sm px-4 h-12 rounded-xl focus:outline-none appearance-none cursor-pointer min-w-[130px]"
            >
              <option value="">{l("Secteur", "Sector")}</option>
              {SECTOR_CHIPS.map(({ key, label }) => (
                <option key={key} value={key}>{key === "autre" ? l(label, "Horeca / Andere") : LB.sector[key] ?? label}</option>
              ))}
            </select>
            {/* Lieu : ville ou code postal */}
            <div className="flex items-center gap-2 bg-white border border-white/10 rounded-xl px-4 h-12 min-w-[170px]">
              <MapPin size={13} className="text-ink-300 shrink-0" />
              <input
                name="lieu"
                defaultValue={searchParams.lieu ?? ""}
                placeholder={l("Ville ou code postal", "Stad of postcode")}
                autoComplete="address-level2"
                className="bg-transparent text-ink placeholder-ink-300 text-sm flex-1 min-w-0 focus:outline-none"
              />
            </div>
            {/* Bouton */}
            <button
              type="submit"
              className="h-12 px-7 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm rounded-xl transition-colors shrink-0"
              style={{ letterSpacing: "0.05em" }}
            >
              {l("Rechercher", "Zoeken")}
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
              {l("Tous secteurs", "Alle sectoren")}
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
                {key === "autre" ? l(label, "Horeca / Andere") : LB.sector[key] ?? label}
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
                <span className="font-black text-ink">{offers.length}</span> {lang === "nl" ? (offers.length !== 1 ? "vacatures" : "vacature") : `offre${offers.length !== 1 ? "s" : ""}`}
                {hasFilters && <span className="text-ink-300"> · {l("filtres actifs", "actieve filters")}</span>}
              </p>
              {hasFilters && (
                <Link href="/jobs" className="text-[11px] text-brand hover:underline font-bold">
                  {l("Effacer les filtres", "Filters wissen")}
                </Link>
              )}
            </div>

            {/* Empty state */}
            {offers.length === 0 && (
              <div className="bg-white rounded-2xl border border-ink-100 py-16 text-center">
                <HardieIcon size={80} />
                <p className="font-display font-black text-ink text-xl mt-4 mb-2">
                  {l("Aucune offre trouvée", "Geen vacatures gevonden")}
                </p>
                <p className="text-sm text-ink-500 mb-5">
                  {l("Essayez d'autres critères ou élargissez votre recherche.", "Probeer andere criteria of verruim je zoekopdracht.")}
                </p>
                <Link href="/jobs" className="bg-brand text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors inline-flex items-center gap-2">
                  {l("Voir toutes les offres", "Bekijk alle vacatures")} <ArrowRight size={14} />
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
                      : `${offer.salary_min?.toLocaleString(numLocale)}–${offer.salary_max?.toLocaleString(numLocale)}€/${l("mois", "maand")}`
                    : l("Salaire : Compétitif", "Loon: Competitief");

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
                              {l("Urgent", "Dringend")}
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
                            {l("Salaire", "Loon")} : {offer.show_salary && offer.salary_min ? salary : l("Compétitif", "Competitief")}
                          </span>
                          {offer.city && (
                            <span className="flex items-center gap-1 text-[11px] bg-ink-100 text-ink-600 font-bold px-2 py-0.5 rounded">
                              <MapPin size={9} />
                              {l("Lieu", "Plaats")} : {offer.city}
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
                          {l("Postuler", "Solliciteren")}
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
                    {l("Offres Premium", "Premium vacatures")}
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
                              {p.salary_period === "heure" ? `${p.salary_min}–${p.salary_max}€/h` : l("Salaire compétitif", "Competitief loon")}
                            </p>
                          ) : (
                            <p className="text-[10px] text-ink-300 mt-0.5">{l("Salaire : Compétitif", "Loon: Competitief")}</p>
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
                  alt={l("Travailleur", "Werknemer")}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101F43]/80 to-transparent" />
              </div>
              <div className="bg-white p-4 text-center">
                <p className="font-display font-black text-ink uppercase text-sm leading-tight mb-1">
                  {l("Nous recherchons les meilleures offres pour vous.", "Wij zoeken de beste vacatures voor jou.")}
                </p>
                <p className="text-[11px] text-ink-500 mb-4">
                  {l("Recevez les nouvelles offres qui correspondent à votre profil.", "Ontvang nieuwe vacatures die bij je profiel passen.")}
                </p>
                <Link
                  href="/signup/candidat"
                  className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-[12px] py-2.5 rounded-xl transition-colors w-full"
                  style={{ letterSpacing: "0.04em" }}
                >
                  <Bell size={12} />
                  {l("Créer une alerte email", "E-mailalert aanmaken")}
                </Link>
              </div>
            </div>

            {/* CTA Recruteur sidebar */}
            <div className="bg-[#101F43] rounded-2xl p-5">
              <p className="font-display font-black text-white uppercase text-sm leading-tight mb-1">
                {l("Vous recrutez ?", "Werf je aan?")}
              </p>
              <p className="text-white/40 text-[11px] mb-4 leading-relaxed">
                {l("Publiez votre offre en 2 minutes.", "Plaats je vacature in 2 minuten.")}<br />
                {l("Les candidats viennent à vous.", "De kandidaten komen naar jou.")}
              </p>
              <Link
                href="/recrute"
                className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-[12px] py-2.5 rounded-xl transition-colors w-full"
                style={{ letterSpacing: "0.04em" }}
              >
                {l("Publier une offre", "Plaats een vacature")}
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BARRE STICKY BAS ════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#101F43]/95 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div>
            <p className="font-display font-black text-white uppercase text-sm leading-none">
              {l("Vous recrutez ? Publiez votre offre en 2 minutes.", "Werf je aan? Plaats je vacature in 2 minuten.")}
            </p>
            <p className="text-white/45 text-xs mt-0.5">
              {l("Les candidats viennent à vous.", "De kandidaten komen naar jou.")}
            </p>
          </div>
          <Link
            href="/recrute"
            className="bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm px-6 py-2.5 rounded-xl transition-colors shrink-0"
            style={{ letterSpacing: "0.04em" }}
          >
            {l("Publier une offre", "Plaats een vacature")}
          </Link>
        </div>
      </div>
    </div>
  );
}
