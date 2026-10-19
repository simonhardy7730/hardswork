import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Offres dont les candidatures (coordonnées, CV) sont accessibles grâce à un crédit WOLKO Flash actif ou expiré
 * (l'historique reste consultable). Flash ne donne AUCUN autre droit : ni candidathèque, ni profils n'ayant pas postulé.
 * Utilise le client RLS de l'utilisateur : seules les lignes de son organisation sont visibles. Tolérant si la migration 024 manque.
 */
export async function flashUnlockedOfferIds(supabase: SupabaseClient, orgId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("flash_credits")
    .select("job_offer_id")
    .eq("organization_id", orgId)
    .in("status", ["active", "expired"])
    .not("job_offer_id", "is", null);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.job_offer_id as string));
}
