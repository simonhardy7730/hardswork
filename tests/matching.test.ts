import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreApplication, summarize } from "../src/lib/matching/score";

const offer = { title: "Cariste (H/F)", sector: "logistique", city: "Tournai", required_licenses: ["B"], screening_ids: ["caces", "horaires"], days_needed: ["mon", "tue"], time_slots: ["morning"] };

test("très bon profil = A avec raisons positives", () => {
  const m = scoreApplication(
    { licenses: ["B"], screening_answers: { caces: true, horaires: true }, availability_slots: ["mon:morning", "tue:morning", "wed:evening"] },
    offer, { city: "Tournai", sectors: ["logistique"], experienceRoles: ["Cariste"] });
  assert.equal(m.grade, "A");
  assert.ok(m.good.length >= 4 && m.check.length === 0);
  assert.match(summarize(m, "fr", "Marie"), /^Marie a les permis/);
});
test("permis manquant : plafonné à D, explication « à vérifier »", () => {
  const m = scoreApplication({ licenses: [], screening_answers: { caces: true, horaires: true }, availability_slots: ["mon:morning", "tue:morning"] }, offer, { city: "Tournai", sectors: ["logistique"] });
  assert.ok(["D", "E"].includes(m.grade!));
  assert.ok(m.check.some((c) => /manquants/.test(c.fr)));
});
test("pas de droit de travailler : E", () => {
  const m = scoreApplication({ licenses: ["B"], screening_answers: { travail_be: false, caces: true } }, { ...offer, screening_ids: ["travail_be", "caces"] }, { city: "Tournai" });
  assert.equal(m.grade, "E");
});
test("trop peu d'informations : pas de note inventée", () => {
  const m = scoreApplication({}, { title: "Serveur", sector: "horeca", city: "Mons" }, {});
  assert.equal(m.grade, null);
  assert.match(summarize(m, "fr"), /Pas assez/);
});
test("candidat éloigné et secteur différent : note basse", () => {
  const m = scoreApplication({ licenses: ["B"] }, { ...offer, screening_ids: [], days_needed: [], time_slots: [] }, { city: "Arlon", sectors: ["horeca"] });
  assert.ok(m.grade === "D" || m.grade === "E" || m.grade === "C");
  assert.ok(m.check.some((c) => /km/.test(c.fr)));
});

import { analyzeCv } from "../src/lib/matching/cvtext";
test("lecture du texte d'un CV : permis, métier, années", () => {
  const a = analyzeCv("Marc Dupont — Cariste expérimenté. Permis B. CACES R489 cat 3. 6 ans d'expérience en entrepôt.", ["B", "CACES", "CE"], ["cariste", "magasinier"]);
  assert.deepEqual(a.licenses, ["B", "CACES"]);
  assert.deepEqual(a.titleHits, ["cariste"]);
  assert.equal(a.years, 6);
});
test("un permis lu dans le CV compte et le résumé le dit", () => {
  const m = scoreApplication({ licenses: [] }, { title: "Cariste", sector: "logistique", city: "Tournai", required_licenses: ["B"] },
    { city: "Tournai", cv: { licenses: ["B"], titleHits: ["cariste"], years: 6 } });
  assert.ok(["A", "B"].includes(m.grade!));
  assert.match(summarize(m, "fr", "Marc"), /lu dans son CV/);
  assert.match(summarize(m, "fr", "Marc"), /6 ans d'expérience/);
});
