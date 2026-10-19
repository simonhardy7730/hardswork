"use server";

import { revalidatePath } from "next/cache";
import { getPlatformAdmin, can, type PlatformAction } from "@/lib/admin/platform";
import { adminClient } from "@/lib/billing/lifecycle";
import { sendFlashMail, flashRecipients } from "@/lib/email/flash";

type R = { ok: true } | { ok: false; error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guard(action: PlatformAction, id: string) {
  const admin = await getPlatformAdmin();
  if (!admin || !can(admin.role, action)) return { ok: false, error: "Action non autorisée pour votre rôle." } as const;
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: "Identifiant invalide." } as const;
  return { ok: true, admin } as const;
}
const fail = (e: { message?: string } | null): R => ({ ok: false, error: e?.message?.replace(/^.*?:\s*/, "") ?? "Erreur" });

/** Claim atomique d'un envoi d'e-mail (un seul gagnant même si l'action est répétée). */
async function claimMail(db: ReturnType<typeof adminClient>, orderId: string, col: "invoice_mail_sent_at" | "paid_mail_sent_at") {
  const { data } = await db.from("flash_orders").update({ [col]: new Date().toISOString() }).eq("id", orderId).is(col, null).select("*");
  return data && data[0] ? (data[0] as Record<string, unknown>) : null;
}

export async function markInvoiceIssued(orderId: string, invoiceRef: string): Promise<R> {
  const g = await guard("mark_invoice", orderId); if (!g.ok) return g;
  const db = adminClient();
  const { data, error } = await db.rpc("flash_mark_invoice", { p_order: orderId, p_actor: g.admin.userId, p_ref: String(invoiceRef ?? "").slice(0, 80) });
  if (error) return fail(error);
  const o = data as { organization_id: string; order_number: number; total_ht_cents: number; total_ttc_cents: number; billing: { email?: string }; invoice_ref: string };
  if (await claimMail(db, orderId, "invoice_mail_sent_at")) {
    const ok = await sendFlashMail(await flashRecipients(db, o.organization_id, o.billing?.email), { kind: "invoice_issued", orderNumber: o.order_number, invoiceRef: o.invoice_ref, totalHtCents: o.total_ht_cents, totalTtcCents: o.total_ttc_cents });
    if (!ok) await db.from("flash_orders").update({ invoice_mail_sent_at: null }).eq("id", orderId);
  }
  revalidatePath("/admin/flash"); revalidatePath(`/admin/flash/${orderId}`);
  return { ok: true };
}

/** Paiement reçu (après rapprochement bancaire) : confirme, publie les annonces rattachées, informe l'entreprise. Idempotent. */
export async function confirmPayment(orderId: string): Promise<R> {
  const g = await guard("confirm_payment", orderId); if (!g.ok) return g;
  const db = adminClient();
  const { data, error } = await db.rpc("flash_confirm_order", { p_order: orderId, p_actor: g.admin.userId, p_mode: "payment", p_reason: null });
  if (error) return fail(error);
  await afterConfirm(db, data as { id: string; organization_id: string; order_number: number; billing: { email?: string } });
  revalidatePath("/admin/flash"); revalidatePath(`/admin/flash/${orderId}`);
  return { ok: true };
}

/** Publication exceptionnelle avant paiement (motif obligatoire, réservée au rôle owner, journalisée). */
export async function authorizeBeforePayment(orderId: string, reason: string): Promise<R> {
  const g = await guard("authorize_deferred", orderId); if (!g.ok) return g;
  const db = adminClient();
  const { data, error } = await db.rpc("flash_confirm_order", { p_order: orderId, p_actor: g.admin.userId, p_mode: "deferred", p_reason: String(reason ?? "").slice(0, 300) });
  if (error) return fail(error);
  await afterConfirm(db, data as { id: string; organization_id: string; order_number: number; billing: { email?: string } }, true);
  revalidatePath("/admin/flash"); revalidatePath(`/admin/flash/${orderId}`);
  return { ok: true };
}

async function afterConfirm(db: ReturnType<typeof adminClient>, o: { id: string; organization_id: string; order_number: number; billing: { email?: string } }, deferred = false) {
  const { data: credits } = await db.from("flash_credits").select("status").eq("order_id", o.id);
  const published = (credits ?? []).filter((c) => c.status === "active").length;
  const available = (credits ?? []).filter((c) => c.status === "available").length;
  if (deferred) return; // paiement différé : l'e-mail « paiement confirmé » n'est JAMAIS envoyé avant réception réelle
  if (await claimMail(db, o.id, "paid_mail_sent_at")) {
    const ok = await sendFlashMail(await flashRecipients(db, o.organization_id, o.billing?.email), { kind: "payment_confirmed", orderNumber: o.order_number, published, available });
    if (!ok) await db.from("flash_orders").update({ paid_mail_sent_at: null }).eq("id", o.id);
  }
}

export async function cancelOrder(orderId: string, reason: string, refund: boolean): Promise<R> {
  const g = await guard("cancel_order", orderId); if (!g.ok) return g;
  const { error } = await adminClient().rpc("flash_cancel_order", { p_order: orderId, p_actor: g.admin.userId, p_reason: String(reason ?? "").slice(0, 300), p_refund: !!refund });
  if (error) return fail(error);
  revalidatePath("/admin/flash"); revalidatePath(`/admin/flash/${orderId}`);
  return { ok: true };
}

export async function setSuspension(creditId: string, suspend: boolean, reason: string): Promise<R> {
  const g = await guard("suspend", creditId); if (!g.ok) return g;
  const db = adminClient();
  const { data, error } = await db.rpc("flash_set_suspension", { p_credit: creditId, p_actor: g.admin.userId, p_suspend: !!suspend, p_reason: String(reason ?? "").slice(0, 300) });
  if (error) return fail(error);
  revalidatePath("/admin/flash"); revalidatePath(`/admin/flash/${(data as { order_id: string }).order_id}`);
  return { ok: true };
}
