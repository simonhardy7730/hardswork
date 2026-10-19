import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, stripeEnabled, finalizeOnlinePayment } from "@/lib/flash/stripe";
import { adminClient } from "@/lib/billing/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe. La signature est TOUJOURS vérifiée (corps brut + STRIPE_WEBHOOK_SECRET) : sans elle, 400.
 * Seuls les événements de paiement abouti confirment une commande ; tout est idempotent.
 */
export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "Paiement en ligne non configuré" }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        const result = await finalizeOnlinePayment(adminClient(), session, event.id);
        return NextResponse.json({ received: true, result });
      }
      return NextResponse.json({ received: true, result: "en attente du paiement (méthode différée)" });
    }
    return NextResponse.json({ received: true, ignored: event.type });
  } catch (err) {
    console.error("Webhook Stripe — erreur de traitement", err);
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 }); // Stripe réessaiera
  }
}
