"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/billing/lifecycle";
import { runInstantAlertsForJob } from "@/lib/email/instant-alerts";

/** Appelée juste après la publication d'une offre : prévient les candidats (alertes activées) dont le profil correspond vraiment. Jamais bloquant. */
export async function alertMatchingCandidates(jobId: string): Promise<{ sent: number }> {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(jobId)) return { sent: 0 };
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { sent: 0 };
    const { data: job } = await supabase.from("job_offers").select("id, status").eq("id", jobId).maybeSingle(); // lisible seulement par son organisation (RLS)
    if (!job || job.status !== "active") return { sent: 0 };
    const r = await runInstantAlertsForJob(adminClient(), jobId);
    return { sent: r.sent };
  } catch (e) {
    console.error("alertMatchingCandidates", e);
    return { sent: 0 };
  }
}
