// Teste la migration 023 (contrat) dans un Postgres embarqué (pglite) : prix, essai unique, accès, tarif fondateur.
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
const mig23 = fs.readFileSync(R + "023_subscription_contract.sql", "utf8");
await db.exec(mig23);
await db.exec(mig23); // rejouable
await db.exec(`INSERT INTO auth.users (email, raw_user_meta_data) VALUES ('a@x.be','{"signup_kind":"organization","org_name":"Acme","org_type":"company","vat_number":"BE0123456789","full_name":"A"}')`);
const org = (await q(`select id from organizations where name='Acme'`))[0].id;

// Consentement et version obligatoires
await assert.rejects(db.exec(`select subscribe_organization('${org}','pro','','preuve')`), /version des conditions/);
await assert.rejects(db.exec(`select subscribe_organization('${org}','pro','2026-10','  ')`), /preuve de consentement/);
await assert.rejects(db.exec(`select subscribe_organization('${org}','starter','2026-10','x')`), /plan invalide/);

// Souscription : dates, tarif, consentement, historique
const s = (await q(`select monthly_price_cents m, terms_version v, consent_proof p, consent_at is not null c,
  (commitment_ends_at at time zone 'Europe/Brussels')::text e,
  ((now() at time zone 'Europe/Brussels')::date + interval '12 months')::date::text exp
  from subscribe_organization('${org}','pro','2026-10','Devis D-1')`))[0];
assert.equal(s.m, 8900); assert.equal(s.v, "2026-10"); assert.equal(s.p, "Devis D-1"); assert.equal(s.c, true);
assert.equal(s.e.slice(0, 10), s.exp); assert.match(s.e, /00:00:00$/, "fin à minuit, heure de Bruxelles");
assert.equal((await q(`select count(*)::int n from subscription_events where organization_id='${org}' and event_type='subscribed'`))[0].n, 1);
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, true);

// Changement de formule en cours de contrat : dates conservées
const before = (await q(`select subscribed_at::text a, commitment_ends_at::text b from subscriptions where organization_id='${org}'`))[0];
await db.exec(`select subscribe_organization('${org}','agency','2026-10','Avenant 1')`);
const after = (await q(`select plan, subscribed_at::text a, commitment_ends_at::text b from subscriptions where organization_id='${org}'`))[0];
assert.equal(after.plan, "agency"); assert.equal(after.a, before.a); assert.equal(after.b, before.b);

// Résiliation demandée : accès jusqu'à la date effective, pas après
await db.exec(`update subscriptions set cancel_requested_at=now(), cancel_effective_at = now() + interval '3 days' where organization_id='${org}'`);
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, true);
await db.exec(`update subscriptions set cancel_effective_at = now() - interval '1 second' where organization_id='${org}'`);
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, false, "fin effective passée => plus d'accès");

// Nouvelle souscription après la fin : nouveau contrat, résiliation remise à zéro
await db.exec(`select subscribe_organization('${org}','pro','2026-10','Devis D-2')`);
const re = (await q(`select cancel_effective_at is null n, status from subscriptions where organization_id='${org}'`))[0];
assert.deepEqual(re, { n: true, status: "active" });
assert.equal((await q(`select org_has_access('${org}') a`))[0].a, true);

// Les utilisateurs ne peuvent ni lire l'historique d'une autre organisation ni écrire dedans
await db.exec(`insert into subscription_events (organization_id, event_type, external_id) values ('${org}','payment_received','evt_1')`);
await assert.rejects(db.exec(`insert into subscription_events (organization_id, event_type, external_id) values ('${org}','payment_received','evt_1')`), /duplicate|unique/i, "événement répété refusé");

console.log("OK — migration 023 : tous les tests passent");
