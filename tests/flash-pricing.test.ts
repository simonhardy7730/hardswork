import { test } from "node:test";
import assert from "node:assert/strict";
import { flashQuote, formatEuro, daysLeft } from "../src/lib/flash/pricing";

test("grille officielle : 149 / 223,50 / 372,50 / 521,50 / 670,50 € HTVA", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => flashQuote(n).totalHtCents), [14900, 22350, 37250, 52150, 67050]);
});

test("remise de 50 % : une seule fois par commande, uniquement sur la 2e annonce", () => {
  assert.equal(flashQuote(1).discountCents, 0);
  for (const n of [2, 3, 4, 5, 10]) assert.equal(flashQuote(n).discountCents, 7450, `${n} annonces`);
  assert.equal(flashQuote(2).grossCents, 29800); // « au lieu de 298 € »
});

test("TVA et TVAC en centimes entiers", () => {
  const q = flashQuote(2);
  assert.equal(q.vatCents, 4694); // 223,50 × 21 % = 46,935 → 46,94
  assert.equal(q.totalTtcCents, 27044);
  assert.equal(flashQuote(1).vatCents, 3129);
  for (let n = 1; n <= 50; n++) { const x = flashQuote(n); assert.equal(x.totalTtcCents, x.totalHtCents + x.vatCents); assert.ok(Number.isInteger(x.vatCents)); }
});

test("quantité invalide refusée, tarif historique conservé si le prix évolue", () => {
  assert.throws(() => flashQuote(0)); assert.throws(() => flashQuote(1.5)); assert.throws(() => flashQuote(51));
  assert.equal(flashQuote(2, 16000).totalHtCents, 24000); // nouveau tarif = nouvelle commande, pas de recalcul rétroactif
});

test("format monétaire et jours restants", () => {
  assert.equal(formatEuro(22350).replace(/\s/g, " "), "223,50 €");
  assert.equal(formatEuro(-7450), "-74,50 €");
  assert.equal(daysLeft("2026-11-18T23:00:00Z", new Date("2026-10-19T22:00:00Z")), 30);
  // publiée le 20/10 à 09h (heure d'été), expire le 19/11 à 09h (heure d'hiver) : 30 jours, pas 31
  assert.equal(daysLeft("2026-11-19T08:00:00Z", new Date("2026-10-20T07:00:00Z")), 30);
  assert.equal(daysLeft("2026-10-19T21:00:00Z", new Date("2026-10-19T22:00:00Z")), 0);
  assert.equal(daysLeft(null, new Date()), 0);
});

