import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeTrades, tradesFor, MAX_TRADES } from "../src/lib/candidate/trades";
import { sanitizeCv } from "../src/lib/candidate/cv";

test("sanitizeTrades garde des clés connues, sans doublon, max 3", () => {
  assert.deepEqual(sanitizeTrades(["macon", "macon", "inconnu", 4, "soudeur", "cariste", "infirmier"]), ["macon", "soudeur", "cariste"]);
  assert.equal(sanitizeTrades(["macon", "soudeur", "cariste", "infirmier"]).length, MAX_TRADES);
  assert.deepEqual(sanitizeTrades("macon"), []);
});

test("tradesFor filtre par secteur", () => {
  assert.ok(tradesFor(["construction"]).every((t) => t.sector === "construction"));
  assert.ok(tradesFor([]).length > 30);
});

test("sanitizeCv tronque, filtre et limite", () => {
  const cv = sanitizeCv({ headline: "x".repeat(200), experiences: [{ role: "Maçon" }, {}, ...Array(10).fill({ role: "a" })], skills: ["  a ", "", 3], education: [{ title: "VCA" }] });
  assert.equal(cv.headline.length, 90);
  assert.equal(cv.experiences.length, 8);
  assert.deepEqual(cv.skills, ["a"]);
  assert.equal(cv.education[0].title, "VCA");
  assert.deepEqual(sanitizeCv(null).experiences, []);
});

import { sanitizeTradeOther } from "../src/lib/candidate/trades";
test("sanitizeTradeOther nettoie le métier libre", () => {
  assert.equal(sanitizeTradeOther("  Toiletteur <script>  canin "), "Toiletteur script canin");
  assert.equal(sanitizeTradeOther("x".repeat(80))!.length, 60);
  assert.equal(sanitizeTradeOther("   "), null);
  assert.equal(sanitizeTradeOther(3), null);
});
