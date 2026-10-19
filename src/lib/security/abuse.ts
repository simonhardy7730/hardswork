import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** IP du client (Vercel renseigne x-forwarded-for). On ne stocke que son empreinte, jamais l'IP en clair. */
export function clientKey(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`wolko:${ip}`).digest("hex").slice(0, 24);
}

/** true = autorisé. Si la fonction SQL n'existe pas encore (migration 013), on n'empêche pas le site de fonctionner. */
export async function allow(admin: SupabaseClient, key: string, windowSeconds: number, max: number): Promise<boolean> {
  const { data, error } = await admin.rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });
  if (error) {
    console.error("rate_limit_hit indisponible:", error.message);
    return true;
  }
  return data === true;
}

/** Vérification Cloudflare Turnstile côté serveur. Active seulement si TURNSTILE_SECRET_KEY est défini. */
export async function verifyTurnstile(token: unknown, req: Request): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || token.length < 10 || token.length > 4096) return false;
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}
