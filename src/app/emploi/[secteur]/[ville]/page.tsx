import ProfileCta from "@/components/candidat/ProfileCta";
import Link from "next/link";
import { maskOrgs } from "@/lib/confidential";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n/server";
import { labels } from "@/lib/utils";
import { SiteNav } from "@/components/layout/SiteNav";
import { citiesWithin, safeIlikeValue } from "@/lib/geo/distance";
import { cityFromSlug, isSeoSector } from "@/lib/seo/emploi";
import { formatSalary } from "@/lib/salary";

export const revalidate = 3600;

async function load(secteur: string, ville: string) {
  const city = cityFromSlug(ville);
  if (!city || !isSeoSector(secteur)) return null;
  const supabase = await createClient();
  const names = (citiesWithin(city, 15)?.names ?? [city]).map(safeIlikeValue).filter(Boolean);
  const { data } = await supabase
    .from("job_offers")
    .select("id, title, city, contract_type, salary_min, salary_max, salary_period, show_salary, hide_company, organizations(name)")
    .eq("status", "active").eq("sector", secteur)
    .or(names.map((n) => `city.ilike.${n}`).join(","))
    .order("created_at", { ascending: false }).limit(30);
  return { city, offers: data ?? [] };
}

export async function generateMetadata(props: { params: Promise<{ secteur: string; ville: string }> }): Promise<Metadata> {
  const { secteur, ville } = await props.params;
  const res = await load(secteur, ville);
  if (!res) return {};
  const { lang } = await getDict();
  const sec = labels(lang).sector[secteur] ?? secteur;
  const title = lang === "nl" ? `Vacatures ${sec} in ${res.city} | Wolko` : `Emploi ${sec} à ${res.city} — offres | Wolko`;
  return {
    title,
    description: lang === "nl"
      ? `${res.offers.length} vacature(s) ${sec.toLowerCase()} in en rond ${res.city}. Solliciteer gratis in 2 minuten, zonder account.`
      : `${res.offers.length} offre(s) d'emploi ${sec.toLowerCase()} à ${res.city} et alentours. Postulez gratuitement en 2 minutes, sans compte.`,
    alternates: { canonical: `https://wolko.be/emploi/${secteur}/${ville}` },
    robots: res.offers.length === 0 ? { index: false, follow: true } : undefined, // jamais de page vide dans Google
  };
}

export default async function EmploiPage(props: { params: Promise<{ secteur: string; ville: string }> }) {
  const { secteur, ville } = await props.params;
  const res = await load(secteur, ville);
  if (!res) notFound();
  const { lang } = await getDict();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const LB = labels(lang);
  const sec = LB.sector[secteur] ?? secteur;

  return (
    <div className="min-h-screen bg-[#F4F1EC] font-body pb-20">
      <SiteNav />
      <div className="bg-[#101F43] pt-[60px]">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="font-display font-black text-white uppercase leading-none" style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", letterSpacing: "-0.02em" }}>
            {l("Emploi", "Vacatures")} {sec} <span className="text-brand">{l("à", "in")} {res.city}</span>
          </h1>
          <p className="text-white/60 text-sm mt-3 max-w-xl">
            {l(`Offres ${sec.toLowerCase()} à ${res.city} et dans un rayon de 15 km. Postulez en 2 minutes, sans compte, gratuitement.`,
               `${sec} vacatures in ${res.city} en binnen 15 km. Solliciteer in 2 minuten, zonder account, gratis.`)}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-3">
        {res.offers.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-2xl p-6">
            <p className="text-ink font-semibold">{l("Aucune offre pour le moment.", "Momenteel geen vacatures.")}</p>
            <p className="text-ink-500 text-sm mt-1">{l("Créez une alerte ou parcourez toutes les offres.", "Maak een alert of bekijk alle vacatures.")}</p>
            <Link href={`/jobs?secteur=${secteur}`} className="btn-brand inline-flex mt-4">{l("Voir toutes les offres", "Alle vacatures bekijken")}</Link>
          </div>
        ) : maskOrgs(res.offers, lang).map((o) => {
          const orgRaw = o.organizations as unknown as { name: string }[] | { name: string } | null;
          const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
          const salary = o.show_salary ? formatSalary(o.salary_min, o.salary_max, o.salary_period, lang) : null;
          return (
            <Link key={o.id} href={`/jobs/${o.id}`} className="block bg-white border border-ink-100 hover:border-brand rounded-2xl p-5 transition">
              <p className="font-display font-black text-ink uppercase text-base leading-tight">{o.title}</p>
              <p className="text-ink-500 text-sm mt-1">
                {[org?.name, o.city, LB.contract[o.contract_type as string] ?? o.contract_type, salary].filter(Boolean).join(" · ")}
              </p>
            </Link>
          );
        })}
      </div>
      <div className="mt-8"><ProfileCta lang={lang} compact /></div>
    </div>
  );
}
