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
