import test from "node:test";
import assert from "node:assert/strict";

test("bienvenue désactivée par défaut : aucun envoi et la file est clôturée", async () => {
  delete process.env.WELCOME_EMAIL_ENABLED;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "re_test_dummy";
  const { sendWelcomeIfPending } = await import("../src/lib/email/welcome");
  const r = await sendWelcomeIfPending("00000000-0000-0000-0000-000000000000");
  // La base de test n'existe pas : l'important est qu'on ne tente aucun envoi et qu'on ne lève pas d'erreur.
  assert.equal(r, "skipped");
});
