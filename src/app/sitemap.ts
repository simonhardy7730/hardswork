import type { MetadataRoute } from "next";
import { MAINTENANCE } from "@/lib/maintenance";
import { createClient } from "@supabase/supabase-js";
import { SEO_CITIES, SEO_SECTORS, citySlug } from "@/lib/seo/emploi";
import { citiesWithin } from "@/lib/geo/distance";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://wolko.be";
  if (MAINTENANCE) return [{ url: base, changeFrequency: "weekly", priority: 1 }];
  const pages: MetadataRoute.Sitemap = ["", "/jobs", "/candidats", "/recrute", "/recrute/deja-equipe", "/tarifs", "/ressources", "/ressources/baremes", "/ressources/baremes/cp-124-construction", "/ressources/baremes/cp-121-nettoyage", "/ressources/guides/job-etudiant", "/ressources/guides/flexi-job", "/ressources/guides/preavis", "/legal/cgu", "/legal/privacy"]
    .map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return pages;
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data: all } = await supabase.from("job_offers").select("id, created_at, updated_at, expires_at, sector, city").eq("status", "active").limit(1000);
    const nowIso = new Date().toISOString();
    const data = (all ?? []).filter((o) => !o.expires_at || (o.expires_at as string) > nowIso); // une offre expirée sort du plan du site
    // Pages « emploi métier × ville » : seulement celles qui ont au moins une offre.
    for (const sec of SEO_SECTORS) for (const city of SEO_CITIES) {
      const near = new Set((citiesWithin(city, 15)?.names ?? [city]).map((n) => n.toLowerCase()));
      if ((data ?? []).some((o) => o.sector === sec && near.has(String(o.city ?? "").toLowerCase()))) {
        pages.push({ url: `${base}/emploi/${sec}/${citySlug(city)}`, changeFrequency: "daily", priority: 0.8 });
      }
    }
    for (const o of data ?? []) {
      pages.push({ url: `${base}/jobs/${o.id}`, lastModified: o.updated_at ?? o.created_at, changeFrequency: "daily", priority: 0.6 });
    }
  } catch { /* le plan du site reste valide sans les offres */ }
  return pages;
}
