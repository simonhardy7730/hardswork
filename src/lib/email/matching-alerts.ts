import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { layout, li, esc, orgRecipients } from "@/lib/email/subscription";
import { getOrgAccess } from "@/lib/billing/access";
import { poolEnabled } from "@/lib/candidate/pool";
import { citiesWithin } from "@/lib/geo/distance";

/**
 * Alerte hebdomadaire (lundi) : pour chaque organisation avec accès (essai/abonnement), nombre de profils
 * de la candidathèque qui correspondent à ses offres actives (même métier, dans 25 km). Aucune coordonnée
 * n'est envoyée ; règles simples et explicables, sans IA. Inactive tant que la candidathèque est fermée.
 */
export async function runMatchingAlerts(db: SupabaseClient, now: Date = new Date()): Promise<{ orgs: number; errors: number; skipped?: string }> {
  const out = { orgs: 0, errors: 0 };
  if (!poolEnabled()) return { ...out, skipped: "pool_closed" };
  if (now.getUTCDay() !== 1) return { ...out, skipped: "not_monday" };

  const { data: offers, error } = await db
    .from("job_offers").select("id, title, sector, city, organization_id").eq("status", "active").limit(500);
  if (error || !offers) return { ...out, errors: 1 };
  const byOrg = new Map<string, typeof offers>();
  for (const o of offers) byOrg.set(o.organization_id as string, [...(byOrg.get(o.organization_id as string) ?? []), o]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  const consentFrom = new Date(now.getTime() - 24 * 30 * 86400000).toISOString();
  const adultBefore = new Date(Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);

  for (const [orgId, list] of byOrg) {
    try {
      const { hasAccess } = await getOrgAccess(db, orgId, now);
      if (!hasAccess) continue;
      const lines: string[] = [];
      for (const o of list.slice(0, 5)) {
        const cities = citiesWithin(String(o.city ?? ""), 25)?.names ?? (o.city ? [String(o.city)] : []);
        if (cities.length === 0) continue;
        const { count } = await db
          .from("candidates")
          .select("id", { count: "exact", head: true })
          .eq("visible_to_recruiters", true).eq("status", "actif")
          .gt("visibility_consent_at", consentFrom)
          .lte("birth_date", adultBefore)
          .contains("sectors", [o.sector as string])
          .in("city", cities);
        if ((count ?? 0) > 0) lines.push(`<strong>${esc(String(o.title))}</strong> : ${count} profil${(count ?? 0) > 1 ? "s" : ""} correspondant${(count ?? 0) > 1 ? "s" : ""} près de ${esc(String(o.city))}`);
      }
      if (lines.length === 0) continue;
      const to = await orgRecipients(db, orgId);
      if (to.length === 0) continue;
      const html = layout(
        "Des profils correspondent à vos offres",
        `<p>Cette semaine, la candidathèque Wolko contient des candidats visibles qui correspondent à vos offres (même métier, dans un rayon de 25 km) :</p>${li(lines)}<p style="font-size:12px;color:#6B6B60">Seuls les candidats ayant accepté d'être visibles des recruteurs apparaissent. Contactez-les uniquement pour une offre concrète.</p>`,
        { label: "Voir les profils", href: `${appUrl}/dashboard/candidatheque` },
      );
      const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject: "Des profils correspondent à vos offres", html });
      if (r.error) out.errors++; else out.orgs++;
    } catch (e) { console.error("matching alert", orgId, e); out.errors++; }
  }
  return out;
}
