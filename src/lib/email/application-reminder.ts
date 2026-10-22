import { sendBulk } from "@/lib/email/budget";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { layout, orgRecipients } from "@/lib/email/subscription";

/** Relance (1 e-mail par organisation et par passage) pour les candidatures « Nouveau » restées sans réponse depuis 5 jours. */
export async function runApplicationReminders(db: SupabaseClient): Promise<{ orgs: number; apps: number; errors: number }> {
  const out = { orgs: 0, apps: 0, errors: 0 };
  const cutoff = new Date(Date.now() - 5 * 86400000).toISOString();
  const since = new Date(Date.now() - 45 * 86400000).toISOString();
  const { data, error } = await db
    .from("applications")
    .select("id, job_offers!inner(title, organization_id, status)")
    .eq("status", "nouveau")
    .is("reminder_sent_at", null)
    .lt("applied_at", cutoff)
    .gte("applied_at", since)
    .eq("job_offers.status", "active")
    .limit(500);
  if (error) { console.error("application reminders:", error.message); return { ...out, errors: 1 }; } // migration 026 absente
  const byOrg = new Map<string, { ids: string[]; titles: Set<string> }>();
  for (const a of data ?? []) {
    const j = Array.isArray(a.job_offers) ? a.job_offers[0] : a.job_offers;
    if (!j) continue;
    const g = byOrg.get(j.organization_id as string) ?? { ids: [], titles: new Set<string>() };
    g.ids.push(a.id as string); g.titles.add(j.title as string);
    byOrg.set(j.organization_id as string, g);
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  for (const [orgId, g] of byOrg) {
    try {
      const to = await orgRecipients(db, orgId);
      if (to.length === 0) continue;
      const n = g.ids.length;
      const html = layout(
        `${n} candidature${n > 1 ? "s" : ""} attend${n > 1 ? "ent" : ""} votre réponse`,
        `<p>Des candidats ont postulé il y a plus de 5 jours sans réponse (${[...g.titles].slice(0, 3).map((t) => `<strong>${t.replace(/[<>&]/g, "")}</strong>`).join(", ")}).</p><p>Une réponse rapide, même négative, améliore votre image auprès des candidats : le délai de réponse est affiché sur vos offres.</p>`,
        { label: "Répondre aux candidats", href: `${appUrl}/dashboard/candidatures` },
      );
      const r = await sendBulk({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject: `${n} candidature${n > 1 ? "s" : ""} sans réponse depuis 5 jours`, html });
      if (r.error) { out.errors++; continue; }
      await db.from("applications").update({ reminder_sent_at: new Date().toISOString() }).in("id", g.ids);
      out.orgs++; out.apps += n;
    } catch (e) { console.error("reminder org", orgId, e); out.errors++; }
  }
  return out;
}
