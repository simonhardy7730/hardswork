import { createClient } from "@supabase/supabase-js";
import { publicOrgName } from "@/lib/confidential";
import { SECTOR_LABELS } from "@/lib/utils";

export const revalidate = 3600;

const BASE = "https://wolko.be";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (s: string) => `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
const JOBTYPE: Record<string, string> = { cdi: "fulltime", cdd: "contract", interim: "temporary", interim_cdi: "fulltime", etudiant: "parttime", flexi: "parttime", stage: "internship", apprentissage: "apprenticeship" };

/** Flux XML des offres actives (format Indeed, repris aussi par Jooble, Adzuna, Optioncarriere…). Les offres confidentielles n'exposent jamais le nom de l'entreprise. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let items = "";
  if (url && key) {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("job_offers")
      .select("id, title, description, sector, city, postal_code, contract_type, created_at, salary_min, salary_max, salary_period, show_salary, hide_company, organizations(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1000);
    for (const o of data ?? []) {
      const orgRaw = o.organizations as unknown as { name?: string } | { name?: string }[] | null;
      const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
      const company = publicOrgName(o.hide_company, org?.name);
      const plain = String(o.description ?? "").replace(/<[^>]*>/g, " ").replace(/[ \t]+/g, " ").trim() || o.title;
      const unit = o.salary_period === "heure" ? "par heure" : o.salary_period === "jour" ? "par jour" : "par mois";
      const salary = o.show_salary && o.salary_min
        ? `${o.salary_min}${o.salary_max ? `-${o.salary_max}` : ""} € ${unit}` : "";
      items += `  <job>
    <title>${cdata(o.title)}</title>
    <date>${cdata(new Date(o.created_at).toUTCString())}</date>
    <referencenumber>${cdata(o.id)}</referencenumber>
    <url>${cdata(`${BASE}/jobs/${o.id}`)}</url>
    <company>${cdata(company)}</company>
    <city>${cdata(o.city ?? "")}</city>
    <country>BE</country>
    <postalcode>${cdata(o.postal_code ?? "")}</postalcode>
    <description>${cdata(plain)}</description>
${salary ? `    <salary>${cdata(salary)}</salary>\n` : ""}    <jobtype>${cdata(JOBTYPE[o.contract_type] ?? "fulltime")}</jobtype>
    <category>${cdata(SECTOR_LABELS[o.sector] ?? o.sector ?? "")}</category>
  </job>
`;
    }
  }
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<source>
  <publisher>Wolko</publisher>
  <publisherurl>${esc(BASE)}</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}</source>
`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, s-maxage=3600" } });
}
