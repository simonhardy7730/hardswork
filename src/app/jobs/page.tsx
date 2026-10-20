import ProfileCta from "@/components/candidat/ProfileCta";
import { contractLabel } from "@/lib/contract-label";
import { createClient } from "@/lib/supabase/server";
import { maskOrgs } from "@/lib/confidential";
import Link from "next/link";
import { MapPin, Search, ArrowRight, Bell } from "lucide-react";
import { labels } from "@/lib/utils";
import { getDict } from "@/lib/i18n/server";
import { HardieIcon } from "@/components/ui/HardieIcon";
import { SiteNav } from "@/components/layout/SiteNav";
import { formatSalary } from "@/lib/salary";
import { keywordGroups } from "@/lib/search/keywords";
import { SECTOR_PHOTOS } from "@/lib/sector-photos";
import { RADIUS_OPTIONS, citiesWithin, safeIlikeValue } from "@/lib/geo/distance";


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
  q?: string; rayon?: string; secteur?: string; region?: string; contrat?: string;
  jour?: string; horaire?: string; rec?: string; debut?: string; salaire?: string;
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "holiday"];
const SLOT_KEYS = ["morning", "afternoon", "evening", "night"];

export default async function JobsPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const { lang } = await getDict();
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
  if (searchParams.contrat === "classique") query = query.in("contract_type", ["cdi", "cdd", "interim_cdi"]);
  else if (searchParams.contrat === "interim" || searchParams.contrat === "cdi") query = query.in("contract_type", [searchParams.contrat, "interim_cdi"]);
  else if (searchParams.contrat) query = query.eq("contract_type", searchParams.contrat);
  // Recherche par mots : chaque mot peut correspondre au titre, à la ville, à la description, au secteur ou au contrat.
  if (searchParams.q) for (const g of keywordGroups(searchParams.q)) query = query.or(g);
  // Ville ou code postal : les offres n'ont pas (encore) de code postal, on filtre donc sur la ville uniquement.
  const lieu = (searchParams.lieu ?? "").replace(/[%,()]/g, "").trim();
  // Rayon (km) autour d'une ville connue ; sinon, recherche exacte sur le nom de la ville.
  const rayon = RADIUS_OPTIONS.find((r) => String(r) === searchParams.rayon) ?? 0;
  const around = lieu && rayon ? citiesWithin(lieu, rayon) : null;
  if (around) {
    const names = around.names.map(safeIlikeValue).filter(Boolean);
    query = query.or(names.map((n) => `city.ilike.${n}`).join(","));
  } else if (lieu && !/^\d+$/.test(lieu)) query = query.ilike("city", `%${lieu}%`);
  const rayonUnknown = Boolean(lieu && rayon && !around);

  // Filtres de planning (migration 010). Valeurs validées par liste blanche.
  const jourList = (searchParams.jour ?? "").split(",").filter((d) => DAY_KEYS.includes(d));
  const horaireList = (searchParams.horaire ?? "").split(",").filter((s) => SLOT_KEYS.includes(s));
  const rec = searchParams.rec === "ponctuelle" || searchParams.rec === "recurrente" ? searchParams.rec : "";
  const debut = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.debut ?? "") ? (searchParams.debut as string) : "";
  const salaire = Number(searchParams.salaire);
  const hasPlanningFilter = jourList.length > 0 || horaireList.length > 0 || !!rec || !!debut || salaire > 0;
  let planned = query;
  if (jourList.length) planned = planned.overlaps("days_needed", jourList);
  if (horaireList.length) planned = planned.overlaps("time_slots", horaireList);
  if (rec) planned = planned.eq("recurrence", rec);
  // Date de début : missions qui commencent à cette date ou après (ou sans date précisée)
  if (debut) planned = planned.or(`work_date_from.gte.${debut},work_date_from.is.null`);
  if (salaire > 0) planned = planned.gte("salary_max", salaire);

  const { data: firstTry, error: offersErr } = await planned;
  let offersRaw = firstTry;
  // Colonnes de planning absentes (migration 010 non appliquée) : on retombe sur la recherche simple.
  if (offersErr && hasPlanningFilter) offersRaw = (await query).data;
  const offers = maskOrgs(offersRaw, lang);

  /* ── Offres premium (urgentes ou récentes) pour sidebar ─ */
  const { data: premiumRaw } = await supabase
    .from("job_offers")
    .select("id, title, sector, city, contract_type, salary_min, salary_max, salary_period, show_salary, hide_company, organizations(name)")
    .eq("status", "active")
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);
  const premium = maskOrgs(premiumRaw, lang);

  const hasFilters = searchParams.secteur || searchParams.region || searchParams.q || searchParams.contrat || lieu || hasPlanningFilter;

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
            {searchParams.contrat && <input type="hidden" name="contrat" value={searchParams.contrat} />}
            {/* Mots-clés */}
            <div className="flex items-center gap-2.5 bg-white border border-white/10 rounded-xl px-4 h-12 flex-1 min-w-0">
              <Search size={14} className="text-ink-300 shrink-0" />
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder={l("Métier, ville, mot-clé… (ex. cariste Tournai)", "Beroep, stad, trefwoord… (bv. heftruck Doornik)")}
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
            <select name="rayon" defaultValue={searchParams.rayon ?? ""} aria-label={l("Rayon", "Straal")}
              className="bg-white text-ink text-sm px-3 h-12 rounded-xl focus:outline-none">
              <option value="">{l("Distance", "Afstand")}</option>
              {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{`+${r} km`}</option>)}
            </select>
            {/* Bouton */}
            <button
              type="submit"
              className="h-12 px-7 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase text-sm rounded-xl transition-colors shrink-0"
              style={{ letterSpacing: "0.05em" }}
            >
              {l("Rechercher", "Zoeken")}
            </button>
          </form>

          {/* Chips type d'emploi */}
          <div className="flex items-center gap-2 flex-wrap pb-3" aria-label={l("Type d'emploi", "Soort job")}>
            {[
              { key: "",          fr: "Tous les types",  nl: "Alle types" },
              { key: "classique", fr: "Emploi classique", nl: "Klassieke job" },
              { key: "interim",   fr: "Intérim",          nl: "Interim" },
              { key: "etudiant",  fr: "Job étudiant",     nl: "Studentenjob" },
              { key: "flexi",     fr: "Flexi-job",        nl: "Flexi-job" },
              { key: "stage",     fr: "Stage",            nl: "Stage" },
            ].map(({ key, fr, nl }) => {
              const params = new URLSearchParams();
              if (key) params.set("contrat", key);
              if (searchParams.secteur) params.set("secteur", searchParams.secteur);
              if (searchParams.q) params.set("q", searchParams.q);
              if (lieu) params.set("lieu", lieu);
              if (rayon) params.set("rayon", String(rayon));
              const qs = params.toString();
              const active = (searchParams.contrat ?? "") === key;
              return (
                <Link
                  key={key || "all"}
                  href={qs ? `/jobs?${qs}` : "/jobs"}
                  className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full transition-all ${
                    active
                      ? "bg-brand text-white"
                      : "border border-white/20 text-white/60 hover:text-white hover:border-white/40"
                  }`}
                >
                  {l(fr, nl)}
                </Link>
              );
            })}
          </div>

          {/* Raccourcis + filtres de planning */}
          <div className="flex items-center gap-2 flex-wrap pb-3" aria-label={l("Raccourcis", "Snelkoppelingen")}>
            {[
              { fr: "Je cherche un job ce week-end", nl: "Ik zoek een job dit weekend", p: { jour: "sat,sun" } as Record<string, string> },
              { fr: "Je cherche un job après les cours", nl: "Ik zoek een job na school", p: { contrat: "etudiant", horaire: "afternoon,evening" } as Record<string, string> },
              { fr: "Je cherche un flexi-job en soirée", nl: "Ik zoek een flexi-job in de avond", p: { contrat: "flexi", horaire: "evening" } as Record<string, string> },
            ].map(({ fr, nl, p }) => (
              <Link key={fr} href={`/jobs?${new URLSearchParams(p).toString()}`}
                className="text-[12px] font-bold px-3.5 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all">
                {l(fr, nl)}
              </Link>
            ))}
          </div>
          <form method="GET" className="flex items-center gap-2 flex-wrap pb-4">
            {searchParams.contrat && <input type="hidden" name="contrat" value={searchParams.contrat} />}
            {searchParams.secteur && <input type="hidden" name="secteur" value={searchParams.secteur} />}
            {searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}
            {lieu && <input type="hidden" name="lieu" value={lieu} />}
            {rayon ? <input type="hidden" name="rayon" value={rayon} /> : null}
            <select name="jour" defaultValue={jourList.length === 1 ? jourList[0] : ""} aria-label={l("Jour", "Dag")}
              className="bg-white text-ink text-xs px-3 h-9 rounded-lg focus:outline-none">
              <option value="">{l("Jour de la semaine", "Dag van de week")}</option>
              {[["mon","Lundi","Maandag"],["tue","Mardi","Dinsdag"],["wed","Mercredi","Woensdag"],["thu","Jeudi","Donderdag"],["fri","Vendredi","Vrijdag"],["sat","Samedi","Zaterdag"],["sun","Dimanche","Zondag"],["holiday","Jours fériés","Feestdagen"]].map(([k, fr, nl]) => (
                <option key={k} value={k}>{l(fr, nl)}</option>
              ))}
            </select>
            <select name="horaire" defaultValue={horaireList.length === 1 ? horaireList[0] : ""} aria-label={l("Horaire", "Uurrooster")}
              className="bg-white text-ink text-xs px-3 h-9 rounded-lg focus:outline-none">
              <option value="">{l("Horaire", "Uurrooster")}</option>
              {[["morning","Matin","Voormiddag"],["afternoon","Après-midi","Namiddag"],["evening","Soirée","Avond"],["night","Nuit","Nacht"]].map(([k, fr, nl]) => (
                <option key={k} value={k}>{l(fr, nl)}</option>
              ))}
            </select>
            <select name="rec" defaultValue={rec} aria-label={l("Type de mission", "Soort opdracht")}
              className="bg-white text-ink text-xs px-3 h-9 rounded-lg focus:outline-none">
              <option value="">{l("Ponctuelle ou régulière", "Eenmalig of regelmatig")}</option>
              <option value="ponctuelle">{l("Mission ponctuelle", "Eenmalige opdracht")}</option>
              <option value="recurrente">{l("Mission régulière", "Regelmatige opdracht")}</option>
            </select>
            <input type="date" name="debut" defaultValue={debut} aria-label={l("Date de début", "Startdatum")}
              className="bg-white text-ink text-xs px-3 h-9 rounded-lg focus:outline-none" />
            <input type="number" name="salaire" min={0} step={1} inputMode="numeric" defaultValue={salaire > 0 ? salaire : ""}
              placeholder={l("Rémunération min. (€)", "Min. loon (€)")} aria-label={l("Rémunération minimale", "Minimumloon")}
              className="bg-white text-ink text-xs px-3 h-9 rounded-lg focus:outline-none w-[150px]" />
            <button type="submit" className="h-9 px-4 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-lg transition-colors">
              {l("Filtrer", "Filteren")}
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
                href={`/jobs?secteur=${key}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}${searchParams.contrat ? `&contrat=${searchParams.contrat}` : ""}`}
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
                {rayonUnknown && <span className="text-ink-300"> · {l("ville inconnue pour le calcul de distance : recherche exacte", "onbekende stad voor afstandsberekening: exacte zoekopdracht")}</span>}
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
                  const salary = (offer.show_salary ? formatSalary(offer.salary_min, offer.salary_max, offer.salary_period, lang) : null)
                    ?? l("Compétitif", "Competitief");

                  const sectorPhoto = SECTOR_PHOTOS[offer.sector] ?? SECTOR_PHOTOS.autre;

                  return (
                    <div
                      key={offer.id}
                      className={`relative bg-white rounded-xl border flex items-center gap-4 px-4 py-3 transition-all hover:shadow-md hover:border-brand/20 group ${
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
                            <Link href={`/jobs/${offer.id}`} className="after:absolute after:inset-0 after:content-['']">{offer.title}</Link>
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] bg-ink-100 text-ink-600 font-bold px-2 py-0.5 rounded">
                            {contractLabel(CONTRACT_LABELS, offer)}
                          </span>
                          <span className="text-[11px] bg-ink-100 text-ink-600 font-bold px-2 py-0.5 rounded">
                            {l("Salaire", "Loon")} : {salary}
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
                      <div className="shrink-0 relative z-10">
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

            {/* Pas d'offre qui correspond : dépôt de profil dans la candidathèque */}
            <div className="mt-6"><ProfileCta lang={lang} /></div>

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
                          {p.show_salary && formatSalary(p.salary_min, p.salary_max, p.salary_period, lang) ? (
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                              {formatSalary(p.salary_min, p.salary_max, p.salary_period, lang) ?? l("Salaire compétitif", "Competitief loon")}
                            </p>
                          ) : (
                            <p className="text-[10px] text-ink-300 mt-0.5">{l("Salaire : Compétitif", "Loon: Competitief")}</p>
                          )}
                          <span className="inline-block text-[9px] font-black bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full uppercase mt-1">
                            {contractLabel(CONTRACT_LABELS, p)}
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
