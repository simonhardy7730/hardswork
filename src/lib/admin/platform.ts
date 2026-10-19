import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/billing/lifecycle";

export type PlatformRole = "owner" | "finance" | "support";
export type PlatformAction = "view" | "confirm_payment" | "mark_invoice" | "authorize_deferred" | "cancel_order" | "suspend";

/** Droits séparés : finance (paiements, factures), support (suspension), owner (tout, dont publication avant paiement). */
const RIGHTS: Record<PlatformRole, PlatformAction[]> = {
  owner: ["view", "confirm_payment", "mark_invoice", "authorize_deferred", "cancel_order", "suspend"],
  finance: ["view", "confirm_payment", "mark_invoice"],
  support: ["view", "suspend"],
};

export const can = (role: PlatformRole, action: PlatformAction) => RIGHTS[role].includes(action);

/** Administrateur de la plateforme (table platform_admins, lue côté serveur uniquement). Null si non autorisé. */
export async function getPlatformAdmin(): Promise<{ userId: string; email: string | null; role: PlatformRole } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await adminClient().from("platform_admins").select("role").eq("user_id", user.id).maybeSingle();
  if (error || !data) return null;
  const role = data.role as PlatformRole;
  return RIGHTS[role] ? { userId: user.id, email: user.email ?? null, role } : null;
}
