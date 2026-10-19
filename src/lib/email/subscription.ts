import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { formatDay, type Ymd } from "@/lib/billing/contract";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const APP = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
const eur = (cents: number) => `${(cents / 100).toLocaleString("fr-BE")} € HTVA/mois`;

export function layout(title: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  return `<div style="background:#FFF6DE;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto">
  <div style="background:#101F43;padding:16px 24px;border-radius:12px 12px 0 0">
    <img src="https://wolko.be/images/email/wolf-head.png" width="36" height="34" alt="" style="vertical-align:middle;margin-right:8px">
    <span style="font-size:20px;font-weight:900;vertical-align:middle"><span style="color:#FFB900">WOL</span><span style="color:#fff">KO</span></span>
  </div>
  <div style="background:#fff;border:1px solid #EADFC4;border-top:0;border-radius:0 0 12px 12px;padding:28px 24px;color:#101F43;line-height:1.6;font-size:14px">
    <h2 style="margin:0 0 14px;font-size:20px">${esc(title)}</h2>
    ${bodyHtml}
    ${cta ? `<p style="margin:24px 0 8px"><a href="${cta.href}" style="background:#FFB900;color:#101F43;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">${esc(cta.label)}</a></p>` : ""}
    <p style="font-size:12px;color:#6B6B60;margin:22px 0 0">Des questions ? Répondez à cet e-mail ou écrivez à hello@wolko.be. Prix exprimés hors TVA.</p>
  </div>
</div></div>`;
}

export const li = (items: string[]) => `<ul style="padding-left:18px;margin:10px 0">${items.map((i) => `<li style="margin:4px 0">${i}</li>`).join("")}</ul>`;
const link = () => `${APP()}/dashboard/settings?tab=abonnement`;

export type SubscriptionMail =
  | { kind: "trial_reminder"; orgName: string; endDay: Ymd; daysLeft: number }
  | { kind: "trial_expired"; orgName: string }
  | { kind: "subscribed"; orgName: string; planName: string; priceCents: number; startDay: Ymd; endDay: Ymd; noticeDeadlineDay: Ymd; priceAfterCents: number; founder: boolean; termsVersion: string }
  | { kind: "renewal_reminder"; orgName: string; planName: string; endDay: Ymd; noticeDeadlineDay: Ymd; priceCents: number; priceAfterCents: number }
  | { kind: "cancel_confirmation"; orgName: string; planName: string; requestedDay: Ymd; lastDay: Ymd; noticeRespected: boolean }
  | { kind: "ended"; orgName: string };

export function buildSubscriptionMail(m: SubscriptionMail): { subject: string; html: string } {
  const d = (x: Ymd) => `<strong>${formatDay(x)}</strong>`;
  switch (m.kind) {
    case "trial_reminder":
      return {
        subject: `Votre essai gratuit WOLKO se termine ${m.daysLeft <= 1 ? "demain" : `dans ${m.daysLeft} jours`}`,
        html: layout("Votre essai se termine bientôt", `<p>Bonjour, l'essai gratuit de <strong>${esc(m.orgName)}</strong> se termine le ${d(m.endDay)}.</p>
<p>Aucun paiement n'est prélevé automatiquement. Pour continuer à publier vos offres et à contacter les candidats, vous devrez choisir explicitement un abonnement. Vos données sont conservées.</p>`, { label: "Voir mon abonnement", href: link() }),
      };
    case "trial_expired":
      return {
        subject: "Votre essai gratuit WOLKO est terminé",
        html: layout("Votre essai est terminé", `<p>L'essai gratuit de <strong>${esc(m.orgName)}</strong> est terminé. Vos données (offres, candidatures) sont conservées, mais la publication d'offres et les coordonnées des candidats sont suspendues.</p>
<p>Aucun prélèvement n'a eu lieu. Pour reprendre, choisissez un abonnement avec notre équipe.</p>`, { label: "Choisir mon abonnement", href: link() }),
      };
    case "subscribed":
      return {
        subject: "Confirmation de votre abonnement WOLKO",
        html: layout("Votre abonnement est activé", `<p>Merci ! L'abonnement <strong>${esc(m.planName)}</strong> de <strong>${esc(m.orgName)}</strong> est activé. Voici le récapitulatif :</p>
${li([
  `Prix : <strong>${eur(m.priceCents)}</strong>${m.founder ? " (tarif de lancement)" : ""}, facturation mensuelle`,
  `Début de l'engagement : ${d(m.startDay)}`,
  `Engagement initial de 12 mois, jusqu'au ${d(m.endDay)} inclus`,
  `Préavis : pour ne pas poursuivre après l'engagement, demandez la non-reconduction au plus tard le ${d(m.noticeDeadlineDay)} (30 jours avant l'échéance)`,
  `Ensuite : abonnement à durée indéterminée facturé mensuellement (${eur(m.priceAfterCents)}), résiliable avec 30 jours de préavis`,
  `Conditions acceptées : version ${esc(m.termsVersion)}`,
])}
<p>Vous retrouvez ces informations à tout moment dans « Mon abonnement ».</p>`, { label: "Mon abonnement", href: link() }),
      };
    case "renewal_reminder":
      return {
        subject: "Votre engagement WOLKO arrive à échéance dans 45 jours",
        html: layout("Votre engagement initial se termine bientôt", `<p>L'engagement initial de 12 mois de <strong>${esc(m.orgName)}</strong> (formule ${esc(m.planName)}) se termine le ${d(m.endDay)}.</p>
${li([
  `Sans action de votre part, l'abonnement continue à durée indéterminée, facturé mensuellement.`,
  m.priceAfterCents !== m.priceCents
    ? `Information tarifaire : à l'issue de l'engagement, le tarif standard de <strong>${eur(m.priceAfterCents)}</strong> s'applique (au lieu de ${eur(m.priceCents)}).`
    : `Votre tarif reste de <strong>${eur(m.priceAfterCents)}</strong>.`,
  `Pour ne pas poursuivre, demandez la non-reconduction au plus tard le ${d(m.noticeDeadlineDay)}.`,
  `Après l'engagement, vous pouvez résilier avec un préavis de 30 jours.`,
])}`, { label: "Gérer mon abonnement", href: link() }),
      };
    case "cancel_confirmation":
      return {
        subject: "Confirmation de votre demande de résiliation WOLKO",
        html: layout("Demande de résiliation enregistrée", `<p>Nous avons enregistré le ${d(m.requestedDay)} votre demande de résiliation pour <strong>${esc(m.orgName)}</strong> (formule ${esc(m.planName)}).</p>
${li([
  `Fin du contrat : le ${d(m.lastDay)} (dernier jour d'accès inclus)`,
  `Aucune période postérieure à cette date n'est facturée.`,
  ...(m.noticeRespected ? [] : [`Votre demande est intervenue moins de 30 jours avant l'échéance de l'engagement initial : notre équipe la traite et vous contactera si nécessaire. Aucune nouvelle période annuelle n'est appliquée.`]),
])}
<p>Vos données restent conservées. Vous pouvez annuler cette demande depuis « Mon abonnement » tant que la date de fin n'est pas passée.</p>`, { label: "Mon abonnement", href: link() }),
      };
    case "ended":
      return {
        subject: "Votre abonnement WOLKO est terminé",
        html: layout("Votre abonnement est terminé", `<p>L'abonnement de <strong>${esc(m.orgName)}</strong> est arrivé à son terme. Vos données sont conservées ; vous pouvez reprendre un abonnement à tout moment.</p>
<p>Merci d'avoir utilisé WOLKO.</p>`, { label: "Voir les formules", href: `${APP()}/tarifs` }),
      };
  }
}

/** Destinataires d'une organisation : administrateurs + e-mail de l'organisation. */
export async function orgRecipients(db: SupabaseClient, orgId: string): Promise<string[]> {
  const [{ data: admins }, { data: org }] = await Promise.all([
    db.from("users").select("email").eq("organization_id", orgId).eq("role", "admin"),
    db.from("organizations").select("email").eq("id", orgId).maybeSingle(),
  ]);
  const all = [...(admins ?? []).map((a) => a.email as string), (org?.email as string | null) ?? ""]
    .map((e) => (e ?? "").trim().toLowerCase()).filter((e) => e.includes("@"));
  return [...new Set(all)];
}

/** Envoie un e-mail d'abonnement. Ne lève jamais d'erreur ; true seulement si Resend a accepté. */
export async function sendSubscriptionMail(to: string[], m: SubscriptionMail): Promise<boolean> {
  if (to.length === 0) return false;
  const { subject, html } = buildSubscriptionMail(m);
  try {
    const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html });
    if (r.error) { console.error("Subscription email error:", r.error); return false; }
    return true;
  } catch (err) {
    console.error("Subscription email error:", err);
    return false;
  }
}
