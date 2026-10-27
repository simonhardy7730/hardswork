import type { SupabaseClient } from "@supabase/supabase-js";
import { facebookPostParts, type ShareJob } from "@/lib/social/post-text";
import { sendShareNotify } from "@/lib/email/share-notify";

/**
 * Publication des offres sur la page Facebook Wolko (API Graph de Meta, gratuite).
 * Variables Vercel (saisies par Simon / Johnny, jamais dans le code) :
 *   FACEBOOK_PAGE_ID, FACEBOOK_PAGE_TOKEN  → sans elles, tout reste inactif.
 *   FACEBOOK_AUTOPOST=1                    → active la publication automatique (cron quotidien).
 *   FACEBOOK_AUTOPOST_ORG_IDS              → organisations dont les offres partent seules (ids séparés par des virgules).
 *   FACEBOOK_AUTOPOST_SCOPE=all            → (optionnel) ouvre l'automatique à toutes les organisations.
 *   FACEBOOK_DAILY_CAP                     → plafond de posts par passage du cron (3 par défaut).
 *   FACEBOOK_NOTIFY_EMAIL                  → (optionnel) adresses prévenues à chaque offre publiée, avec le texte pour les groupes.
 * Le bouton « Publier sur la page » de /admin/partage fonctionne dès que l'ID et le token sont présents.
 *
 * Alternative SANS compte développeur Meta (gratuite) : FACEBOOK_WEBHOOK_URL = l'adresse d'un webhook Make (ou Zapier)
 * dont le scénario publie sur la page. Wolko lui envoie {message, link, job_id} ; si cette variable est présente,
 * c'est elle qui est utilisée à la place de l'API Graph (l'ID de page et le token ne sont alors pas nécessaires).
 */
const GRAPH = `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION ?? "v25.0"}`;

const webhookUrl = () => {
  const u = (process.env.FACEBOOK_WEBHOOK_URL ?? "").trim();
  return /^https:\/\//.test(u) ? u : null; // seulement du https
};

export const facebookConfigured = () => !!webhookUrl() || !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);

type Row = { id: string; title: string; city: string | null; contract_type: string | null; hide_company: boolean | null; organization_id?: string | null; organizations?: unknown };

const orgName = (o: unknown): string | null => (Array.isArray(o) ? (o[0] as { name?: string } | undefined)?.name : (o as { name?: string } | null)?.name) ?? null;
const toShare = (r: Row): ShareJob => ({ id: r.id, title: r.title, city: r.city, contract_type: r.contract_type, hide_company: r.hide_company, org_name: orgName(r.organizations) });

async function callGraph(job: ShareJob): Promise<{ id?: string; error?: string }> {
  const { message, link } = facebookPostParts(job);
  const hook = webhookUrl();
  if (hook) {
    try {
      const res = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, link, job_id: job.id }), signal: AbortSignal.timeout(15000) });
      return res.ok ? { id: `webhook:${job.id}` } : { error: `webhook_http_${res.status}` };
    } catch (e) {
      return { error: e instanceof Error ? e.message.slice(0, 300) : "network_error" };
    }
  }
  const body = new URLSearchParams({ message, link, access_token: process.env.FACEBOOK_PAGE_TOKEN! });
  try {
    const res = await fetch(`${GRAPH}/${process.env.FACEBOOK_PAGE_ID}/feed`, { method: "POST", body, signal: AbortSignal.timeout(15000) });
    const json = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!res.ok || !json.id) return { error: (json.error?.message ?? `http_${res.status}`).slice(0, 300) };
    return { id: json.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message.slice(0, 300) : "network_error" };
  }
}

/** Publie UNE offre (une seule fois : la ligne social_posts sert de verrou). */
export async function publishJobToFacebook(db: SupabaseClient, jobId: string): Promise<{ ok: boolean; error?: string; already?: boolean }> {
  if (!facebookConfigured()) return { ok: false, error: "Facebook n'est pas encore configuré (ID de page / token manquants)." };
  const { data: job } = await db.from("job_offers").select("id, title, city, contract_type, hide_company, status, organizations(name)").eq("id", jobId).maybeSingle();
  if (!job || job.status !== "active") return { ok: false, error: "Offre introuvable ou inactive." };

  const { data: prev } = await db.from("social_posts").select("status, attempts").eq("job_id", jobId).maybeSingle();
  if (prev?.status === "posted") return { ok: true, already: true };

  const shared = toShare(job as unknown as Row);
  const r = await callGraph(shared);
  if (r.id) await sendShareNotify(shared); // e-mail « offre partie sur Facebook » avec le texte pour les groupes (si FACEBOOK_NOTIFY_EMAIL)
  const attempts = (prev?.attempts ?? 0) + 1;
  await db.from("social_posts").upsert({ job_id: jobId, status: r.id ? "posted" : "failed", fb_post_id: r.id ?? null, attempts, last_error: r.error ?? null, posted_at: new Date().toISOString() });
  return r.id ? { ok: true } : { ok: false, error: r.error };
}

/** Cron quotidien : publie les nouvelles offres (≤ 7 jours) des organisations autorisées, dans la limite du plafond. */
export async function runFacebookAutopost(db: SupabaseClient): Promise<{ posted: number; failed: number; skipped?: string }> {
  if (process.env.FACEBOOK_AUTOPOST !== "1") return { posted: 0, failed: 0, skipped: "off" };
  if (!facebookConfigured()) return { posted: 0, failed: 0, skipped: "not_configured" };
  const all = process.env.FACEBOOK_AUTOPOST_SCOPE === "all";
  const orgIds = (process.env.FACEBOOK_AUTOPOST_ORG_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!all && orgIds.length === 0) return { posted: 0, failed: 0, skipped: "no_org" };

  const cap = Math.max(0, Number(process.env.FACEBOOK_DAILY_CAP ?? 3));
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  let q = db.from("job_offers").select("id, organization_id").eq("status", "active").gte("created_at", since).order("created_at", { ascending: true }).limit(60);
  if (!all) q = q.in("organization_id", orgIds);
  const { data: jobs } = await q;
  if (!jobs?.length) return { posted: 0, failed: 0 };

  const { data: done } = await db.from("social_posts").select("job_id, status, attempts").in("job_id", jobs.map((j) => j.id as string));
  const doneMap = new Map((done ?? []).map((d) => [d.job_id as string, d as { status: string; attempts: number }]));
  const todo = jobs.filter((j) => { const d = doneMap.get(j.id as string); return !d || (d.status === "failed" && d.attempts < 3); }).slice(0, cap);

  let posted = 0, failed = 0;
  for (const j of todo) {
    const r = await publishJobToFacebook(db, j.id as string);
    if (r.ok) posted++; else failed++;
  }
  return { posted, failed };
}

/** Cette organisation a-t-elle droit à la publication automatique ? (même règle que le cron) */
export function autopostAllowed(orgId: string | null | undefined): boolean {
  if (process.env.FACEBOOK_AUTOPOST !== "1" || !facebookConfigured()) return false;
  if (process.env.FACEBOOK_AUTOPOST_SCOPE === "all") return true;
  const ids = (process.env.FACEBOOK_AUTOPOST_ORG_IDS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return !!orgId && ids.includes(orgId);
}
