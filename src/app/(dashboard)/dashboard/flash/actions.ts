"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/billing/lifecycle";
import { flashQuote, FLASH_MAX_QTY, FLASH_TERMS_VERSION } from "@/lib/flash/pricing";
import { sendFlashMail, flashRecipients } from "@/lib/email/flash";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface FlashBillingInput {
  company_name: string; vat_number: string; address: string; postal_code: string; city: string;
  email: string; contact: string; reference?: string;
}
export type FlashActionResult = { ok: true; orderNumber?: number } | { ok: false; error: string };

async function companyUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single();
  if (!profile || profile.role === "viewer") return null;
  return { supabase, userId: user.id, orgId: profile.organization_id as string };
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Crée UNE commande Flash (quantité 1..n). Prix, remise et TVA sont recalculés côté base (flash_create_order) :
 * les montants envoyés par le navigateur ne comptent jamais. Aucune annonce n'est publiée à ce stade.
 */
export async function createFlashOrder(input: { quantity: number; offerIds: string[]; billing: FlashBillingInput; acceptTerms: boolean }): Promise<FlashActionResult> {
  const ctx = await companyUser();
  if (!ctx) return { ok: false, error: "Connexion requise (rôle recruteur ou administrateur)." };
  const quantity = Number(input?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > FLASH_MAX_QTY) return { ok: false, error: "Nombre d'annonces invalide." };
  if (input.acceptTerms !== true) return { ok: false, error: "Vous devez accepter les conditions commerciales pour confirmer la commande." };

  const offerIds = Array.isArray(input.offerIds) ? input.offerIds.filter((x) => typeof x === "string" && x) : [];
  if (offerIds.length > quantity || offerIds.some((x) => !UUID.test(x)) || new Set(offerIds).size !== offerIds.length) return { ok: false, error: "Sélection d'annonces invalide." };

  const b = input.billing ?? ({} as FlashBillingInput);
  const billing = {
    company_name: clean(b.company_name, 160), vat_number: clean(b.vat_number, 30), address: clean(b.address, 200),
    postal_code: clean(b.postal_code, 12), city: clean(b.city, 80), country: "BE", email: clean(b.email, 160).toLowerCase(),
    contact: clean(b.contact, 120), reference: clean(b.reference, 80),
  };
  for (const k of ["company_name", "vat_number", "address", "postal_code", "city", "email", "contact"] as const) {
    if (!billing[k]) return { ok: false, error: "Veuillez compléter toutes les informations de facturation." };
  }
  if (!EMAIL.test(billing.email)) return { ok: false, error: "L'e-mail de facturation est invalide." };

  // Les brouillons choisis doivent appartenir à l'organisation (RLS) ; la base le revérifie.
  if (offerIds.length) {
    const { data: owned } = await ctx.supabase.from("job_offers").select("id").in("id", offerIds).eq("organization_id", ctx.orgId).eq("status", "draft");
    if ((owned?.length ?? 0) !== offerIds.length) return { ok: false, error: "Une des annonces sélectionnées n'est pas un brouillon de votre organisation." };
  }

  const db = adminClient();
  const { data, error } = await db.rpc("flash_create_order", {
    p_org: ctx.orgId, p_user: ctx.userId, p_qty: quantity, p_billing: billing, p_terms: FLASH_TERMS_VERSION, p_offers: offerIds,
  });
  if (error || !data) {
    const m = error?.message ?? "";
    if (/déjà enregistrée/.test(m)) return { ok: false, error: "Cette commande vient déjà d'être enregistrée (double clic ?). Vérifiez « Mes annonces Flash »." };
    if (/duplicate key|flash_credit_one_live/.test(m)) return { ok: false, error: "Une annonce sélectionnée est déjà rattachée à un crédit Flash." };
    if (/does not exist|flash_create_order/.test(m)) return { ok: false, error: "Le service Flash n'est pas encore activé (migration 024)." };
    return { ok: false, error: "Impossible d'enregistrer la commande. Réessayez ou écrivez-nous à hello@wolko.be." };
  }

  const order = data as { id: string; order_number: number; unit_price_cents: number; discount_cents: number; total_ht_cents: number; vat_cents: number; total_ttc_cents: number };
  const { data: org } = await db.from("organizations").select("name").eq("id", ctx.orgId).maybeSingle();
  const sent = await sendFlashMail(await flashRecipients(db, ctx.orgId, billing.email), {
    kind: "order_confirmation", orgName: (org?.name as string) ?? billing.company_name, orderNumber: order.order_number, quantity,
    unitCents: order.unit_price_cents, discountCents: order.discount_cents, totalHtCents: order.total_ht_cents, vatCents: order.vat_cents, totalTtcCents: order.total_ttc_cents,
  });
  if (sent) await db.from("flash_orders").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", order.id);
  // Alerte interne : l'équipe Wolko reçoit la commande par e-mail (jamais bloquant pour le client).
  const notify = (process.env.ADMIN_NOTIFY_EMAIL ?? "hello@wolko.be").split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
  await sendFlashMail(notify, {
    kind: "admin_new_order", orderId: order.id, orderNumber: order.order_number, orgName: (org?.name as string) ?? billing.company_name,
    quantity, totalHtCents: order.total_ht_cents, totalTtcCents: order.total_ttc_cents,
    contact: String((billing as Record<string, unknown>).contact ?? ""), email: String(billing.email ?? ""),
    vatNumber: String((billing as Record<string, unknown>).vat_number ?? ""), reference: String((billing as Record<string, unknown>).reference ?? "") || undefined,
  }).catch(() => false);
  revalidatePath("/dashboard/flash");
  return { ok: true, orderNumber: order.order_number };
}

/** Publie un crédit « à activer » sur un brouillon : démarre les 30 jours (une seule fois). */
export async function publishFlashCredit(creditId: string, offerId: string): Promise<FlashActionResult> {
  const ctx = await companyUser();
  if (!ctx) return { ok: false, error: "Connexion requise." };
  if (!UUID.test(creditId) || !UUID.test(offerId)) return { ok: false, error: "Demande invalide." };
  // Droits : le crédit et l'annonce doivent appartenir à l'organisation connectée (RLS + vérification explicite).
  const { data: credit } = await ctx.supabase.from("flash_credits").select("id, status, organization_id").eq("id", creditId).maybeSingle();
  const { data: offer } = await ctx.supabase.from("job_offers").select("id, organization_id, status").eq("id", offerId).maybeSingle();
  if (!credit || credit.organization_id !== ctx.orgId || !offer || offer.organization_id !== ctx.orgId) return { ok: false, error: "Annonce ou crédit introuvable." };
  if (credit.status !== "available") return { ok: false, error: "Ce crédit n'est pas disponible (paiement non confirmé, déjà utilisé ou expiré)." };

  const { error } = await adminClient().rpc("flash_publish_credit", { p_credit: creditId, p_offer: offerId, p_actor: ctx.userId, p_kind: "company" });
  if (error) {
    const m = error.message;
    if (/90 jours/.test(m)) return { ok: false, error: "Le délai de 90 jours pour activer ce crédit est dépassé." };
    if (/non disponible/.test(m)) return { ok: false, error: "Ce crédit a déjà été utilisé." };
    return { ok: false, error: "Publication impossible : l'annonce doit être un brouillon (ou une annonce en pause/clôturée) de votre organisation." };
  }
  revalidatePath("/dashboard/flash");
  revalidatePath("/dashboard/offres");
  return { ok: true };
}
