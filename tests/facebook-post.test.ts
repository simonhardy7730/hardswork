import { test } from "node:test";
import assert from "node:assert/strict";
import { facebookPostParts, facebookPostText } from "../src/lib/social/post-text";

const base = { id: "11111111-1111-1111-1111-111111111111", title: "Technicien de maintenance", city: "Tournai", contract_type: "Intérim / CDI", org_name: "REX Panels" };

test("annonce confidentielle : le vrai nom n'apparaît jamais", () => {
  const p = facebookPostParts({ ...base, hide_company: true });
  assert.ok(!p.message.includes("REX"));
  assert.ok(p.message.includes("Entreprise confidentielle"));
  assert.ok(!facebookPostText({ ...base, hide_company: true }).includes("REX"));
});
test("annonce normale : le nom est affiché, le lien pointe vers wolko.be/jobs/<id>", () => {
  const p = facebookPostParts({ ...base, hide_company: false });
  assert.ok(p.message.includes("REX Panels"));
  assert.equal(p.link, "https://wolko.be/jobs/11111111-1111-1111-1111-111111111111");
  assert.ok(facebookPostText({ ...base, hide_company: false }).includes(p.link));
});
