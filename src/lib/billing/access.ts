import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateAccess, type Access, type SubscriptionRow } from "./pricing";

/** Droit d'accès d'une organisation, calculé avec l'horloge du SERVEUR. */
export async function getOrgAccess(supabase: SupabaseClient, orgId: string, now: Date = new Date()): Promise<Access> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_ends_at, current_period_end")
    .eq("organization_id", orgId)
    .maybeSingle();
  return evaluateAccess((data as SubscriptionRow | null) ?? null, now);
}

/** Masque les coordonnées des candidats tant que l'organisation n'a pas accès (côté serveur,
 *  pour qu'elles ne partent jamais vers le navigateur). */
export function redactContacts<T extends { email?: string | null; phone?: string | null }>(rows: T[], hasAccess: boolean): T[] {
  if (hasAccess) return rows;
  return rows.map((r) => ({ ...r, email: null, phone: null }));
}
