"use server";

import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Le candidat a déposé son CV (dans son dossier privé) : on l'associe à la demande reçue à son adresse e-mail. */
export async function fulfillCvRequest(requestId: string, path: string, fileName: string): Promise<{ ok: boolean }> {
  if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false };
  // Le fichier doit être dans le dossier privé de CE candidat
  if (typeof path !== "string" || !path.startsWith(`${user.id}/`) || path.includes("..")) return { ok: false };
  // RLS : ne renvoie la demande que si elle est adressée à son e-mail
  const { data: req } = await supabase.from("cv_requests").select("id").eq("id", requestId).maybeSingle();
  if (!req) return { ok: false };
  const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await db.from("cv_requests").update({
    status: "fulfilled",
    cv_path: path,
    cv_name: String(fileName ?? "").slice(0, 150) || null,
    fulfilled_at: new Date().toISOString(),
  }).eq("id", requestId);
  return { ok: !error };
}
