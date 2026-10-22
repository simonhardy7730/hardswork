import test from "node:test";
import assert from "node:assert/strict";

test("plafond d'e-mails non essentiels : refuse au-delà, sans appeler Resend", async () => {
  process.env.NONESSENTIAL_EMAIL_CAP = "0";
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "re_test_dummy"; // le client est créé à l'import ; aucun envoi réel ici
  const { sendBulk, emailBudgetLeft, resetEmailBudget } = await import("../src/lib/email/budget");
  resetEmailBudget();
  assert.equal(emailBudgetLeft(), 0);
  const r = await sendBulk({ from: "a@b.c", to: "d@e.f", subject: "x", html: "y" });
  assert.equal(r.error?.message, "email_budget_exhausted");
});
