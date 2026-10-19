import { test } from "node:test";
import assert from "node:assert/strict";
import { keywordGroups } from "../src/lib/search/keywords";

test("un mot cherche dans titre, ville et description", () => {
  const [g] = keywordGroups("Tournai");
  assert.ok(g.includes("city.ilike.*Tournai*"));
  assert.ok(g.includes("title.ilike.*Tournai*"));
  assert.ok(g.includes("description.ilike.*Tournai*"));
});
test("chaque mot est un groupe (ET) ; accents gérés", () => {
  const gs = keywordGroups("électricien Tournai");
  assert.equal(gs.length, 2);
  assert.ok(gs[0].includes("*électricien*") && gs[0].includes("*electricien*"));
});
test("secteur et contrat reconnus", () => {
  assert.ok(keywordGroups("logistique")[0].includes("sector.eq.logistique"));
  assert.ok(keywordGroups("CDI")[0].includes("contract_type.eq.cdi"));
  assert.ok(keywordGroups("intérim")[0].includes("contract_type.eq.interim"));
});
test("caractères dangereux neutralisés", () => {
  const [g] = keywordGroups("a),(x.eq.1");
  assert.ok(!/[()]/.test(g.replace(/\*/g, "")));
});
