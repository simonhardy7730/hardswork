import test from "node:test";
import assert from "node:assert/strict";
import { whatsappNumber, whatsappLink } from "../src/lib/whatsapp";

test("numéros belges et étrangers", () => {
  assert.equal(whatsappNumber("0470 12 34 56"), "32470123456");
  assert.equal(whatsappNumber("+32 470 12 34 56"), "32470123456");
  assert.equal(whatsappNumber("0032470123456"), "32470123456");
  assert.equal(whatsappNumber("+33 6 12 34 56 78"), "33612345678");
  assert.equal(whatsappNumber("12345"), null);
  assert.equal(whatsappNumber(""), null);
});
test("lien avec message encodé", () => {
  assert.equal(whatsappLink("0470123456", "Bonjour Léa"), "https://wa.me/32470123456?text=Bonjour%20L%C3%A9a");
  assert.equal(whatsappLink("abc"), null);
});
