import { createClient as createAdmin } from "@supabase/supabase-js";

export const DEFAULT_RETENTION_DAYS = 7;
export const RETENTION_OPTIONS = [1, 3, 7, 14, 30, 90, 0] as const; // 0 = jamais

const admin = () => createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** Délai choisi par l'organisation (migration 020). Si la colonne n'existe pas encore : 7 jours. */
export async function getRetentionDays(orgId: string): Promise<number> {
  const { data, error } = await admin().from("organizations").select("refused_retention_days").eq("id", orgId).maybeSingle();
  if (error || !data) return DEFAULT_RETENTION_DAYS;
  const n = (data as { refused_retention_days?: number }).refused_retention_days;
  return typeof n === "number" ? n : DEFAULT_RETENTION_DAYS;
}

/** Supprime les candidatures refusées depuis plus longtemps que le délai de l'organisation
 *  (filet de sécurité si pg_cron n'est pas actif). Réservé au serveur : jamais en action appelable du navigateur. */
export async function purgeRefused(orgId: string): Promise<number> {
  const days = await getRetentionDays(orgId);
  if (days <= 0) return days;
  const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const db = admin();
  const { data: offers } = await db.from("job_offers").select("id").eq("organization_id", orgId);
  const ids = (offers ?? []).map((o) => o.id as string);
  if (ids.length > 0) {
    await db.from("applications").delete().in("job_offer_id", ids).eq("status", "refuse").lt("updated_at", cutoff);
  }
  return days;
}
