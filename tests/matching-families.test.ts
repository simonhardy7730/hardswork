import { test } from "node:test";
import assert from "node:assert/strict";
import { familiesIn, familyHits, relationBetween, familiesForTrades, FAMILIES } from "../src/lib/matching/families";
import { TRADES } from "../src/lib/candidate/trades";
import { analyzeCv, parseExperiences } from "../src/lib/matching/cvtext";
import { scoreApplication, titleWords, offerKeywords, unionMonths, cacesMismatch, summarize } from "../src/lib/matching/score";

const NOW = new Date("2026-10-26");

test("chaque métier proposé aux candidats a sa famille (la table ne laisse aucun trou)", () => {
  for (const t of TRADES) assert.ok(FAMILIES.some((f) => f.trades?.includes(t.key)), `pas de famille pour ${t.key}`);
});
test("les familles n'ont pas d'identifiant en double", () => {
  assert.equal(new Set(FAMILIES.map((f) => f.id)).size, FAMILIES.length);
});

test("synonymes FR/NL : cariste = conducteur de chariot élévateur = heftruckchauffeur", () => {
  for (const txt of ["Cariste (H/F)", "Conducteur de chariot élévateur", "Conductrice de chariots élévateurs", "Heftruckchauffeur", "Opérateur reach truck CACES R489"]) {
    assert.ok(familiesIn(txt).includes("cariste"), txt);
  }
});
test("métiers voisins mais différents : préparateur de commandes n'est pas cariste, mais le même groupe", () => {
  const rel = relationBetween(familiesIn("Cariste"), familiesIn("Préparateur de commandes en entrepôt"));
  assert.equal(rel, "domain");
  assert.equal(relationBetween(familiesIn("Cariste"), familiesIn("Serveuse en brasserie")), "none");
});
test("faux amis évités : mécanicien auto ≠ mécanicien industriel, peintre auto ≠ peintre en bâtiment, nettoyage industriel ≠ ménage", () => {
  assert.equal(relationBetween(familiesIn("Mécanicien auto"), familiesIn("Mécanicien de maintenance industrielle")), "none");
  assert.notEqual(relationBetween(familiesIn("Mécanicien auto"), familiesIn("Mécanicien industriel")), "same");
  assert.notEqual(relationBetween(familiesIn("Peintre en bâtiment"), familiesIn("Peintre automobile")), "same");
  assert.notEqual(relationBetween(familiesIn("Nettoyeur industriel"), familiesIn("Aide ménagère titres-services")), "same");
  assert.deepEqual(familiesIn("Nettoyeur / Nettoyeuse industriel(le)"), ["nettoyeur_industriel"]);
});
test("familyHits donne le terme trouvé ; un mot entier exigé pour les sigles", () => {
  assert.equal(familyHits("Opérateur CNC 5 axes")[0]?.id, "tourneur_fraiseur");
  assert.ok(!familiesIn("cncx machines").includes("tourneur_fraiseur"));
});
test("métiers cochés par le candidat → familles", () => {
  assert.deepEqual(familiesForTrades(["cariste", "macon"]).sort(), ["cariste", "macon"]);
});

test("CV : « conducteur de chariot élévateur » compte comme expérience de cariste (et pas seulement le mot « cariste »)", () => {
  const txt = "Jean Martin\nConducteur de chariot élévateur chez LOGI SA du 03/2019 à 12/2023\nChargement, déchargement, CACES R489 cat 3.";
  const fams = familiesIn("Cariste");
  const cv = analyzeCv(txt, ["B"], titleWords("Cariste"), "logistique", NOW, [], fams);
  assert.equal(cv.exps[0].rel, "same");
  assert.deepEqual(cv.titleHits, ["cariste"]);
  const m = scoreApplication({ licenses: ["B"] }, { title: "Cariste", sector: "logistique", city: "Tournai", required_licenses: ["B"] }, { city: "Tournai", cv, cvStatus: "ok" }, NOW);
  assert.equal(m.grade, "A");
});
test("CV : préparateur de commandes pour une offre de cariste = métier voisin, pas A", () => {
  const txt = "Préparateur de commandes chez DISTRI du 01/2018 à 06/2024\nPicking en entrepôt.";
  const cv = analyzeCv(txt, ["B"], titleWords("Cariste"), "logistique", NOW, [], familiesIn("Cariste"));
  assert.equal(cv.exps[0].rel, "domain");
  const m = scoreApplication({ licenses: ["B"] }, { title: "Cariste", sector: "logistique", city: "Tournai", required_licenses: ["B"] }, { city: "Tournai", cv, cvStatus: "ok" }, NOW);
  assert.ok(m.grade !== "A", `grade=${m.grade}`);
});
test("CV Wolko : le poste « Heftruckchauffeur » compte pour une offre de cariste", () => {
  const m = scoreApplication({ licenses: ["B"] }, { title: "Cariste", sector: "logistique", city: "Tournai", required_licenses: ["B"], screening_ids: [] },
    { city: "Tournai", experienceRoles: ["Heftruckchauffeur"] }, NOW);
  assert.ok(m.rows.some((r) => r.key === "fit" && r.status === "ok"));
});
test("métier coché par le candidat : « conducteur de chariot » ↔ métier « cariste »", () => {
  const m = scoreApplication({ licenses: ["B"] }, { title: "Conducteur de chariot élévateur", sector: "logistique", city: "Tournai", required_licenses: ["B"] }, { city: "Tournai", trades: ["cariste"], sectors: ["logistique"] }, NOW);
  assert.ok(m.rows.some((r) => r.key === "fit" && /précisément ce métier/.test(r.fr)));
});

test("dates : mois en lettres, « à ce jour », mois abrégés avec point, NL", () => {
  const txt = "Soudeur chez ACIER SA oct. 2020 – sept. 2025\nOpérateur CNC chez USIN septembre 2018 à ce jour\nLasser bij METAAL maart 2015 tot december 2017";
  const e = parseExperiences(txt, ["soudeur"], "industrie", NOW, [], familiesIn("Soudeur"));
  assert.equal(e.length, 3);
  assert.equal(e[0].months, 60);
  assert.equal(e[0].rel, "same");
  assert.equal(e[1].end, 2026 * 12 + 9);
  assert.equal(e[2].months, 34);
  assert.equal(e[2].rel, "same");
});
test("dates : « depuis 2019 » compte seulement quand le CV n'a aucune période complète", () => {
  assert.equal(parseExperiences("Cariste depuis 2019 chez LOGI SA", ["cariste"], "logistique", NOW, [], familiesIn("Cariste"))[0]?.rel, "same");
  assert.equal(parseExperiences("Cariste de 2015 à 2017. Depuis 2019 chez LOGI", ["cariste"], "logistique", NOW).length, 1);
});
test("deux emplois en même temps ne sont pas comptés deux fois", () => {
  const e = parseExperiences("Cariste chez A de 01/2020 à 12/2021\nCariste chez B de 06/2021 à 12/2022", ["cariste"], "logistique", NOW);
  assert.equal(e.reduce((x, y) => x + y.months, 0), 24 + 19);
  assert.equal(unionMonths(e), 36); // 01/2020 → 12/2022
});

test("expérience trop ancienne : à confirmer, jamais un A", () => {
  const txt = "Cariste chez LOGI SA du 03/2005 à 12/2012";
  const cv = analyzeCv(txt, ["B"], titleWords("Cariste"), "logistique", NOW, [], familiesIn("Cariste"));
  const m = scoreApplication({ licenses: ["B"] }, { title: "Cariste", sector: "logistique", city: "Tournai", required_licenses: ["B"] }, { city: "Tournai", cv, cvStatus: "ok" }, NOW);
  assert.ok(m.grade !== "A", `grade=${m.grade}`);
  assert.match(summarize(m, "fr", "Paul"), /terminée il y a 13 ans/);
});

test("CACES : une autre catégorie que celle de l'annonce est signalée, pas validée à la légère", () => {
  const offer = { title: "Cariste", sector: "logistique", city: "Tournai", description: "CACES R489 cat 3 exigé", required_licenses: ["CACES"] };
  assert.deepEqual(cacesMismatch(offer, { has_caces: true, caces_types: ["CACES 1"] }), { wanted: ["3"], has: ["CACES 1"] });
  assert.equal(cacesMismatch(offer, { has_caces: true, caces_types: ["CACES 3"] }), null);
  assert.equal(cacesMismatch(offer, { has_caces: true, caces_types: ["CACES R489"] }), null); // catégorie inconnue : on ne tranche pas
  assert.equal(cacesMismatch({ ...offer, description: "CACES exigé" }, { has_caces: true, caces_types: ["CACES 1"] }), null);
  const bad = scoreApplication({ has_caces: true, caces_types: ["CACES 1"], licenses: ["B"] }, { ...offer, required_licenses: ["CACES", "B"] }, { city: "Tournai", experienceRoles: ["Cariste"] }, NOW);
  assert.ok(bad.check.some((c) => /CACES cat\. 3 \(il indique CACES 1\)/.test(c.fr)), JSON.stringify(bad.check));
  const good = scoreApplication({ has_caces: true, caces_types: ["CACES 3"], licenses: ["B"] }, { ...offer, required_licenses: ["CACES", "B"] }, { city: "Tournai", experienceRoles: ["Cariste"] }, NOW);
  assert.ok(good.rows.some((r) => r.key === "licenses" && r.status === "ok"));
});

test("mots importants : inchangé par les familles", () => {
  assert.ok(offerKeywords({ title: "Cariste", description: "Conduite de chariot frontal en entrepôt" }).length > 0);
});

import { compare, parseCsv, toCsv, formatReport } from "../src/lib/matching/bench";
test("outil de mesure : CSV aller-retour, accord exact, à une lettre près, trop généreux / sévère", () => {
  const csv = toCsv([["id", "note", "ta_note"], ["1", "A", "A"], ["2", "B", "C"], ["3", "E", "B"], ["4", "-", "C"], ["5", "C", ""]]);
  const rows = parseCsv(csv);
  assert.deepEqual(rows[1], ["1", "A", "A"]);
  assert.equal(rows.length, 6);
  const r = compare(rows.slice(1).map((x) => ({ id: x[0], calc: x[1] === "-" ? null : x[1], human: x[2] })));
  assert.equal(r.n, 4);          // la ligne 5 n'est pas notée par le recruteur
  assert.equal(r.unscored, 1);   // la ligne 4 : pas de note du code
  assert.equal(r.exact, 1);
  assert.equal(r.withinOne, 2);  // 1 et 2 (B pour C)
  assert.equal(r.tooHigh, 1);    // B calculé pour un recruteur C
  assert.equal(r.tooLow, 1);     // E calculé pour un recruteur B
  assert.equal(r.worst[0].id, "3");
  assert.match(formatReport(r), /Même note que toi : 1\/3/);
});
test("CSV : guillemets, points-virgules et retours à la ligne dans une cellule", () => {
  const rows = parseCsv(toCsv([["a", "b"], ['dit "oui"; puis non', "x\ny"]]));
  assert.deepEqual(rows[1], ['dit "oui"; puis non', "x y"]);
});
