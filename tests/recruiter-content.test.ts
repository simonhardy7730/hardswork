import { test } from "node:test";
import assert from "node:assert/strict";
import { RC, DE } from "../src/lib/recruiter-content";
import { CONTENT } from "../src/lib/billing/pricing-content";

function collect(o: unknown, out: { fr: string; nl: string }[] = []) {
  if (o && typeof o === "object") {
    const r = o as Record<string, unknown>;
    if (typeof r.fr === "string" && typeof r.nl === "string") out.push({ fr: r.fr, nl: r.nl });
    else for (const v of Object.values(r)) collect(v, out);
  }
  return out;
}
const all = [...collect(RC), ...collect(DE)];

test("recruteurs : chaque texte existe en FR et en NL, et le NL n'est pas une copie du FR", () => {
  assert.ok(all.length > 40);
  for (const x of all) {
    assert.ok(x.fr.trim() && x.nl.trim());
    if (x.fr.length > 25) assert.notEqual(x.fr, x.nl, `NL identique au FR : ${x.fr}`);
  }
});

test("recruteurs : aucune promesse non démontrée, aucun concurrent cité, aucune intégration annoncée", () => {
  const txt = all.map((x) => `${x.fr} ${x.nl}`).join(" ").toLowerCase();
  for (const bad of ["jobtoolz", "indeed", "stepstone", "des milliers", "en quelques heures", "garantis", "numéro 1", "recrutement garanti", "synchronis"]) {
    if (bad === "synchronis") continue; // autorisé uniquement dans une négation, vérifié ci-dessous
    assert.ok(!txt.includes(bad), `mention interdite : ${bad}`);
  }
  // « synchronisation » n'apparaît que pour dire qu'elle n'existe pas
  for (const x of all) for (const s of [x.fr, x.nl]) {
    if (/synchronis/i.test(s)) assert.match(s.toLowerCase(), /ne se synchronise pas|pas, à ce jour|bestaat vandaag geen|synchroniseert wolko niet|geen automatische|ne se synchronise/);
  }
});

test("page déjà équipé : limites et conditions de l'essai présentes", () => {
  assert.match(DE.limits.items[0].fr, /synchronisation automatique/);
  assert.match(DE.trial.text.fr, /sans carte bancaire/); assert.match(DE.trial.text.fr, /12 mois/); assert.match(DE.trial.text.fr, /30 jours/);
  assert.match(DE.trial.text.nl, /12 maanden/); assert.match(DE.trial.text.nl, /30 dagen/);
  assert.match(RC.trialLine.fr, /sans frais de mise en service/);
});

test("tarifs : « Un accompagnement dès le départ » avec les prestations prévues, Réseau sur devis", () => {
  assert.equal(CONTENT.setupWhy.title.fr, "Un accompagnement dès le départ");
  assert.ok(CONTENT.setupWhy.pro.items.some((i) => i.fr === "Configuration du compte"));
  assert.ok(CONTENT.setupWhy.agency.items.some((i) => i.fr === "Présentation du CRM et de l'ATS"));
  assert.match(CONTENT.setupWhy.network.title.fr, /sur devis/);
  const faq = CONTENT.faqs.find((f) => /ATS/.test(f.q.fr));
  assert.ok(faq && /pas, à ce jour, de synchronisation/.test(faq.a.fr));
});
