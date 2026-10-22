"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/billing/lifecycle";

/** Active ou coupe les alertes emploi du candidat connecté (consentement explicite : rien n'est activé par défaut). */
export async function setJobAlerts(active: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false };
  const db = adminClient();
  const { error } = await db.from("job_alerts").upsert({ user_id: user.id, email: user.email, active }, { onConflict: "user_id" });
  if (error) { console.error("job_alerts", error.message); return { ok: false }; }
  revalidatePath("/candidat/alertes");
  return { ok: true };
}
