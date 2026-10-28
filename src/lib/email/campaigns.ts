import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { layout, esc } from "@/lib/email/subscription";
import { publicOrgName } from "@/lib/confidential";
import { strictMatch, type Profile } from "@/lib/email/instant-alerts";
import type { OfferForMatch } from "@/lib/candidate/suggestions";

/**
 * Envois ponctuels déclenchés à la main depuis /admin/envois (jamais automatiques) :
 *  1) invitation à activer les alertes, pour les comptes candidats qui ne les ont pas activées ;
 *  2) une offre précise envoyée aux comptes candidats QUI ONT ACTIVÉ LES ALERTES et dont le profil correspond vraiment (métier/secteur + moins de 30 km).
 * Règles : un seul mail par personne et par envoi (journal job_alert_log), lien de désinscription dans chaque mail
 * (colonne blocked : plus aucun e-mail ensuite), jamais de coordonnées transmises à un recruteur, plafond par clic.
 */
export const INVITE_ID = "00000000-0000-0000-0000-000000000001";
export const SEND_CAP = Math.max(1, Number(process.env.CAMPAIGN_SEND_CAP ?? 30));
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";

type Cand = { auth_user_id: string; email: string | null; city: string | null; sectors: string[] | null; trades: string[] | null; job_types: string[] | null };
type AlertRow = { user_id: string; active: boolean; blocked: boolean; unsub_token: string };

async function load(db: SupabaseClient, key: string) {
  const [{ data: cands }, { data: alerts }, log] = await Promise.all([
    db.from("candidates").select("auth_user_id, email, city, sectors, trades, job_types").not("auth_user_id", "is", null).limit(5000),
    db.from("job_alerts").select("user_id, active, blocked, unsub_token").limit(5000),
    db.from("job_alert_log").select("user_id").eq("job_id", key).limit(5000),
  ]);
  // Migration 040 absente : on peut quand même COMPTER les destinataires, mais rien ne part (ready = false).
  return {
    ready: !log.error,
    cands: ((cands ?? []) as Cand[]).filter((c) => c.email),
    alerts: new Map(((alerts ?? []) as AlertRow[]).map((a) => [a.user_id, a])),
    done: new Set(((log.data ?? []) as { user_id: string }[]).map((r) => r.user_id)),
  };
}

export type Plan = { ready: boolean; recipients: Cand[]; alreadySent: number };

export async function planInvites(db: SupabaseClient): Promise<Plan> {
  const d = await load(db, INVITE_ID);
  const recipients = d.cands.filter((c) => { const a = d.alerts.get(c.auth_user_id); return !d.done.has(c.auth_user_id) && !a?.active && !a?.blocked; });
  return { ready: d.ready, recipients, alreadySent: d.done.size };
}

export async function planOffer(db: SupabaseClient, jobId: string): Promise<Plan & { offer?: OfferForMatch & { orgLabel: string } }> {
  const { data: job } = await db.from("job_offers").select("id, title, sector, city, contract_type, status, hide_company, organizations(name)").eq("id", jobId).maybeSingle();
  if (!job || job.status !== "active" || !job.city) return { ready: true, recipients: [], alreadySent: 0 };
  const d = await load(db, jobId);
  const org = Array.isArray(job.organizations) ? (job.organizations[0] as { name?: string } | undefined)?.name : (job.organizations as { name?: string } | null)?.name;
  const offer = { id: job.id as string, title: job.title as string, sector: (job.sector as string | null) ?? null, city: job.city as string, contract_type: (job.contract_type as string | null) ?? null, orgLabel: publicOrgName(job.hide_company as boolean | null, org ?? null, "fr") };
  const recipients = d.cands.filter((c) => {
    const a = d.alerts.get(c.auth_user_id);
    if (d.done.has(c.auth_user_id) || !a?.active || a.blocked || !c.city) return false; // seulement ceux qui ont activé les alertes
    const p: Profile = { city: c.city, sectors: c.sectors ?? [], trades: c.trades ?? [], jobTypes: c.job_types ?? [] };
    return strictMatch(p, offer);
  });
  return { ready: d.ready, recipients, alreadySent: d.done.size, offer };
}

/** Garantit une ligne job_alerts (désactivée) pour disposer d'un jeton de désinscription. */
async function tokenFor(db: SupabaseClient, c: Cand): Promise<string | null> {
  await db.from("job_alerts").upsert({ user_id: c.auth_user_id, email: c.email, active: false }, { onConflict: "user_id", ignoreDuplicates: true });
  const { data } = await db.from("job_alerts").select("unsub_token").eq("user_id", c.auth_user_id).maybeSingle();
  return (data?.unsub_token as string | undefined) ?? null;
}

async function sendTo(db: SupabaseClient, key: string, recipients: Cand[], build: (unsub: string) => { subject: string; html: string }): Promise<{ sent: number; failed: number; left: number }> {
  let sent = 0, failed = 0;
  const batch = recipients.slice(0, SEND_CAP);
  for (const c of batch) {
    try {
      const lock = await db.from("job_alert_log").insert({ job_id: key, user_id: c.auth_user_id });
      if (lock.error) continue;
      const t = await tokenFor(db, c);
      if (!t) { await db.from("job_alert_log").delete().eq("job_id", key).eq("user_id", c.auth_user_id); failed++; continue; }
      const unsub = `${appUrl()}/alertes/desinscription?t=${t}`;
      const { subject, html } = build(unsub);
      const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: c.email as string, subject, html, headers: { "List-Unsubscribe": `<${unsub}>` } });
      if (r.error) { await db.from("job_alert_log").delete().eq("job_id", key).eq("user_id", c.auth_user_id); failed++; } else sent++;
    } catch (e) { console.error("campaign send", e); failed++; }
  }
  return { sent, failed, left: Math.max(0, recipients.length - batch.length) };
}

const foot = (unsub: string) => `<p style="font-size:12px;color:#6B6B60">Tu reçois cet e-mail parce que tu as un compte candidat sur Wolko. <a href="${unsub}" style="color:#6B6B60">Ne plus recevoir ces e-mails</a></p>`;

export async function sendInvites(db: SupabaseClient) {
  const plan = await planInvites(db);
  if (!plan.ready) return { sent: 0, failed: 0, left: 0, error: "migration_040" };
  return sendTo(db, INVITE_ID, plan.recipients, (unsub) => ({
    subject: "Sois prévenu dès qu'une offre te correspond",
    html: layout("Sois prévenu dès qu'une offre te correspond",
      `<p>Les candidats qui réagissent vite à une offre ont plus de chances de décrocher un job. Active les alertes emploi de ton compte Wolko : tu reçois un e-mail dès qu'une offre de ton métier ou de ton secteur est publiée près de chez toi (jusqu'à 30 km). Gratuit, tu peux te désinscrire en un clic.</p>${foot(unsub)}`,
      { label: "Activer mes alertes", href: `${appUrl()}/candidat/alertes` }),
  }));
}

export async function sendOffer(db: SupabaseClient, jobId: string) {
  const plan = await planOffer(db, jobId);
  if (!plan.ready) return { sent: 0, failed: 0, left: 0, error: "migration_040" };
  const o = plan.offer;
  if (!o) return { sent: 0, failed: 0, left: 0, error: "offer" };
  return sendTo(db, jobId, plan.recipients, (unsub) => ({
    subject: `Une offre près de chez toi : ${o.title}`,
    html: layout("Une offre pour toi",
      `<p>Une offre correspond à ton profil, près de chez toi :</p><p><a href="${appUrl()}/jobs/${esc(o.id)}" style="color:#101F43"><strong>${esc(o.title)}</strong></a> · ${esc(o.city ?? "")}<br/>${esc(o.orgLabel)}</p>${foot(unsub)}`,
      { label: "Voir l'offre", href: `${appUrl()}/jobs/${o.id}` }),
  }));
}
