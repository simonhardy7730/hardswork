"use server";

import { createClient } from "@/lib/supabase/server";
import { MAINTENANCE } from "@/lib/maintenance";
import { adminClient } from "@/lib/billing/lifecycle";
import { autopostAllowed, publishJobToFacebook } from "@/lib/social/facebook";

/**
 * Appelée juste après la publication d'une offre : si l'organisation fait partie de la liste autorisée,
 * l'offre part tout de suite sur la page Facebook Wolko. Sans effet si la publication automatique est désactivée.
 * Le cron quotidien reste un filet de secours (il reprend les échecs).
 */
export async function autopostNewJob(jobId: string): Promise<{ posted: boolean }> {
  try {
    if (MAINTENANCE || !/^[0-9a-f-]{36}$/i.test(jobId)) return { posted: false };
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { posted: false };
    // L'offre doit être lisible par l'utilisateur connecté (RLS) et active.
    const { data: job } = await supabase.from("job_offers").select("id, organization_id, status").eq("id", jobId).maybeSingle();
    if (!job || job.status !== "active" || !autopostAllowed(job.organization_id as string)) return { posted: false };
    const r = await publishJobToFacebook(adminClient(), jobId);
    return { posted: r.ok };
  } catch (e) {
    console.error("autopostNewJob", e);
    return { posted: false };
  }
}
