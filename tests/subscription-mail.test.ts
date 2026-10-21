import { test } from "node:test";
import assert from "node:assert/strict";
process.env.RESEND_API_KEY ??= "re_test_dummy";
type M = Parameters<typeof import("../src/lib/email/subscription").buildSubscriptionMail>[0];
const build = async (m: M) => (await import("../src/lib/email/subscription")).buildSubscriptionMail(m);
import { evaluateAccess } from "../src/lib/billing/pricing";
import { CONTENT } from "../src/lib/billing/pricing-content";

test("e-mail de souscription : récapitulatif prix, engagement, préavis", async () => {
  const { html, subject } = await build({ kind: "subscribed", orgName: "Acme", planName: "Pro", priceCents: 8900, startDay: "2026-11-15", endDay: "2027-11-14", noticeDeadlineDay: "2027-10-15", priceAfterCents: 11900, founder: true, termsVersion: "2026-10" });
  assert.match(subject, /Confirmation/);
  for (const x of ["89", "15 novembre 2026", "14 novembre 2027", "15 octobre 2027", "119", "30 jours", "2026-10"]) assert.ok(html.includes(x), x);
});

test("rappel 45 jours : annonce le changement de tarif", async () => {
  const { html } = await build({ kind: "renewal_reminder", orgName: "Acme", planName: "Pro", endDay: "2027-11-14", noticeDeadlineDay: "2027-10-15", priceCents: 8900, priceAfterCents: 11900 });
  assert.ok(html.includes("tarif standard"));
});

test("résiliation tardive : aucune nouvelle période annuelle", async () => {
  const { html } = await build({ kind: "cancel_confirmation", orgName: "Acme", planName: "Pro", requestedDay: "2027-10-20", lastDay: "2027-11-19", noticeRespected: false });
  assert.ok(html.includes("Aucune nouvelle période annuelle"));
});

test("échappement HTML du nom d'organisation", async () => {
  const { html } = await build({ kind: "trial_expired", orgName: "<script>x</script>" });
  assert.ok(!html.includes("<script>"));
});

test("accès coupé à la date de fin demandée", () => {
  const base = { plan: "pro" as const, status: "active" as const, trial_ends_at: null, current_period_end: "2030-01-01T00:00:00Z" };
  const now = new Date("2027-06-01T10:00:00Z");
  assert.equal(evaluateAccess({ ...base, cancel_effective_at: "2027-06-02T00:00:00Z" }, now).hasAccess, true);
  assert.equal(evaluateAccess({ ...base, cancel_effective_at: "2027-06-01T00:00:00Z" }, now).hasAccess, false);
  assert.equal(evaluateAccess({ ...base }, now).hasAccess, true);
});

test("textes : pas de « résiliable à tout moment » ni de rétractation 14 jours pour l'abonnement payant", () => {
  const all = JSON.stringify(CONTENT).toLowerCase();
  assert.ok(!all.includes("sans frais de résiliation"));
  assert.ok(!all.includes("rétractation"));
  assert.ok(!all.includes("14 jours"));
  assert.ok(CONTENT.contractNote.fr.includes("engagement de 12 mois") && CONTENT.contractNote.fr.includes("Préavis de 30 jours"));
});
