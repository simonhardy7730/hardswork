"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePreferences } from "@/lib/candidate/preferences";

/** Enregistre les préférences du candidat connecté (jamais le statut d'éligibilité). */
export async function savePreferences(raw: unknown): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("candidates")
    .update(sanitizePreferences(raw))
    .eq("auth_user_id", user.id);

  if (error) {
    console.error("savePreferences:", error.message);
    return { ok: false };
  }
  revalidatePath("/candidat/compte");
  return { ok: true };
}
