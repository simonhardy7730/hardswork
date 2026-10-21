import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  PRICES, LAUNCH_END, TRIAL_DAYS, addMonths, discountPercent, evaluateAccess, founderTerms,
  isLaunchOfferActive, newSubscriptionPriceCents, publicPrice, renewalPriceCents, trialEndsAt,
  type SubscriptionRow,
} from "../src/lib/billing/pricing";
import { CONTENT } from "../src/lib/billing/pricing-content";

const d = (iso: string) => new Date(iso);

// ── Bascule tarifaire au 1er janvier 2027, 00h00 heure de Bruxelles ─────────────
test("LAUNCH_END = 1er janvier 2027 00:00 Europe/Brussels", () => {
  assert.equal(LAUNCH_END.toISOString(), "2026-12-31T23:00:00.000Z");
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(LAUNCH_END).map((p) => [p.type, p.value])
  );
  assert.deepEqual([parts.year, parts.month, parts.day, parts.hour, parts.minute], ["2027", "01", "01", "00", "00"]);
});

test("prix publics : lancement jusqu'au 31/12/2026 inclus", () => {
  const last = publicPrice("pro", d("2026-12-31T22:59:59Z"));
  assert.deepEqual(last, { price: 89, strikethrough: 119, discount: 25, launch: true });
  assert.deepEqual(publicPrice("agency", d("2026-12-31T22:59:59Z")), { price: 249, strikethrough: 349, discount: 29, launch: true });
  assert.equal(publicPrice("pro", d("2026-10-19T12:00:00Z")).price, 89);
});

test("prix publics : tarifs standards dès le 1er janvier 2027, sans barré ni badge", () => {
  assert.deepEqual(publicPrice("pro", d("2026-12-31T23:00:00Z")), { price: 119, strikethrough: null, discount: null, launch: false });
  assert.deepEqual(publicPrice("agency", d("2027-01-01T00:00:00Z")), { price: 349, strikethrough: null, discount: null, launch: false });
  assert.equal(isLaunchOfferActive(d("2027-06-01T00:00:00Z")), false);
});

test("remises affichées : Pro −25 %, Agence −29 %", () => {
  assert.equal(discountPercent("pro"), 25);
  assert.equal(discountPercent("agency"), 29);
});

// ── Essai de 7 jours ────────────────────────────────────────────────────────────
test("essai : 7 jours calendaires exactement", () => {
  assert.equal(TRIAL_DAYS, 7);
  assert.equal(trialEndsAt(d("2026-10-19T10:00:00Z")).toISOString(), "2026-10-26T10:00:00.000Z");
});

const trial = (endsIso: string | null): SubscriptionRow => ({ plan: "pro", status: "trial", trial_ends_at: endsIso, current_period_end: null });

test("accès : essai en cours puis expiré (à la seconde près)", () => {
  const sub = trial("2026-10-26T10:00:00Z");
  const a = evaluateAccess(sub, d("2026-10-26T09:59:59Z"));
  assert.equal(a.hasAccess, true); assert.equal(a.state, "trial"); assert.equal(a.trialDaysLeft, 1);
  const b = evaluateAccess(sub, d("2026-10-26T10:00:00Z"));
  assert.equal(b.hasAccess, false); assert.equal(b.state, "trial_expired"); assert.equal(b.trialDaysLeft, 0);
});

test("accès : 7 jours restants le jour du démarrage", () => {
  assert.equal(evaluateAccess(trial("2026-10-26T10:00:00Z"), d("2026-10-19T10:00:00Z")).trialDaysLeft, 7);
});

test("accès : un essai sans date de fin n'ouvre aucun accès", () => {
  assert.equal(evaluateAccess(trial(null), d("2026-10-19T10:00:00Z")).hasAccess, false);
});

test("accès : l'ancien plan gratuit (starter) n'a plus d'accès permanent", () => {
  const s: SubscriptionRow = { plan: "starter", status: "active", trial_ends_at: null, current_period_end: null };
  assert.equal(evaluateAccess(s, d("2026-10-19T10:00:00Z")).hasAccess, false);
  assert.equal(evaluateAccess(null, d("2026-10-19T10:00:00Z")).hasAccess, false);
});

test("accès : abonnement actif, résilié (période en cours) puis terminé", () => {
  const now = d("2026-11-10T10:00:00Z");
  assert.equal(evaluateAccess({ plan: "pro", status: "active", trial_ends_at: null, current_period_end: "2026-12-01T00:00:00Z" }, now).state, "active");
  assert.equal(evaluateAccess({ plan: "pro", status: "active", trial_ends_at: null, current_period_end: "2026-11-01T00:00:00Z" }, now).hasAccess, false);
  assert.equal(evaluateAccess({ plan: "agency", status: "cancelled", trial_ends_at: null, current_period_end: "2026-12-01T00:00:00Z" }, now).state, "cancelled_running");
  assert.equal(evaluateAccess({ plan: "agency", status: "cancelled", trial_ends_at: null, current_period_end: "2026-11-01T00:00:00Z" }, now).hasAccess, false);
});

// ── Tarif fondateur : 12 mois à compter de la souscription ──────────────────────
test("fondateur : souscription avant la bascule → prix verrouillé 12 mois", () => {
  const sub = d("2026-11-15T09:00:00Z");
  const t = founderTerms("pro", sub);
  assert.equal(t.founderPriceCents, 8900);
  assert.equal(t.founderEndsAt!.toISOString(), "2027-11-15T09:00:00.000Z");
  // renouvellements pendant les 12 mois : toujours 89 €, même après le 1er janvier 2027
  assert.equal(renewalPriceCents("pro", t, d("2027-01-15T00:00:00Z")), 8900);
  assert.equal(renewalPriceCents("pro", t, d("2027-11-15T08:59:59Z")), 8900);
  // au-delà : tarif standard
  assert.equal(renewalPriceCents("pro", t, d("2027-11-15T09:00:00Z")), 11900);
});

test("fondateur : dernière seconde de l'offre (31/12/2026 23:59:59 Bruxelles) verrouillée jusqu'en décembre 2027", () => {
  const t = founderTerms("agency", d("2026-12-31T22:59:59Z"));
  assert.equal(t.founderPriceCents, 24900);
  assert.equal(t.founderEndsAt!.toISOString(), "2027-12-31T22:59:59.000Z");
});

test("nouveaux clients dès le 1er janvier 2027 : tarif standard, pas de verrouillage", () => {
  const sub = d("2027-01-01T00:00:00Z");
  assert.deepEqual(founderTerms("pro", sub), { founderPriceCents: null, founderEndsAt: null });
  assert.equal(newSubscriptionPriceCents("pro", sub), 11900);
  assert.equal(newSubscriptionPriceCents("agency", sub), 34900);
  assert.equal(newSubscriptionPriceCents("pro", d("2026-12-31T22:59:59Z")), 8900);
  assert.equal(renewalPriceCents("agency", { founderPriceCents: null, founderEndsAt: null }, d("2027-03-01T00:00:00Z")), 34900);
});

test("addMonths : fins de mois", () => {
  assert.equal(addMonths(d("2026-01-31T10:00:00Z"), 1).toISOString(), "2026-02-28T10:00:00.000Z");
  assert.equal(addMonths(d("2027-03-31T10:00:00Z"), 12).toISOString(), "2028-03-31T10:00:00.000Z");
  assert.equal(addMonths(d("2027-02-28T10:00:00Z"), 12).toISOString(), "2028-02-28T10:00:00.000Z");
});

// ── Traductions et cohérence des textes ─────────────────────────────────────────
type Node = unknown;
function collectBi(node: Node, out: { fr: string; nl: string }[] = []) {
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.fr === "string" && typeof o.nl === "string") out.push({ fr: o.fr, nl: o.nl });
    else Object.values(o).forEach((v) => collectBi(v, out));
  }
  return out;
}

test("traductions : chaque texte existe en FR et NL, non vide, et diffère du FR", () => {
  const all = collectBi(CONTENT);
  assert.ok(all.length > 30);
  for (const { fr, nl } of all) {
    assert.ok(fr.trim().length > 0 && nl.trim().length > 0, `texte vide : ${fr}`);
    if (fr.length > 12) assert.notEqual(fr, nl, `NL identique au FR : ${fr}`);
  }
  // badges générés
  assert.equal(CONTENT.labels.launchBadge(25).fr, "OFFRE DE LANCEMENT −25 %");
  assert.match(CONTENT.labels.launchBadge(29).nl, /−29 %/);
});

test("textes imposés par le brief", () => {
  assert.equal(CONTENT.launchBanner.title.fr, "OFFRE DE LANCEMENT WOLKO — JUSQU'AU 31 DÉCEMBRE 2026");
  assert.equal(CONTENT.trial.title.fr, "Essayez WOLKO gratuitement pendant 7 jours !");
  assert.equal(CONTENT.trial.primary.fr, "Démarrer mes 7 jours d'essai");
  assert.equal(CONTENT.trial.secondary.fr, "Demander une démonstration");
  assert.equal(CONTENT.plans.pro.launchCta.fr, "Profiter de l'offre de lancement");
  assert.equal(CONTENT.plans.network.cta.fr, "Demander un devis");
  assert.equal(CONTENT.labels.launchValid.fr, "Tarif de lancement valable jusqu'au 31 décembre 2026");
  assert.equal(PRICES.launch.pro, 89); assert.equal(PRICES.standard.pro, 119);
  assert.equal(PRICES.launch.agency, 249); assert.equal(PRICES.standard.agency, 349);
});

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
}

test("plus aucune trace des anciens tarifs ni de l'abonnement gratuit permanent côté recruteur", () => {
  const files = walk(path.join(__dirname, "../src"));
  const banned = [/79 €\/mois/, /149 €\/mois/, /299 €\/mois/, /"Gratuit", "Gratis"/, /1 offre d'emploi active/, /Contacts candidats masqués/];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const re of banned) assert.ok(!re.test(src), `${path.relative(process.cwd(), f)} contient ${re}`);
  }
});

test("la page tarifs utilise l'horloge du serveur (jamais figée ni côté navigateur)", () => {
  const src = readFileSync(path.join(__dirname, "../src/app/tarifs/page.tsx"), "utf8");
  assert.match(src, /export const dynamic = "force-dynamic"/);
  assert.match(src, /new Date\(\)/);
  assert.ok(!/use client/.test(src));
});

// ── Frais de mise en service ────────────────────────────────────────────────────
import { SETUP_FEES, setupFeeCents, subscriptionQuote } from "../src/lib/billing/pricing";

test("frais de mise en service : Pro 199 €, Agence 499 €", () => {
  assert.deepEqual(SETUP_FEES, { pro: 199, agency: 499 });
  assert.equal(setupFeeCents("pro"), 19900);
  assert.equal(setupFeeCents("agency"), 49900);
});

test("devis de souscription : mensualité + frais, promotion selon la date de souscription (pas de l'essai)", () => {
  const q = subscriptionQuote("pro", d("2026-12-31T22:59:59Z"));
  assert.deepEqual([q.monthlyCents, q.setupFeeCents, q.firstInvoiceCents, q.launch], [8900, 19900, 28800, true]);
  const a = subscriptionQuote("agency", d("2026-12-31T22:59:59Z"));
  assert.deepEqual([a.monthlyCents, a.setupFeeCents, a.firstInvoiceCents], [24900, 49900, 74800]);
  const after = subscriptionQuote("pro", d("2027-01-01T00:00:00Z"));
  assert.deepEqual([after.monthlyCents, after.launch], [11900, false], "1er janvier 2027 : tarif standard");
  assert.equal(subscriptionQuote("agency", d("2027-03-01T00:00:00Z"), false).setupFeeCents, 0, "réactivation : pas de frais");
  assert.equal(q.commitmentMonths, 12); assert.equal(q.noticeDays, 30);
});

test("contenu : frais affichés FR/NL sans mention 'sans engagement' pour l'abonnement payant", () => {
  const C = CONTENT;
  assert.match(C.labels2.setupFee(199).fr, /199 € HTVA/);
  assert.match(C.labels2.setupFee(499).nl, /499 € excl\. btw/);
  assert.match(C.labels2.setupQuote.fr, /sur devis/);
  assert.match(C.contractNote.fr, /12 mois/); assert.match(C.contractNote.nl, /12 maanden/);
  assert.match(C.contractNote.fr, /30 jours/); assert.match(C.contractNote.nl, /30 dagen/);
  assert.match(C.launchGuarantee.fr, /31\/12\/2026/); assert.match(C.launchGuarantee.nl, /31\/12\/2026/);
});
