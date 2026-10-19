import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://wolko.be";
  const pages: MetadataRoute.Sitemap = ["", "/jobs", "/candidats", "/recrute", "/tarifs", "/a-propos", "/legal/cgu", "/legal/privacy"]
    .map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return pages;
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase.from("job_offers").select("id, created_at").eq("status", "active").limit(1000);
    for (const o of data ?? []) {
      pages.push({ url: `${base}/jobs/${o.id}`, lastModified: o.created_at, changeFrequency: "daily", priority: 0.6 });
    }
  } catch { /* le plan du site reste valide sans les offres */ }
  return pages;
}
