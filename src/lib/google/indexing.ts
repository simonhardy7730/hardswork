import { createSign } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Google Indexing API (autorisée pour les pages d'offres d'emploi) : prévient Google quand une offre est publiée, modifiée ou retirée.
 * INACTIF tant que GOOGLE_INDEXING_ENABLED n'est pas « true » ET qu'un compte de service est configuré (GOOGLE_INDEXING_SA).
 * Ne garantit jamais l'indexation. Un échec de Google n'affecte jamais la publication d'une offre.
 */
const SCOPE = "https://www.googleapis.com/auth/indexing";
const DAILY_QUOTA = 180; // limite Google : 200 notifications / jour

type ServiceAccount = { client_email: string; private_key: string };

function readAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_INDEXING_SA;
  if (!raw) return null;
  try {
    const txt = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const j = JSON.parse(txt) as ServiceAccount;
    return j.client_email && j.private_key ? { client_email: j.client_email, private_key: j.private_key.replace(/\\n/g, "\n") } : null;
  } catch { return null; }
}

export const indexingEnabled = () => process.env.GOOGLE_INDEXING_ENABLED === "true" && !!readAccount();

const b64 = (o: unknown) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({ iss: sa.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3300 });
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key, "base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }),
  });
  const j = (await r.json()) as { access_token?: string; error_description?: string };
  if (!r.ok || !j.access_token) throw new Error(j.error_description ?? `token ${r.status}`);
  return j.access_token;
}

async function publish(token: string, url: string, type: "URL_UPDATED" | "URL_DELETED"): Promise<{ ok: boolean; status: number; error?: string }> {
  const r = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, type }),
  });
  if (r.ok) return { ok: true, status: r.status };
  const j = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
  return { ok: false, status: r.status, error: (j.error?.message ?? `HTTP ${r.status}`).slice(0, 200) };
}

/**
 * Passage quotidien : synchronise Google avec les offres.
 * - offre active jamais notifiée, ou modifiée depuis la dernière notification → URL_UPDATED ;
 * - offre notifiée puis retirée / expirée / suspendue → URL_DELETED.
 * Déjà notifiée et inchangée : rien (pas de doublon). Les échecs sont réessayés au passage suivant.
 */
export async function runIndexingSync(db: SupabaseClient): Promise<{ enabled: boolean; updated: number; deleted: number; errors: number; skipped: number }> {
  const out = { enabled: false, updated: 0, deleted: 0, errors: 0, skipped: 0 };
  if (!indexingEnabled()) return out;
  out.enabled = true;
  const sa = readAccount()!;
  const base = "https://wolko.be";
  const nowIso = new Date().toISOString();

  const [{ data: offers, error: oErr }, { data: logs, error: lErr }] = await Promise.all([
    db.from("job_offers").select("id, status, updated_at, expires_at").limit(2000),
    db.from("indexing_log").select("url, last_type, last_sent_at, last_error").limit(5000),
  ]);
  if (oErr || lErr) { console.error("indexing sync:", oErr?.message ?? lErr?.message); return { ...out, errors: 1 }; } // migration 034 absente ?
  const log = new Map((logs ?? []).map((l) => [l.url as string, l as { last_type: string; last_sent_at: string; last_error: string | null }]));

  const todo: { id: string; url: string; type: "URL_UPDATED" | "URL_DELETED" }[] = [];
  for (const o of offers ?? []) {
    const url = `${base}/jobs/${o.id}`;
    const live = o.status === "active" && (!o.expires_at || (o.expires_at as string) > nowIso);
    const l = log.get(url);
    if (live) {
      if (!l || l.last_type === "URL_DELETED" || l.last_error || new Date(o.updated_at as string) > new Date(l.last_sent_at)) todo.push({ id: o.id as string, url, type: "URL_UPDATED" });
    } else if (l && l.last_type === "URL_UPDATED") {
      todo.push({ id: o.id as string, url, type: "URL_DELETED" });
    }
  }
  if (!todo.length) return out;

  let token: string;
  try { token = await accessToken(sa); } catch (e) { console.error("indexing token:", e); return { ...out, errors: 1 }; }
  for (const t of todo) {
    if (out.updated + out.deleted >= DAILY_QUOTA) { out.skipped++; continue; }
    const r = await publish(token, t.url, t.type);
    const prev = log.get(t.url);
    await db.from("indexing_log").upsert({
      url: t.url, job_offer_id: t.id, last_type: r.ok ? t.type : (prev?.last_type ?? t.type), last_sent_at: r.ok ? new Date().toISOString() : (prev?.last_sent_at ?? "1970-01-01T00:00:00Z"),
      last_error: r.ok ? null : r.error ?? "erreur", attempts: 1,
    }, { onConflict: "url" });
    if (r.ok) { if (t.type === "URL_UPDATED") out.updated++; else out.deleted++; }
    else { out.errors++; if (r.status === 429) break; } // quota atteint : on reprend demain
  }
  return out;
}
