"use server";

import { revalidatePath } from "next/cache";
import { getPlatformAdmin } from "@/lib/admin/platform";
import { adminClient } from "@/lib/billing/lifecycle";
import { publishJobToFacebook } from "@/lib/social/facebook";

/** Bouton admin : publie une offre sur la page Facebook Wolko (réservé aux admins de la plateforme, pas aux lecteurs). */
export async function publishToPage(jobId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getPlatformAdmin();
  if (!admin || admin.role === "viewer") return { ok: false, error: "Accès refusé." };
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return { ok: false, error: "Offre invalide." };
  const r = await publishJobToFacebook(adminClient(), jobId);
  revalidatePath("/admin/partage");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
