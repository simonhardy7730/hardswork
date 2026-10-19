// Teste la migration 015 dans un Postgres embarqué (pglite) : prix, essai unique, accès, tarif fondateur.
// Usage : npm run test:sql
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";

const R = new URL("../supabase/migrations/", import.meta.url).pathname;
const db = new PGlite();
const q = async (sql) => (await db.query(sql)).rows;

await db.exec(`
CREATE SCHEMA auth; CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb DEFAULT '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('app.uid', true), '')::uuid $$;
CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;`);
await db.exec(fs.readFileSync(R + "001_initial_schema.sql", "utf8").replace(/CREATE EXTENSION[^;]*;/g, ""));
await db.exec(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS vat_number TEXT;
CREATE OR REPLACE FUNCTION auth_user_can_write() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;`);
const mig = fs.readFileSync(R + "015_launch_offer_trial.sql", "utf8");
await db.exec(mig);
await db.exec(mig); // rejouable
await db.exec(`CREATE TRIGGER t_org AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_signup();`);

// Prix et bascule (1er janvier 2027 00:00 Bruxelles = 2026-12-31 23:00 UTC)
assert.equal((await q(`select plan_price_cents('pro','2026-12-31 22:59:59+00') p`))[0].p, 8900);
assert.equal((await q(`select plan_price_cents('pro','2026-12-31 23:00:00+00') p`))[0].p, 11900);
assert.equal((await q(`select plan_price_cents('agency','2026-12-31 22:59:59+00') p`))[0].p, 24900);
assert.equal((await q(`select plan_price_cents('agency','2027-01-01 00:00:00+00') p`))[0].p, 34900);
assert.equal((await q(`select plan_price_cents('starter') p`))[0].p, null);

// Essai : 7 jours, formule Pro (entreprise) / Agence (agence)
await db.exec(`INSERT INTO auth.users (email, raw_user_meta_data) VALUES
 ('a@x.be','{"signup_kind":"organization","org_name":"Acme","org_type":"company","vat_number":"BE 0123.456.789","full_name":"A"}'),
 ('c@x.be','{"signup_kind":"organization","org_name":"Ag","org_type":"agency","vat_number":"BE0999888777","full_name":"C"}')`);
const t = await q(`select o.name, s.plan, s.status, (s.trial_ends_at - s.trial_started_at)::text as dur from subscriptions s join organizations o on o.id=s.organization_id order by o.name`);
assert.deepEqual(t, [
  { name: "Acme", plan: "pro", status: "trial", dur: "7 days" },
  { name: "Ag", plan: "agency", status: "trial", dur: "7 days" },
]);

// Un seul essai par organisation : même TVA (format différent) => essai déjà expiré
await db.exec(`INSERT INTO auth.users (email, raw_user_meta_data) VALUES ('b@x.be','{"signup_kind":"organization","org_name":"Acme bis","org_type":"company","vat_number":"be0123456789","full_name":"B"}')`);
const bis = (await q(`select org_has_access(o.id) a from organizations o where name='Acme bis'`))[0].a;
assert.equal(bis, false, "2e essai pour la même TVA refusé");
// Une organisation ne peut pas avoir deux abonnements (donc pas deux essais)
await assert.rejects(db.exec(`insert into subscriptions (organization_id) select id from organizations where name='Acme'`));

// Accès : essai en cours / expiré
const org = (await q(`select id from organizations where name='Acme'`))[0].id;
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, true);
await db.exec(`update subscriptions set trial_ends_at = now() - interval '1 second' where organization_id='${org}'`);
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, false, "essai expiré => plus d'accès");
// les données de l'organisation restent
assert.equal((await q(`select count(*)::int n from organizations where id='${org}'`))[0].n, 1);

// Souscription pendant le lancement : verrou 12 mois
const s = (await q(`select monthly_price_cents m, founder_price_cents f, founder_price_ends_at > now() + interval '11 months' ok from subscribe_organization('${org}','pro')`))[0];
assert.deepEqual(s, { m: 8900, f: 8900, ok: true });
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, true);
assert.equal((await q(`select subscription_renewal_price_cents('${org}') p`))[0].p, 8900);
// 12 mois écoulés => tarif standard
await db.exec(`update subscriptions set founder_price_ends_at = now() - interval '1 day' where organization_id='${org}'`);
assert.equal((await q(`select subscription_renewal_price_cents('${org}') p`))[0].p, 11900);
// Résilié : accès jusqu'à la fin de période, puis plus rien
await db.exec(`update subscriptions set status='cancelled', current_period_end = now() + interval '5 days' where organization_id='${org}'`);
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, true);
await db.exec(`update subscriptions set current_period_end = now() - interval '1 day' where organization_id='${org}'`);
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, false);
await assert.rejects(db.exec(`select subscribe_organization('${org}','starter')`), /plan invalide/);

console.log("OK — migration 015 : tous les tests passent");
