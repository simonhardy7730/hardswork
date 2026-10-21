import { test } from "node:test";
import assert from "node:assert/strict";
import { cvToken, readCvToken } from "../src/lib/candidate/cv-link";
import { checkCvFile } from "../src/lib/candidate/cv-file";

const ID = "8f14e45f-ceea-467a-9575-3f0c2f7c1a11";

test("lien CV : aller-retour, falsification et expiration", () => {
  const t = cvToken(ID);
  assert.equal(readCvToken(t), ID);
  assert.equal(readCvToken(t.slice(0, -1) + (t.endsWith("A") ? "B" : "A")), null);
  const other = cvToken("00000000-0000-4000-8000-000000000000");
  assert.equal(readCvToken(`${other.split(".")[0]}.${t.split(".")[1]}`), null);
  assert.equal(readCvToken(cvToken(ID, -1)), null);
  assert.equal(readCvToken("n'importe quoi"), null);
});

test("fichier CV reconnu par son contenu", async () => {
  const jpg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])], "IMG_1234");
  assert.equal(await checkCvFile(jpg, 1e6), "image/jpeg");
  const pdf = new File([new TextEncoder().encode("%PDF-1.7 xxxx")], "cv.pdf");
  assert.equal(await checkCvFile(pdf, 1e6), "application/pdf");
  const exe = new File([new TextEncoder().encode("MZ\x90\x00 fake exe")], "cv.pdf");
  assert.equal(await checkCvFile(exe, 1e6), null);
  assert.equal(await checkCvFile(pdf, 3), null);
});

import { sanitizeMini, miniToCv, miniReady, isMiniPath } from "../src/lib/candidate/mini-cv";

test("mini-CV : nettoyage et conversion", () => {
  assert.equal(sanitizeMini(null), null);
  assert.equal(sanitizeMini({ jobs: [{ role: "" }] }), null);
  const m = sanitizeMini({ jobs: [{ role: " Magasinier ", company: "Colruyt", duration: "3y5y" }, { role: "x".repeat(200), duration: "bidon" }, { role: "trop" }], diploma: "VCA" })!;
  assert.equal(m.jobs.length, 2);
  assert.equal(m.jobs[1].role.length, 80);
  assert.equal(m.jobs[1].duration, "");
  assert.ok(miniReady(m));
  const cv = miniToCv(m);
  assert.equal(cv.headline, "Magasinier");
  assert.equal(cv.experiences[0].from, "3 à 5 ans");
  assert.equal(cv.education[0].title, "VCA");
  assert.ok(miniReady(sanitizeMini({ firstJob: true })!));
  assert.ok(isMiniPath("applications/x/mini-cv.wolko.json") && !isMiniPath("applications/x/cv.pdf"));
});

import { sourceFromLanding, sanitizeSource } from "../src/lib/source";

test("provenance : ?g=, utm, referrer", () => {
  assert.equal(sourceFromLanding("?g=Emploi Tournai", ""), "fb:emploi-tournai");
  assert.equal(sourceFromLanding("?utm_source=fb&utm_campaign=groupe-x", ""), "fb:groupe-x");
  assert.equal(sourceFromLanding("", "https://lm.facebook.com/l.php?u=x"), "facebook");
  assert.equal(sourceFromLanding("", "https://www.google.be/"), "google");
  assert.equal(sourceFromLanding("", "https://wolko.be/jobs"), null);
  assert.equal(sourceFromLanding("", ""), null);
  assert.equal(sanitizeSource("FB:Groupe <x>"), "fb:groupe-x-");
});
