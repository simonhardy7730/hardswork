import { test } from "node:test";
import assert from "node:assert/strict";
import { formatSalary } from "../src/lib/salary";

test("fourchette, minimum seul, maximum seul, rien", () => {
  assert.equal(formatSalary(4, 6, "heure"), "4–6€/h");
  assert.equal(formatSalary(4, null, "heure"), "dès 4€/h");
  assert.equal(formatSalary(null, 9, "heure", "nl"), "tot 9€/h");
  assert.equal(formatSalary(null, null, "heure"), null);
  assert.ok(!String(formatSalary(4, null, "heure")).includes("null"));
});
