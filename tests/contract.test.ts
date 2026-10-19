import { test } from "node:test";
import assert from "node:assert/strict";
import { commitmentFor, planCancellation, nextBillingDay, addMonthsYmd, brusselsDay, priceAfterCommitment, renewalReminderDue } from "../src/lib/billing/contract";
import { founderTerms } from "../src/lib/billing/pricing";

const at = (iso: string) => new Date(iso);

test("exemple du cahier des charges : souscription le 15/11/2026", () => {
  const c = commitmentFor(at("2026-11-15T10:00:00+01:00"));
  assert.equal(c.startDay, "2026-11-15");
  assert.equal(c.endDay, "2027-11-14");
  assert.equal(c.noticeDeadlineDay, "2027-10-15");
});

test("fins de mois et année bissextile", () => {
  assert.equal(commitmentFor(at("2027-01-31T12:00:00+01:00")).endDay, "2028-01-30");
  assert.equal(commitmentFor(at("2027-02-28T12:00:00+01:00")).endDay, "2028-02-27");
  assert.equal(commitmentFor(at("2028-02-29T12:00:00+01:00")).endDay, "2029-02-27");
  assert.equal(addMonthsYmd("2027-01-31", 1), "2027-02-28");
  assert.equal(addMonthsYmd("2028-01-31", 1), "2028-02-29");
});

test("fuseau : 23h30 UTC le 14 nov = 00h30 le 15 nov à Bruxelles", () => {
  assert.equal(brusselsDay(at("2026-11-14T23:30:00Z")), "2026-11-15");
  assert.equal(commitmentFor(at("2026-11-14T23:30:00Z")).startDay, "2026-11-15");
});

test("heure d'été / d'hiver : fin = minuit de Bruxelles", () => {
  const c = commitmentFor(at("2026-07-10T10:00:00+02:00")); // fin 9 juil. 2027 (été)
  assert.equal(c.endsAt.toISOString(), "2027-07-09T22:00:00.000Z");
  const w = commitmentFor(at("2026-11-15T10:00:00+01:00")); // fin 14 nov. 2027 (hiver)
  assert.equal(w.endsAt.toISOString(), "2027-11-14T23:00:00.000Z");
});

test("non-reconduction avec préavis : fin à l'échéance", () => {
  const sub = at("2026-11-15T10:00:00+01:00");
  const p = planCancellation(sub, at("2027-10-15T20:00:00+02:00")); // dernier jour du préavis
  assert.equal(p.phase, "initial");
  assert.equal(p.noticeRespected, true);
  assert.equal(p.lastDay, "2027-11-14");
});

test("demande tardive : pas de nouvelle année, fin 30 jours après la demande", () => {
  const sub = at("2026-11-15T10:00:00+01:00");
  const p = planCancellation(sub, at("2027-10-16T09:00:00+02:00"));
  assert.equal(p.noticeRespected, false);
  assert.equal(p.lastDay, "2027-11-15");
  assert.ok(p.endsAt.getTime() > commitmentFor(sub).endsAt.getTime());
});

test("après 12 mois : préavis de 30 jours, mensuel", () => {
  const sub = at("2026-11-15T10:00:00+01:00");
  const p = planCancellation(sub, at("2028-03-01T10:00:00+01:00"));
  assert.equal(p.phase, "indefinite");
  assert.equal(p.noticeRespected, true);
  assert.equal(p.lastDay, "2028-03-31");
});

test("prochaine facturation mensuelle", () => {
  const sub = at("2026-11-30T10:00:00+01:00");
  assert.equal(nextBillingDay(sub, at("2026-12-05T10:00:00+01:00")), "2026-12-30");
  assert.equal(nextBillingDay(sub, at("2027-01-30T10:00:00+01:00")), "2027-02-28");
});

test("tarif de lancement conservé pendant l'engagement, standard ensuite", () => {
  const subscribedAt = at("2026-11-15T10:00:00+01:00");
  const terms = founderTerms("pro", subscribedAt);
  // pendant l'engagement le tarif fondateur est verrouillé (89 €), pas de rétroactivité
  assert.equal(terms.founderPriceCents, 8900);
  // à l'issue des 12 mois : tarif standard 119 €
  assert.equal(priceAfterCommitment("pro", terms, subscribedAt), 11900);
});

test("rappel des 45 jours", () => {
  const sub = at("2026-11-15T10:00:00+01:00"); // fin 14/11/2027 → rappel dès le 30/09/2027
  assert.equal(renewalReminderDue(sub, at("2027-09-29T10:00:00+02:00")), false);
  assert.equal(renewalReminderDue(sub, at("2027-09-30T10:00:00+02:00")), true);
  assert.equal(renewalReminderDue(sub, at("2027-11-15T10:00:00+01:00")), false);
});
