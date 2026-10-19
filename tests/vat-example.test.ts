import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidVat } from "../src/lib/vat";

test("l'exemple affiché dans le formulaire est un numéro valide", () => {
  assert.equal(isValidVat("BE 0123.456.749"), true);
  assert.equal(isValidVat("BE 1234.567.899"), false); // clé de contrôle fausse
});
