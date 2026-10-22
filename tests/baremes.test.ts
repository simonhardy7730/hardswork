import test from "node:test";
import assert from "node:assert/strict";
import { BAREMES } from "../src/lib/ressources/baremes";
import { GUIDES } from "../src/lib/ressources/guides";

test("barèmes : données cohérentes et sourcées", () => {
  for (const b of BAREMES) {
    assert.ok(b.sources.length > 0 && b.sources.every((s) => s.url.startsWith("https://")));
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(b.enVigueur) && /^\d{4}-\d{2}-\d{2}$/.test(b.verifie));
    assert.ok(b.lignes.every((l) => l.montant > 12 && l.montant < 40));
  }
  const cp124 = BAREMES.find((b) => b.cp === "124")!;
  assert.equal(cp124.lignes[0].montant, 18.747);
  const m = cp124.lignes.map((l) => l.montant);
  assert.ok(m.slice(0, 9).every((v, i, a) => i === 0 || v > a[i - 1])); // barème croissant de manœuvre à contremaître
});

test("guides : slugs uniques et sources présentes", () => {
  assert.equal(new Set(GUIDES.map((g) => g.slug)).size, GUIDES.length);
  assert.ok(GUIDES.every((g) => g.sources.length > 0 && g.points.length > 0));
});
