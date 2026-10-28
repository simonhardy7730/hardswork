import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { layout, esc } from "@/lib/email/subscription";
import { publicOrgName } from "@/lib/confidential";
import { citiesWithin, normalizePlace } from "@/lib/geo/distance";
import { matchReasons, NEAR_KM, type OfferForMatch } from "@/lib/candidate/suggestions";

/**
 * Alerte IMMÉDIATE à la publication d'une offre : seuls les candidats qui ont activé les alertes ET dont le profil
 * correspond vraiment reçoivent le mail — métier ou secteur identique ET ville à moins de 15 km (règles explicables, sans IA).
 * Une offre n'est jamais envoyée deux fois à la même personne (table job_alert_log, migration 040 ; sans elle, rien ne part).
 * Plafond par offre (INSTANT_ALERT_CAP, 20 par défaut) pour rester dans la limite d'envoi gratuite de Resend.
 */
const CAP = Math.max(0, Number(process.env.INSTANT_ALERT_CAP ?? 20));

export async function runInstantAlertsForJob(db: SupabaseClient, jobId: string): Promise<{ sent: number; matched: number; skipped?: string }> {
  const out = { sent: 0, matched: 0 };
  const { data: job } = await db.from("job_offers")
    .select("id, title, sector, city, contract_type, status, hide_company, expires_at, created_at, organizations(name)").eq("id", jobId).maybeSingle();
  if (!job || job.status !== "active") return { ...out, skipped: "offer_inactive" };
  if (!job.city) return { ...out, skipped: "offer_without_city" };
  if (Date.now() - new Date(job.created_at as string).getTime() > 6 * 3600000) return { ...out, skipped: "offer_too_old" };

  const log = await db.from("job_alert_log").select("user_id", { count: "exact", head: true }).eq("job_id", jobId);
  if (log.error) return { ...out, skipped: "log_table_missing" };

  const { data: alerts } = await db.from("job_alerts").select("user_id, email, unsub_token").eq("active", true).limit(2000);
  if (!alerts?.length) return out;

  const offer: OfferForMatch = { id: job.id as string, title: job.title as string, sector: (job.sector as string | null) ?? null, city: job.city as string, contract_type: (job.contract_type as string | null) ?? null };
  const org = Array.isArray(job.organizations) ? (job.organizations[0] as { name?: string } | undefined)?.name : (job.organizations as { name?: string } | null)?.name;
  const orgLabel = publicOrgName(job.hide_company as boolean | null, org ?? null, "fr");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";

  for (const a of alerts) {
    if (out.sent >= CAP) break;
    try {
      const { data: c } = await db.from("candidates").select("city, sectors, trades, job_types").eq("auth_user_id", a.user_id).maybeSingle();
      if (!c?.city) continue;
      const profile = { city: c.city as string, sectors: (c.sectors as string[] | null) ?? [], trades: (c.trades as string[] | null) ?? [], jobTypes: (c.job_types as string[] | null) ?? [] };
      // Proximité calculée autour de la ville du CANDIDAT : l'offre doit être à moins de 15 km de chez lui.
      const near = citiesWithin(profile.city, NEAR_KM);
      const nearSet = new Set<string>([normalizePlace(profile.city), ...(near?.names ?? []).map(normalizePlace)]);
      const reasons = matchReasons(profile, offer, nearSet);
      // Vraie correspondance : proche de chez lui ET même métier ou même secteur.
      if (!(reasons.includes("near") && (reasons.includes("trade") || reasons.includes("sector")))) continue;
      out.matched++;
      const lock = await db.from("job_alert_log").insert({ job_id: jobId, user_id: a.user_id });
      if (lock.error) continue; // déjà envoyé (ou table absente)
      const unsub = `${appUrl}/alertes/desinscription?t=${a.unsub_token}`;
      const html = layout(
        "Une offre pour toi",
        `<p>Une nouvelle offre vient d'être publiée près de chez toi, dans ton domaine :</p><p><a href="${appUrl}/jobs/${esc(offer.id)}" style="color:#101F43"><strong>${esc(offer.title)}</strong></a> · ${esc(offer.city ?? "")}<br/>${esc(orgLabel)}</p><p style="font-size:12px;color:#6B6B60">Tu reçois cet e-mail parce que tu as activé les alertes emploi dans ton espace Wolko. <a href="${unsub}" style="color:#6B6B60">Me désinscrire</a></p>`,
        { label: "Voir l'offre", href: `${appUrl}/jobs/${offer.id}` },
      );
      const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: a.email as string, subject: `Nouvelle offre près de chez toi : ${offer.title}`, html, headers: { "List-Unsubscribe": `<${unsub}>` } });
      if (r.error) { await db.from("job_alert_log").delete().eq("job_id", jobId).eq("user_id", a.user_id); continue; }
      out.sent++;
    } catch (e) { console.error("instant alert", a.user_id, e); }
  }
  return out;
}
