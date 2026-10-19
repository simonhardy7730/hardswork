import { createClient as createAdmin } from "@supabase/supabase-js";

/** Supprime les candidatures refusées depuis plus de 30 jours (filet de sécurité si pg_cron n'est pas actif).
 *  Réservé au serveur : ne jamais l'exposer comme action appelable depuis le navigateur. */
export async function purgeRefused(orgId: string): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: offers } = await db.from("job_offers").select("id").eq("organization_id", orgId);
  const ids = (offers ?? []).map((o) => o.id as string);
  if (ids.length === 0) return;
  await db.from("applications").delete().in("job_offer_id", ids).eq("status", "refuse").lt("updated_at", cutoff);
}
