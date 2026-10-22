import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { layout, li, esc } from "@/lib/email/subscription";
import { suggestOffers, canPersonalize, type OfferForMatch } from "@/lib/candidate/suggestions";

/**
 * Alerte emploi hebdomadaire pour les candidats qui l'ont activée. Mêmes règles explicables que « Offres pour toi »
 * (métier, secteur, proximité ≤ 15 km), sans IA. N'envoie que s'il y a au moins une NOUVELLE offre depuis le dernier envoi.
 */
const PERIOD_MS = 6.5 * 86400000;

export async function runJobAlerts(db: SupabaseClient, now: Date = new Date()): Promise<{ sent: number; errors: number; skipped?: string }> {
  const out = { sent: 0, errors: 0 };
  const { data: alerts, error } = await db.from("job_alerts").select("user_id, email, unsub_token, last_sent_at").eq("active", true).limit(2000);
  if (error) return { ...out, errors: 1, skipped: "table_missing_or_error" };
  const due = (alerts ?? []).filter((a) => !a.last_sent_at || now.getTime() - new Date(a.last_sent_at as string).getTime() >= PERIOD_MS);
  if (due.length === 0) return out;

  const nowIso = now.toISOString();
  const { data: offersRaw } = await db.from("job_offers")
    .select("id, title, sector, city, contract_type, created_at, expires_at").eq("status", "active")
    .order("created_at", { ascending: false }).limit(500);
  const offers = (offersRaw ?? []).filter((o) => !o.expires_at || (o.expires_at as string) > nowIso) as (OfferForMatch & { created_at: string })[];
  if (offers.length === 0) return out;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  for (const a of due) {
    try {
      const { data: c } = await db.from("candidates").select("city, sectors, trades, job_types").eq("auth_user_id", a.user_id).maybeSingle();
      const profile = { city: (c?.city as string | null) ?? null, sectors: (c?.sectors as string[] | null) ?? [], trades: (c?.trades as string[] | null) ?? [], jobTypes: (c?.job_types as string[] | null) ?? [] };
      if (!canPersonalize(profile)) continue;
      const since = a.last_sent_at ? new Date(a.last_sent_at as string).getTime() : now.getTime() - 7 * 86400000;
      const fresh = offers.filter((o) => new Date(o.created_at).getTime() > since);
      const picks = suggestOffers(profile, fresh, 5);
      if (picks.length === 0) continue;
      const lines = picks.map((s) => `<a href="${appUrl}/jobs/${esc(s.offer.id)}" style="color:#101F43"><strong>${esc(s.offer.title)}</strong></a>${s.offer.city ? ` · ${esc(s.offer.city)}` : ""}`);
      const unsub = `${appUrl}/alertes/desinscription?t=${a.unsub_token}`;
      const html = layout(
        "Nouvelles offres pour toi",
        `<p>Voici les nouvelles offres de la semaine qui correspondent à ton profil :</p>${li(lines)}<p style="font-size:12px;color:#6B6B60">Tu reçois cet e-mail parce que tu as activé les alertes emploi dans ton espace Wolko. <a href="${unsub}" style="color:#6B6B60">Me désinscrire</a></p>`,
        { label: "Voir les offres", href: `${appUrl}/jobs` },
      );
      const r = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`, to: a.email as string, subject: "Nouvelles offres pour toi", html,
        headers: { "List-Unsubscribe": `<${unsub}>` },
      });
      if (r.error) { out.errors++; continue; }
      await db.from("job_alerts").update({ last_sent_at: nowIso }).eq("user_id", a.user_id);
      out.sent++;
    } catch (e) { console.error("job alert", a.user_id, e); out.errors++; }
  }
  return out;
}
