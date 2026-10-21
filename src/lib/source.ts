/** Provenance (premier contact, 30 jours) : ?utm_source / ?utm_campaign / ?g=, sinon le site d'origine. Aucune donnée personnelle. */
const KEY = "wolko_src";

const clean = (v: string | null | undefined) => (v ?? "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function sourceFromLanding(search: string, referrer: string): string | null {
  const q = new URLSearchParams(search);
  const src = clean(q.get("utm_source") || (q.get("g") ? "fb" : ""));
  const camp = clean(q.get("utm_campaign") || q.get("g"));
  if (src || camp) return [src || "lien", camp].filter(Boolean).join(":");
  let host = "";
  try { host = referrer ? new URL(referrer).hostname : ""; } catch { /* ignore */ }
  if (!host || host.endsWith("wolko.be") || host.includes("localhost") || host.endsWith("vercel.app")) return null;
  if (host.includes("facebook") || host === "fb.com" || host.includes("fb.me")) return "facebook";
  if (host.includes("instagram")) return "instagram";
  if (host.includes("google")) return "google";
  if (host.includes("whatsapp")) return "whatsapp";
  return clean(host.replace(/^www\./, ""));
}

export function rememberSource(): void {
  try {
    const found = sourceFromLanding(window.location.search, document.referrer);
    const prev = JSON.parse(localStorage.getItem(KEY) || "null") as { s: string; t: number } | null;
    const fresh = prev && Date.now() - prev.t < 30 * 86400000;
    if (found && (!fresh || prev?.s === "direct")) localStorage.setItem(KEY, JSON.stringify({ s: found, t: Date.now() }));
    else if (!prev) localStorage.setItem(KEY, JSON.stringify({ s: "direct", t: Date.now() }));
  } catch { /* stockage indisponible : pas grave */ }
}

export function currentSource(): string | null {
  try { return (JSON.parse(localStorage.getItem(KEY) || "null") as { s: string } | null)?.s ?? null; } catch { return null; }
}

/** Côté serveur : nettoie la valeur reçue du navigateur. */
export const sanitizeSource = (v: unknown) => (typeof v === "string" ? v.toLowerCase().replace(/[^a-z0-9.:_-]+/g, "-").slice(0, 60) || null : null);
