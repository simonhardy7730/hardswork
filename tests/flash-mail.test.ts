import { test } from "node:test";
import assert from "node:assert/strict";

process.env.RESEND_API_KEY ??= "re_test_dummy";
type M = Parameters<typeof import("../src/lib/email/flash").buildFlashMail>[0];
const build = async (m: M) => (await import("../src/lib/email/flash")).buildFlashMail(m);

test("confirmation de commande Duo : lignes, remise, totaux, pas de paiement annoncé", async () => {
  const { html } = await build({ kind: "order_confirmation", orgName: "Acme", orderNumber: 7, quantity: 2, unitCents: 14900, discountCents: 7450, totalHtCents: 22350, vatCents: 4694, totalTtcCents: 27044 });
  for (const x of ["FL-00007", "298,00", "-74,50", "223,50", "270,44", "après confirmation de la réception du paiement"]) assert.ok(html.replace(/\u00a0|\u202f/g, " ").includes(x), x);
  assert.ok(!/paiement (a été |est )?(reçu|confirmé)/i.test(html.replace("après confirmation de la réception du paiement", "")));
});

test("facture émise : jamais présentée comme un paiement", async () => {
  const { html } = await build({ kind: "invoice_issued", orderNumber: 7, invoiceRef: "F-2026-001", totalHtCents: 22350, totalTtcCents: 27044 });
  assert.ok(html.includes("n\'est pas une confirmation de paiement"));
});

test("rappels, expiration (renouvellement volontaire) et proposition Pro", async () => {
  assert.match((await build({ kind: "reminder", jobTitle: "Maçon", daysLeft: 7, expiresAt: "2026-11-18T23:00:00Z" })).subject, /7 jours/);
  assert.match((await build({ kind: "reminder", jobTitle: "Maçon", daysLeft: 2, expiresAt: "2026-11-18T23:00:00Z" })).subject, /2 jours/);
  const exp = await build({ kind: "expired", jobTitle: "Maçon" });
  assert.ok(exp.html.includes("Aucun renouvellement automatique") || exp.html.includes("aucun renouvellement automatique"));
  assert.ok((await build({ kind: "pro_proposal", orgName: "Acme" })).html.includes("engagement initial de 12 mois"));
});

test("échappement HTML", async () => {
  const { html } = await build({ kind: "reminder", jobTitle: "<img src=x onerror=1>", daysLeft: 2, expiresAt: "2026-11-18T23:00:00Z" });
  assert.ok(!html.includes("<img src=x"));
});
