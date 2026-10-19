import { test } from "node:test";
import assert from "node:assert/strict";
import { friendlyAuthError } from "../src/lib/auth-errors";

const l = (fr: string) => fr;
test("quota d'envoi global", () => {
  assert.match(friendlyAuthError("email rate limit exceeded", l), /Beaucoup d'inscriptions/);
  assert.match(friendlyAuthError("Error sending confirmation email", l), /Réessayez dans quelques minutes/);
});
test("limite par adresse et doublon", () => {
  assert.match(friendlyAuthError("For security purposes, you can only request this after 50 seconds", l), /50 secondes/);
  assert.match(friendlyAuthError("User already registered", l), /déjà un compte/);
});
