import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getL } from "@/lib/i18n/server";
import { RADIUS_OPTIONS } from "@/lib/geo/distance";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getL();
  return {
    title: l("Trouvez un job près de chez vous", "Vind een job dicht bij huis"),
    description: l(
      "Inscription gratuite. Cherchez par ville et par distance, indiquez vos jours et horaires disponibles, postulez en ligne.",
      "Gratis inschrijven. Zoek op stad en afstand, geef je beschikbare dagen en uren aan en solliciteer online."
    ),
    alternates: { canonical: "https://wolko.be/candidats" },
  };
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"];
const SECTORS: [string, string, string][] = [
  ["construction", "Construction", "Bouw"], ["logistique", "Logistique", "Logistiek"], ["transport", "Transport", "Transport"],
  ["industrie", "Industrie", "Industrie"], ["medical", "Santé", "Zorg"], ["securite", "Sécurité", "Veiligheid"],
  ["nettoyage", "Nettoyage", "Schoonmaak"], ["autre", "Horeca", "Horeca"],
];

export default async function CandidatsLanding(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const l = await getL();

  // Source de la pub : reprise dans le lien d'inscription (aucun stockage sur l'appareil du visiteur).
  const carry = new URLSearchParams();
  for (const k of UTM_KEYS) {
    const v = sp[k];
    if (typeof v === "string" && v) carry.set(k, v.slice(0, 100));
  }
  const q = carry.toString();
  const signupHref = `/signup/candidat${q ? `?${q}` : ""}`;

  return (
    <div className="bg-surface font-body">
      <SiteNav />

      {/* Hero : la recherche par distance est le premier geste */}
      <section className="brand-on-dark bg-[#101F43] pt-[60px]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-14 lg:pt-20 lg:pb-20">
          <h1 className="font-display font-black text-white uppercase leading-[0.92] tracking-tight max-w-3xl"
            style={{ fontSize: "clamp(2.75rem, 8vw, 6rem)" }}>
            {l("Un job près de chez vous.", "Een job dicht bij huis.")}
          </h1>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xl mt-5">
            {l("Cherchez autour de votre ville, indiquez quand vous êtes disponible et postulez en ligne. C'est gratuit pour les candidats.",
               "Zoek rond je stad, geef aan wanneer je beschikbaar bent en solliciteer online. Gratis voor kandidaten.")}
          </p>

          <form action="/jobs" method="GET" className="mt-9 bg-brand rounded-2xl p-4 sm:p-5 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-[#101F43] font-display font-black text-xl sm:text-2xl leading-tight">
              <label htmlFor="lieu" className="shrink-0">{l("Je cherche à", "Ik zoek in")}</label>
              <input id="lieu" name="lieu" required autoComplete="address-level2"
                placeholder={l("Tournai, Mons, Liège…", "Gent, Brugge, Leuven…")}
                className="sm:flex-1 min-w-0 h-12 rounded-xl bg-white px-4 text-base font-body font-semibold placeholder:font-normal placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-[#101F43]" />
              <label htmlFor="rayon" className="shrink-0">{l("dans un rayon de", "binnen")}</label>
              <select id="rayon" name="rayon" defaultValue="25"
                className="h-12 rounded-xl bg-white px-3 text-base font-body font-semibold focus:outline-none focus:ring-2 focus:ring-[#101F43]">
                {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            </div>
            <button type="submit"
              className="mt-4 w-full sm:w-auto h-12 px-7 bg-[#101F43] font-display font-black uppercase text-sm rounded-xl hover:bg-[#1C3058] transition-colors"
              style={{ letterSpacing: "0.05em", color: "#FFFFFF" }}>
              {l("Voir les offres", "Bekijk de vacatures")}
            </button>
          </form>

          <p className="text-white/70 text-sm mt-5">
            {l("Envie de recevoir un contact plus vite ?", "Sneller gecontacteerd worden?")}{" "}
            <Link href={signupHref} className="text-brand font-bold underline underline-offset-4 hover:text-white">
              {l("Créez votre profil gratuit", "Maak je gratis profiel aan")}
            </Link>
          </p>
        </div>
      </section>

      {/* Ce que le profil permet, uniquement des fonctions qui existent */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
        <h2 className="font-display font-black text-ink uppercase leading-[0.95] text-3xl sm:text-5xl max-w-2xl">
          {l("Un profil, puis vous postulez en quelques clics.", "Eén profiel, daarna solliciteer je in een paar klikken.")}
        </h2>
        <div className="grid md:grid-cols-3 gap-x-10 gap-y-8 mt-10">
          {[
            { Icon: MapPin, t: l("Choisissez votre zone", "Kies je regio"),
              d: l("Filtrez par ville et par distance : 10, 25, 50 ou 100 km.", "Filter op stad en afstand: 10, 25, 50 of 100 km.") },
            { Icon: CalendarDays, t: l("Indiquez vos disponibilités", "Geef je beschikbaarheid aan"),
              d: l("Jours, horaires, étudiant ou flexi-job : les offres affichées correspondent à votre planning.", "Dagen, uren, student of flexi-job: de vacatures passen bij je planning.") },
            { Icon: ShieldCheck, t: l("Vos données restent à vous", "Je gegevens blijven van jou"),
              d: l("Seuls les recruteurs auxquels vous postulez voient votre profil. Export et suppression en un clic.", "Alleen werkgevers bij wie je solliciteert zien je profiel. Exporteren en verwijderen met één klik.") },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="border-t-2 border-ink pt-4">
              <Icon size={22} className="text-ink mb-3" aria-hidden />
              <h3 className="font-display font-black text-ink text-xl leading-tight">{t}</h3>
              <p className="text-ink-500 text-[15px] leading-relaxed mt-1.5">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Secteurs */}
      <section className="bg-surface-2">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="font-display font-black text-ink uppercase text-2xl sm:text-3xl">{l("Parcourir par métier", "Bladeren per beroep")}</h2>
          <div className="flex flex-wrap gap-2.5 mt-5">
            {SECTORS.map(([key, fr, nl]) => (
              <Link key={key} href={`/jobs?secteur=${key}`}
                className="px-4 h-11 inline-flex items-center rounded-full bg-white border border-ink-100 text-ink font-semibold text-sm hover:border-ink transition-colors">
                {l(fr, nl)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Appel final */}
      <section className="brand-on-dark bg-[#101F43]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <h2 className="font-display font-black text-white uppercase leading-[0.95] text-3xl sm:text-4xl max-w-lg">
            {l("Créez votre profil, c'est gratuit.", "Maak je profiel aan, het is gratis.")}
          </h2>
          <Link href={signupHref} className="btn-brand justify-center shrink-0">
            {l("Créer mon profil", "Mijn profiel aanmaken")} <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
