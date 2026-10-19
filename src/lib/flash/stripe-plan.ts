// Logique pure (sans SDK, sans base) du paiement en ligne Flash : testable et sans effet de bord.
// Règle d'or : les montants viennent TOUJOURS de la commande enregistrée (prix gelés), jamais du navigateur.

export interface PlanOrder {
  id: string; order_number: number; quantity: number; unit_price_cents: number; discount_cents: number;
  total_ht_cents: number; vat_rate: number | string; vat_cents: number; total_ttc_cents: number;
  billing: { company_name?: string; vat_number?: string; email?: string };
}

export const orderLabel = (n: number) => `FL-${String(n).padStart(5, "0")}`;

/** Description des lignes envoyées à Stripe Checkout. La remise Duo est un coupon (montant fixe, une seule utilisation). */
export function checkoutPlan(o: PlanOrder) {
  const product = o.quantity > 1 ? `WOLKO Flash — annonce d'emploi (30 jours) × ${o.quantity}` : "WOLKO Flash — annonce d'emploi (30 jours)";
  return {
    productName: "WOLKO Flash — annonce d'emploi (30 jours)",
    description: product,
    unitAmountCents: o.unit_price_cents,
    quantity: o.quantity,
    discountCents: o.discount_cents,
    discountName: "Remise Flash Duo (−50 % sur la 2e annonce)",
    vatPercent: Number(o.vat_rate),
    label: orderLabel(o.order_number),
  };
}

export interface PaidSessionLike {
  currency?: string | null; amount_subtotal?: number | null; amount_total?: number | null;
  total_details?: { amount_discount?: number | null; amount_tax?: number | null } | null;
}

/**
 * Vérifie qu'un paiement Stripe correspond EXACTEMENT à la commande enregistrée.
 * - HTVA (sous-total − remise) : égalité stricte ; devise : EUR.
 * - TVAC : tolérance d'1 centime au maximum (arrondi de TVA propre à Stripe), signalée dans `roundingCents`.
 */
export function checkPaidAmounts(s: PaidSessionLike, o: Pick<PlanOrder, "total_ht_cents" | "total_ttc_cents">):
  { ok: true; roundingCents: number } | { ok: false; reason: string } {
  if ((s.currency ?? "").toLowerCase() !== "eur") return { ok: false, reason: "devise inattendue" };
  const ht = (s.amount_subtotal ?? NaN) - (s.total_details?.amount_discount ?? 0);
  if (ht !== o.total_ht_cents) return { ok: false, reason: `HTVA payé ${ht} ≠ commande ${o.total_ht_cents}` };
  const diff = (s.amount_total ?? NaN) - o.total_ttc_cents;
  if (!Number.isFinite(diff) || Math.abs(diff) > 1) return { ok: false, reason: `TVAC payé ${s.amount_total} ≠ commande ${o.total_ttc_cents}` };
  return { ok: true, roundingCents: diff };
}
