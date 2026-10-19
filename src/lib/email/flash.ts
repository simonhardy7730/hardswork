import type { SupabaseClient } from "@supabase/supabase-js";
import { layout, li, esc, orgRecipients } from "./subscription";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { formatEuro } from "@/lib/flash/pricing";
import { formatDay, brusselsDay } from "@/lib/billing/contract";

const APP = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
const nr = (n: number) => `FL-${String(n).padStart(5, "0")}`;
const day = (iso: string) => formatDay(brusselsDay(new Date(iso)));
const FLASH_URL = () => `${APP()}/dashboard/flash`;

export type FlashMail =
  | { kind: "order_confirmation"; orgName: string; orderNumber: number; quantity: number; unitCents: number; discountCents: number; totalHtCents: number; vatCents: number; totalTtcCents: number }
  | { kind: "invoice_issued"; orderNumber: number; invoiceRef: string; totalHtCents: number; totalTtcCents: number }
  | { kind: "payment_confirmed"; orderNumber: number; published: number; available: number }
  | { kind: "reminder"; jobTitle: string; daysLeft: number; expiresAt: string }
  | { kind: "expired"; jobTitle: string }
  | { kind: "pro_proposal"; orgName: string };

export function buildFlashMail(m: FlashMail): { subject: string; html: string } {
  switch (m.kind) {
    case "order_confirmation":
      return {
        subject: `Commande WOLKO Flash ${nr(m.orderNumber)} enregistrée`,
        html: layout("Votre commande est enregistrée", `<p>Merci ! Votre commande <strong>${nr(m.orderNumber)}</strong> pour <strong>${esc(m.orgName)}</strong> a bien été enregistrée.</p>
${li([
  `${m.quantity} × WOLKO Flash : <strong>${formatEuro(m.unitCents * m.quantity)}</strong> HTVA`,
  ...(m.discountCents > 0 ? [`Remise Flash Duo (−50 % sur la 2e annonce) : <strong>${formatEuro(-m.discountCents)}</strong> HTVA`] : []),
  `Total : <strong>${formatEuro(m.totalHtCents)}</strong> HTVA · TVA ${formatEuro(m.vatCents)} · ${formatEuro(m.totalTtcCents)} TVAC (TVA indicative, selon le régime applicable)`,
])}
<p><strong>Prochaine étape :</strong> nous vous envoyons votre facture, à régler par virement bancaire. Vos annonces sont activées <strong>après confirmation de la réception du paiement</strong> (ou après accord exprès de notre équipe). Aucun prélèvement automatique, aucun renouvellement automatique.</p>`, { label: "Suivre ma commande", href: FLASH_URL() }),
      };
    case "invoice_issued":
      return {
        subject: `Facture ${esc(m.invoiceRef)} — commande WOLKO Flash ${nr(m.orderNumber)}`,
        html: layout("Votre facture est émise", `<p>La facture <strong>${esc(m.invoiceRef)}</strong> relative à votre commande ${nr(m.orderNumber)} a été émise : ${formatEuro(m.totalHtCents)} HTVA (${formatEuro(m.totalTtcCents)} TVAC).</p>
<p>Elle est à régler par virement bancaire. <strong>Cette facture n'est pas une confirmation de paiement</strong> : vos annonces sont activées dès que nous avons confirmé la réception de votre virement.</p>`, { label: "Suivre ma commande", href: FLASH_URL() }),
      };
    case "payment_confirmed":
      return {
        subject: `Paiement confirmé — commande WOLKO Flash ${nr(m.orderNumber)}`,
        html: layout("Paiement confirmé", `<p>Nous avons confirmé la réception du paiement de la commande ${nr(m.orderNumber)}. Merci !</p>
${li([
  m.published > 0 ? `${m.published} annonce(s) publiée(s) : leurs 30 jours démarrent aujourd'hui.` : `Aucune annonce publiée pour l'instant.`,
  ...(m.available > 0 ? [`${m.available} annonce(s) à activer quand vous le souhaitez, dans les 90 jours suivant l'achat. Les 30 jours démarrent à la publication.`] : []),
])}`, { label: "Voir mes annonces Flash", href: FLASH_URL() }),
      };
    case "reminder":
      return {
        subject: `Votre annonce « ${m.jobTitle} » expire ${m.daysLeft <= 2 ? "dans 2 jours" : "dans 7 jours"}`,
        html: layout(`Votre annonce expire dans ${m.daysLeft} jours`, `<p>Votre annonce WOLKO Flash <strong>${esc(m.jobTitle)}</strong> expire le ${`<strong>${day(m.expiresAt)}</strong>`}. Après cette date, elle sera retirée du site et n'acceptera plus de candidatures (vos candidatures restent consultables).</p>
<p>Aucun renouvellement automatique : si vous voulez la prolonger, vous pouvez la renouveler volontairement pour 30 jours.</p>`, { label: "Voir mon annonce", href: FLASH_URL() }),
      };
    case "expired":
      return {
        subject: `Votre annonce « ${m.jobTitle} » est terminée`,
        html: layout("Votre annonce Flash est terminée", `<p>L'annonce <strong>${esc(m.jobTitle)}</strong> a atteint ses 30 jours : elle n'est plus visible et n'accepte plus de candidatures. Vos candidatures restent consultables dans votre espace.</p>
<p>Besoin de continuer à recruter ? Vous pouvez la renouveler pour 30 jours par un nouvel achat (aucun renouvellement automatique).</p>`, { label: "Renouveler pour 30 jours", href: `${FLASH_URL()}/commander` }),
      };
    case "pro_proposal":
      return {
        subject: "Recrutez-vous régulièrement ? Découvrez WOLKO Pro",
        html: layout("Passez à WOLKO Pro", `<p>Bonjour, ${esc(m.orgName)} recrute avec WOLKO Flash. Si vous publiez régulièrement, WOLKO Pro regroupe offres illimitées, candidathèque et coordonnées débloquées.</p>
<p>7 jours d'essai gratuits, sans prélèvement automatique. L'abonnement payant comporte un engagement initial de 12 mois (voir les conditions sur la page Tarifs).</p>`, { label: "Découvrir WOLKO Pro", href: `${APP()}/tarifs` }),
      };
  }
}

export async function sendFlashMail(to: string[], m: FlashMail): Promise<boolean> {
  if (to.length === 0) return false;
  const { subject, html } = buildFlashMail(m);
  try {
    const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html });
    if (r.error) { console.error("Flash email error:", r.error); return false; }
    return true;
  } catch (err) { console.error("Flash email error:", err); return false; }
}

/** Destinataires d'une commande : e-mail de facturation + administrateurs + e-mail de l'organisation. */
export async function flashRecipients(db: SupabaseClient, orgId: string, billingEmail?: string | null): Promise<string[]> {
  const base = await orgRecipients(db, orgId);
  const b = (billingEmail ?? "").trim().toLowerCase();
  return [...new Set([...(b.includes("@") ? [b] : []), ...base])];
}
