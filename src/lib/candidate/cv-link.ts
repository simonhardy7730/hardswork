import { createHmac, timingSafeEqual } from "node:crypto";

/** Lien personnel « dépose ton CV » lié à une candidature, sans compte ni mot de passe. Valable 60 jours. */
const secret = () => process.env.CV_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
const sig = (payload: string) => createHmac("sha256", secret()).update(`cv-link:${payload}`).digest("base64url").slice(0, 32);

export function cvToken(applicationId: string, days = 60): string {
  const payload = `${applicationId}.${Math.floor(Date.now() / 1000) + days * 86400}`;
  return `${Buffer.from(payload).toString("base64url")}.${sig(payload)}`;
}

export function readCvToken(token: string): string | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const [p64, s] = token.split(".");
  if (!p64 || !s) return null;
  let payload: string;
  try { payload = Buffer.from(p64, "base64url").toString(); } catch { return null; }
  const expected = sig(payload);
  if (s.length !== expected.length || !timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
  const [id, exp] = payload.split(".");
  if (!/^[0-9a-f-]{36}$/i.test(id ?? "") || !(Number(exp) > Date.now() / 1000)) return null;
  return id;
}

export const cvLink = (applicationId: string) => `${process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be"}/cv/${cvToken(applicationId)}`;
