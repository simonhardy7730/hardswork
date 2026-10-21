"use server";

import { getPlatformAdmin } from "@/lib/admin/platform";
import { adminClient } from "@/lib/billing/lifecycle";
import { runApplicantCvReminders } from "@/lib/email/cv-reminder";

/** Bouton admin : envoie le lien « ajoute ton CV » à toutes les personnes qui ont postulé sans CV (une seule fois chacune). */
export async function remindMissingCvs(): Promise<{ ok: boolean; sent?: number; left?: number; errors?: number }> {
  const admin = await getPlatformAdmin();
  if (!admin) return { ok: false };
  const r = await runApplicantCvReminders(adminClient(), { backlog: true, max: 80 });
  return { ok: true, sent: r.sent, left: r.left, errors: r.errors };
}
