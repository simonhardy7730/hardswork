import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutPlan, checkPaidAmounts, orderLabel } from "../src/lib/flash/stripe-plan";
import { flashQuote } from "../src/lib/flash/pricing";

const order = (qty: number) => {
  const q = flashQuote(qty);
  return {
    id: "o1", order_number: 7, quantity: qty, unit_price_cents: 14900, discount_cents: q.discountCents,
    total_ht_cents: q.totalHtCents, vat_rate: "21.00", vat_cents: Math.round(q.totalHtCents * 0.21), total_ttc_cents: q.totalHtCents + Math.round(q.totalHtCents * 0.21),
    billing: { email: "a@b.be", vat_number: "BE0123456789" },
  };
};

test("le plan Stripe reprend les prix gelés de la commande (jamais ceux du navigateur)", () => {
  const p = checkoutPlan(order(2));
  assert.equal(p.unitAmountCents, 14900); assert.equal(p.quantity, 2); assert.equal(p.discountCents, 7450); assert.equal(p.vatPercent, 21);
  assert.equal(checkoutPlan(order(1)).discountCents, 0);
  assert.equal(checkoutPlan(order(3)).discountCents, 7450); // une seule remise par commande
  assert.equal(orderLabel(7), "FL-00007");
});

test("paiement conforme : HTVA exact et TVAC identique", () => {
  const o = order(2); // 22350 HT, 4694 TVA, 27044 TTC
  const r = checkPaidAmounts({ currency: "eur", amount_subtotal: 29800, amount_total: o.total_ttc_cents, total_details: { amount_discount: 7450 } }, o);
  assert.deepEqual(r, { ok: true, roundingCents: 0 });
});

test("arrondi de TVA : tolérance d'1 centime seulement, signalée", () => {
  const o = order(2);
  assert.deepEqual(checkPaidAmounts({ currency: "eur", amount_subtotal: 29800, amount_total: o.total_ttc_cents + 1, total_details: { amount_discount: 7450 } }, o), { ok: true, roundingCents: 1 });
  assert.equal(checkPaidAmounts({ currency: "eur", amount_subtotal: 29800, amount_total: o.total_ttc_cents + 2, total_details: { amount_discount: 7450 } }, o).ok, false);
});

test("un montant HTVA ou une devise incohérents ne confirment JAMAIS la commande", () => {
  const o = order(2);
  assert.equal(checkPaidAmounts({ currency: "eur", amount_subtotal: 29800, amount_total: o.total_ttc_cents, total_details: { amount_discount: 0 } }, o).ok, false);
  assert.equal(checkPaidAmounts({ currency: "usd", amount_subtotal: 29800, amount_total: o.total_ttc_cents, total_details: { amount_discount: 7450 } }, o).ok, false);
  assert.equal(checkPaidAmounts({ currency: "eur", amount_subtotal: null, amount_total: null }, o).ok, false);
});
