import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/billing/lifecycle";

export type PlatformRole = "owner" | "finance" | "support" | "viewer";
export type PlatformAction = "view" | "confirm_payment" | "mark_invoice" | "authorize_deferred" | "cancel_order" | "suspend";

/** Droits séparés : finance (paiements, factures), support (suspension), owner (tout, dont publication avant paiement). */
const RIGHTS: Record<PlatformRole, PlatformAction[]> = {
  owner: ["view", "confirm_payment", "mark_invoice", "authorize_deferred", "cancel_order", "suspend"],
  finance: ["view", "confirm_payment", "mark_invoice"],
  support: ["view", "suspend"],
  viewer: ["view"],
};

export const can = (role: PlatformRole, action: PlatformAction) => RIGHTS[role].includes(action);

/** Administrateur de la plateforme (table platform_admins, lue côté serveur uniquement). Null si non autorisé. */
export async function getPlatformAdmin(): Promise<{ userId: string; email: string | null; role: PlatformRole } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await adminClient().from("platform_admins").select("role").eq("user_id", user.id).maybeSingle();
  if (error || !data) {
    // Comptes internes de Wolko (INTERNAL_SIGNUP_EMAILS) : lecture seule, sans aucune action.
    const internal = (process.env.INTERNAL_SIGNUP_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    const email = (user.email ?? "").toLowerCase();
    if (email && user.email_confirmed_at && internal.includes(email)) return { userId: user.id, email: user.email ?? null, role: "viewer" };
    return null;
  }
  const role = data.role as PlatformRole;
  return RIGHTS[role] ? { userId: user.id, email: user.email ?? null, role } : null;
}
