import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkoutPlan, checkPaidAmounts, orderLabel, type PlanOrder } from "./stripe-plan";
import { sendFlashMail, flashRecipients } from "@/lib/email/flash";

const APP = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";

/** Le paiement en ligne n'existe que si les DEUX clés sont configurées. Sinon : parcours « facture » inchangé. */
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;

let client: Stripe | null = null;
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante");
  return (client ??= new Stripe(process.env.STRIPE_SECRET_KEY));
}

/** Taux de TVA Stripe réutilisé (créé une fois puis mémorisé dans app_settings : pas d'encombrement du tableau de bord). */
async function taxRateId(db: SupabaseClient, stripe: Stripe, percent: number): Promise<string> {
  const key = `stripe_tax_rate_${percent}`;
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (typeof data?.value === "string" && data.value) return data.value;
  const tr = await stripe.taxRates.create({ display_name: "TVA", percentage: percent, inclusive: false, country: "BE", jurisdiction: "BE" });
  await db.from("app_settings").upsert({ key, value: tr.id, updated_at: new Date().toISOString() });
  return tr.id;
}

/** Crée une session de paiement Stripe pour une commande Flash en attente. Renvoie l'URL de la page de paiement. */
export async function createCheckoutUrl(db: SupabaseClient, o: PlanOrder & { organization_id: string }): Promise<string> {
  const stripe = getStripe();
  const p = checkoutPlan(o);
  const taxRate = await taxRateId(db, stripe, p.vatPercent);
  const coupon = p.discountCents > 0
    ? await stripe.coupons.create({ amount_off: p.discountCents, currency: "eur", duration: "once", max_redemptions: 1, name: p.discountName })
    : null;
  const meta = { flash_order_id: o.id, organization_id: o.organization_id, order_number: String(o.order_number) };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    customer_creation: "always",
    customer_email: o.billing.email || undefined,
    client_reference_id: o.id,
    line_items: [{
      quantity: p.quantity, tax_rates: [taxRate],
      price_data: { currency: "eur", unit_amount: p.unitAmountCents, product_data: { name: p.productName } },
    }],
    ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: `Commande ${p.label}`, metadata: meta,
        custom_fields: [
          { name: "Commande", value: p.label },
          ...(o.billing.vat_number ? [{ name: "N° TVA client", value: o.billing.vat_number.slice(0, 30) }] : []),
        ],
      },
    },
    metadata: meta,
    payment_intent_data: { metadata: meta },
    success_url: `${APP()}/dashboard/flash?paiement=ok`,
    cancel_url: `${APP()}/dashboard/flash?paiement=annule`,
  });
  if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement");
  return session.url;
}

type Order = PlanOrder & { organization_id: string; status: string; payment_status: string; billing: { email?: string } };

/**
 * Paiement Stripe reçu : vérifie les montants, confirme la commande (publie les annonces rattachées), enregistre la
 * facture Stripe, prévient l'entreprise. IDEMPOTENT : un événement répété ne change rien et n'envoie pas 2 e-mails.
 */
export async function finalizeOnlinePayment(db: SupabaseClient, session: Stripe.Checkout.Session, eventId: string): Promise<string> {
  const orderId = session.metadata?.flash_order_id;
  if (!orderId) return "ignored: pas une commande Flash";
  const { data: order } = await db.from("flash_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) { console.error("Stripe: commande introuvable", orderId); return "ignored: commande introuvable"; }
  const o = order as Order;

  const log = (type: string, details: Record<string, unknown>, visible = false) =>
    db.from("flash_events").upsert(
      { order_id: o.id, organization_id: o.organization_id, event_type: type, actor_kind: "system", details, visible_to_org: visible, external_id: `stripe:${eventId}:${type}` },
      { onConflict: "external_id", ignoreDuplicates: true });

  const check = checkPaidAmounts(session, o);
  if (!check.ok) {
    console.error("Stripe: montant incohérent", o.id, check.reason);
    await log("online_payment_mismatch", { reason: check.reason, session: session.id, amount_total: session.amount_total });
    return `mismatch: ${check.reason}`;
  }

  const { data: confirmed, error } = await db.rpc("flash_confirm_order", { p_order: o.id, p_actor: null, p_mode: "payment", p_reason: null });
  if (error) {
    await log("online_payment_on_closed_order", { reason: error.message, session: session.id, amount_total: session.amount_total });
    console.error("Stripe: confirmation impossible", o.id, error.message);
    return `not confirmed: ${error.message}`;
  }

  // Facture Stripe (PDF/lien) : enregistrée sur la commande pour que l'équipe et l'entreprise la retrouvent.
  let invoiceUrl: string | undefined; let invoicePdf: string | undefined; let invoiceNumber: string | undefined;
  if (typeof session.invoice === "string") {
    try {
      const inv = await getStripe().invoices.retrieve(session.invoice);
      invoiceUrl = inv.hosted_invoice_url ?? undefined; invoicePdf = inv.invoice_pdf ?? undefined; invoiceNumber = inv.number ?? inv.id;
      await db.rpc("flash_mark_invoice", { p_order: o.id, p_actor: null, p_ref: invoiceNumber });
    } catch (e) { console.error("Stripe: facture illisible", e); }
  }
  await log("online_payment", { session: session.id, payment_intent: session.payment_intent, amount_total: session.amount_total, rounding_cents: check.roundingCents, invoice_number: invoiceNumber, invoice_url: invoiceUrl, invoice_pdf: invoicePdf }, true);

  // E-mail « paiement confirmé » : claim atomique, un seul envoi même si Stripe rappelle le webhook.
  const { data: claimed } = await db.from("flash_orders").update({ paid_mail_sent_at: new Date().toISOString() }).eq("id", o.id).is("paid_mail_sent_at", null).select("id");
  if (claimed && claimed.length > 0) {
    const { data: credits } = await db.from("flash_credits").select("status").eq("order_id", o.id);
    const published = (credits ?? []).filter((c) => c.status === "active").length;
    const available = (credits ?? []).filter((c) => c.status === "available").length;
    const ok = await sendFlashMail(await flashRecipients(db, o.organization_id, o.billing?.email), { kind: "payment_confirmed", orderNumber: o.order_number, published, available, invoiceUrl });
    if (!ok) await db.from("flash_orders").update({ paid_mail_sent_at: null }).eq("id", o.id);
  }
  void confirmed;
  return `confirmed ${orderLabel(o.order_number)}`;
}
