import { test } from "node:test";
import assert from "node:assert/strict";
import { ageFromBirthDate } from "../src/lib/candidate/age";

const NOW = new Date("2026-10-19T12:00:00Z");
test("âge exact autour de l'anniversaire", () => {
  assert.equal(ageFromBirthDate("2008-10-19", NOW), 18);
  assert.equal(ageFromBirthDate("2008-10-20", NOW), 17);
  assert.equal(ageFromBirthDate("2011-10-19", NOW), 15);
});
test("dates invalides refusées", () => {
  assert.equal(ageFromBirthDate("2008-02-30", NOW), null);
  assert.equal(ageFromBirthDate("19/10/2000", NOW), null);
  assert.equal(ageFromBirthDate("2030-01-01", NOW), null);
  assert.equal(ageFromBirthDate("1900-01-01", NOW), null);
});
