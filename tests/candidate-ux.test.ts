import { test } from "node:test";
import assert from "node:assert/strict";
import { profileCompletion, type CompletionInput } from "../src/lib/candidate/completion";
import { suggestOffers, canPersonalize } from "../src/lib/candidate/suggestions";

const base: CompletionInput = { fullName: "", phone: null, city: null, sectors: [], trades: [], tradeOther: null, jobTypes: [], experienceYears: null, isStudent: false, licenses: [], hasCaces: false, recurringSlots: 0, hasCv: false };

test("complétion : profil vide = 0 %, jamais lié à une candidature", () => {
  assert.equal(profileCompletion(base).percent, 0);
});
test("complétion : étudiant exempté d'expérience, licences seulement si secteur concerné", () => {
  const keys = (i: CompletionInput) => profileCompletion(i).items.map((x) => x.key);
  assert.ok(!keys({ ...base, isStudent: true }).includes("experience"));
  assert.ok(keys(base).includes("experience"));
  assert.ok(!keys({ ...base, sectors: ["horeca"] }).includes("licenses"));
  assert.ok(keys({ ...base, sectors: ["transport"] }).includes("licenses"));
});
test("complétion : profil complet = 100 % et le CV pèse le plus", () => {
  const full: CompletionInput = { ...base, fullName: "A B", phone: "0470", city: "Liège", sectors: ["horeca"], trades: ["x"], jobTypes: ["interim"], experienceYears: 0, recurringSlots: 2, hasCv: true };
  assert.equal(profileCompletion(full).percent, 100);
  const noCv = profileCompletion({ ...full, hasCv: false });
  assert.equal(noCv.missing.length, 1);
  assert.ok(noCv.percent < 80);
});

const offers = [
  { id: "1", title: "Cariste", sector: "logistique", city: "Namur", contract_type: "interim" },
  { id: "2", title: "Serveur", sector: "horeca", city: "Liège", contract_type: "cdi" },
  { id: "3", title: "Maçon", sector: "construction", city: "Hasselt", contract_type: "cdi" },
];
test("suggestions : secteur ou proximité requis, jamais le contrat seul", () => {
  const p = { city: null, sectors: [], trades: [], jobTypes: ["cdi_cdd"] };
  assert.equal(canPersonalize(p), false);
  assert.deepEqual(suggestOffers(p, offers), []);
  const r = suggestOffers({ ...p, sectors: ["horeca"] }, offers);
  assert.deepEqual(r.map((x) => x.offer.id), ["2"]);
  assert.ok(r[0].reasons.includes("sector") && r[0].reasons.includes("contract"));
});
test("suggestions : proximité", () => {
  const r = suggestOffers({ city: "Liège", sectors: [], trades: [], jobTypes: [] }, offers);
  assert.ok(r.some((x) => x.offer.id === "2" && x.reasons.includes("near")));
  assert.ok(!r.some((x) => x.offer.id === "3"));
});
