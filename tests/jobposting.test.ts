import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJobPosting, jsonLd } from "../src/lib/seo/jobposting";

const base = { id: "abc", title: "Cariste", description: "<p>Conduite</p> de chariots", contract_type: "cdi", city: "Tournai",
  created_at: "2026-10-19T08:00:00Z", salary_min: 14, salary_max: 17, salary_period: "heure", show_salary: true };

test("offre complète", () => {
  const p = buildJobPosting(base, "Acme") as any;
  assert.equal(p.employmentType, "FULL_TIME");
  assert.equal(p.description, "Conduite de chariots");
  assert.equal(p.datePosted, "2026-10-19");
  assert.equal(p.baseSalary.value.unitText, "HOUR");
  assert.equal(p.url, "https://wolko.be/jobs/abc");
});
test("salaire masqué : absent", () => {
  assert.equal((buildJobPosting({ ...base, show_salary: false }, "Acme") as any).baseSalary, undefined);
});
test("script sûr", () => { assert.ok(!jsonLd({ a: "</script><b>" }).includes("</script>")); });

import { regionOf } from "../src/lib/seo/jobposting";
test("JobPosting : région belge et salaire sans maximum", () => {
  assert.equal(regionOf("7500", "Tournai"), "Hainaut");
  assert.equal(regionOf(null, "Mouscron"), "Hainaut");
  assert.equal(regionOf("1000", "Bruxelles"), "Bruxelles-Capitale");
  assert.equal(regionOf(null, "Ville inconnue"), null);
  const base = { id: "x", title: "t", description: "d", contract_type: "cdi", city: "Tournai", postal_code: "7500", created_at: "2026-10-20T10:00:00Z", salary_period: "heure", show_salary: true };
  const fixe = buildJobPosting({ ...base, salary_min: 14, salary_max: null }, "Wolko") as { baseSalary: { value: Record<string, unknown> }; jobLocation: { address: Record<string, unknown> } };
  assert.equal(fixe.baseSalary.value.value, 14);
  assert.equal("maxValue" in fixe.baseSalary.value, false);
  assert.equal(fixe.jobLocation.address.addressRegion, "Hainaut");
  const fourchette = buildJobPosting({ ...base, salary_min: 14, salary_max: 16 }, "Wolko") as { baseSalary: { value: Record<string, unknown> } };
  assert.equal(fourchette.baseSalary.value.maxValue, 16);
});
