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
