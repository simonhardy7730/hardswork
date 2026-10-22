import { resend } from "@/lib/resend";

/**
 * Plafond d'e-mails NON essentiels (relances, alertes) par passage du cron quotidien.
 * Raison : la formule gratuite de Resend est limitée à 100 e-mails par jour, et les e-mails de confirmation
 * d'inscription (Supabase → Resend) ne doivent jamais manquer de place. Les envois déclenchés par une action
 * (candidature, demande de CV, bienvenue…) n'utilisent pas ce plafond.
 * Réglable avec NONESSENTIAL_EMAIL_CAP ; à relever (ou supprimer) après passage à une formule Resend payante.
 */
const CAP = Math.max(0, Number(process.env.NONESSENTIAL_EMAIL_CAP ?? 25));
let used = 0;

export const resetEmailBudget = () => { used = 0; };
export const emailBudgetLeft = () => Math.max(0, CAP - used);

type SendArgs = Parameters<typeof resend.emails.send>[0];

/** Comme resend.emails.send, mais refuse (error) quand le plafond du passage est atteint : l'envoi sera retenté au prochain passage. */
export async function sendBulk(args: SendArgs): Promise<{ error: { message: string } | null }> {
  if (used >= CAP) return { error: { message: "email_budget_exhausted" } };
  used++;
  const r = await resend.emails.send(args);
  return { error: r.error ? { message: String(r.error.message ?? "send_failed") } : null };
}
