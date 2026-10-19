import { test } from "node:test";
import assert from "node:assert/strict";
import { findCity, distanceKm, citiesWithin, normalizePlace } from "../src/lib/geo/distance";

test("normalisation sans accents", () => { assert.equal(normalizePlace("Liège"), "liege"); });
test("ville connue / inconnue", () => { assert.ok(findCity("tournai")); assert.equal(findCity("Atlantis"), null); });
test("Tournai–Mons ≈ 45–60 km", () => {
  const d = distanceKm(findCity("Tournai")!, findCity("Mons")!);
  assert.ok(d > 35 && d < 65, String(d));
});
test("rayon", () => {
  const near = citiesWithin("Tournai", 25)!.names, far = citiesWithin("Tournai", 100)!.names;
  assert.ok(near.includes("Tournai") && !near.includes("Liège"));
  assert.ok(far.length > near.length);
});

import { regionForCity } from "../src/lib/geo/distance";
test("région déduite de la ville", () => {
  assert.equal(regionForCity("Tournai"), "wallonie");
  assert.equal(regionForCity("Gent"), "flandre");
  assert.equal(regionForCity("Ixelles"), "bruxelles");
  assert.equal(regionForCity("Village inconnu"), "wallonie");
});
