// Teste la migration 035 (frais de mise en service) dans un Postgres embarqué (pglite) : prix, essai unique, accès, tarif fondateur.
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
await db.exec(mig23);
const mig35 = fs.readFileSync(R + "035_setup_fee.sql", "utf8");
await db.exec(mig35);
await db.exec(mig35); // rejouable
await db.exec(`INSERT INTO auth.users (email, raw_user_meta_data) VALUES ('a@x.be','{"signup_kind":"organization","org_name":"Acme","org_type":"company","vat_number":"BE0123456789","full_name":"A"}')`);
const org = (await q(`select id from organizations where name='Acme'`))[0].id;


const fee = async (o) => (await q(`select setup_fee_cents c, setup_fee_status st, setup_fee_reference ref from subscriptions where organization_id='${o}'`))[0];
const newOrg = async (name, type, vat) => {
  await db.exec(`INSERT INTO auth.users (email, raw_user_meta_data) VALUES ('${name}@x.be','{"signup_kind":"organization","org_name":"${name}","org_type":"${type}","vat_number":"${vat}","full_name":"A"}')`);
  return (await q(`select id from organizations where name='${name}'`))[0].id;
};

// 1-2. Essai : aucun frais
const pme = await newOrg("Pme", "company", "BE0111111111");
const ag = await newOrg("Agence", "agency", "BE0222222222");
assert.deepEqual(await fee(pme), { c: null, st: null, ref: null }, "PME en essai : aucun frais");
assert.deepEqual(await fee(ag), { c: null, st: null, ref: null }, "agence en essai : aucun frais");

// 4-5. Souscription : 199 € Pro / 499 € Agence, statut « due »
await db.exec(`select subscribe_organization('${pme}','pro','2026-10','Devis P1')`);
await db.exec(`select subscribe_organization('${ag}','agency','2026-10','Devis A1')`);
assert.deepEqual(await fee(pme), { c: 19900, st: "due", ref: null });
assert.deepEqual(await fee(ag), { c: 49900, st: "due", ref: null });
assert.equal((await q(`select (details->>'setup_fee_cents')::int c from subscription_events where organization_id='${pme}' and event_type='subscribed'`))[0].c, 19900);

// Changement de formule en cours de contrat : pas de nouveaux frais
await db.exec(`select subscribe_organization('${pme}','agency','2026-10','Avenant')`);
assert.deepEqual(await fee(pme), { c: 19900, st: "due", ref: null }, "pas de frais supplémentaires lors d'un changement de formule");

// 7. Jamais facturés deux fois
await assert.rejects(db.exec(`select mark_setup_fee('${pme}','invoiced','')`), /numéro de facture/);
await db.exec(`select mark_setup_fee('${pme}','invoiced','F-1')`);
await assert.rejects(db.exec(`select mark_setup_fee('${pme}','invoiced','F-2')`), /déjà facturés/);
await assert.rejects(db.exec(`select mark_setup_fee('${pme}','waived',null)`), /non facturés/);
await db.exec(`select mark_setup_fee('${pme}','paid',null)`);
assert.deepEqual(await fee(pme), { c: 19900, st: "paid", ref: "F-1" });
await assert.rejects(db.exec(`select mark_setup_fee('${pme}','paid',null)`), /déjà payés/);

// Réactivation après fin de contrat : aucun nouveau frais, l'historique des frais est conservé
await db.exec(`update subscriptions set cancel_requested_at=now(), cancel_effective_at = now() - interval '1 second' where organization_id='${pme}'`);
await db.exec(`select subscribe_organization('${pme}','pro','2026-10','Devis P2')`);
assert.deepEqual(await fee(pme), { c: 19900, st: "paid", ref: "F-1" }, "une réactivation ne refacture pas les frais");

// 11. Contrats existants (souscrits avant 035) : jamais de frais rétroactifs
const old = await newOrg("Ancien", "company", "BE0333333333");
await db.exec(`update subscriptions set status='active', subscribed_at=now() - interval '3 months', current_period_end=now() + interval '1 month', monthly_price_cents=8900 where organization_id='${old}'`);
assert.deepEqual(await fee(old), { c: null, st: null, ref: null });
await db.exec(`update subscriptions set cancel_effective_at = now() - interval '1 second' where organization_id='${old}'`);
await db.exec(`select subscribe_organization('${old}','pro','2026-10','Devis O2')`);
assert.deepEqual(await fee(old), { c: null, st: null, ref: null }, "ancien client : pas de frais rétroactifs");

// Exonération possible tant que non facturés
const w = await newOrg("Offert", "company", "BE0444444444");
await db.exec(`select subscribe_organization('${w}','pro','2026-10','Devis W')`);
await db.exec(`select mark_setup_fee('${w}','waived',null)`);
assert.equal((await fee(w)).st, "waived");
// Incohérence interdite : montant sans statut
await assert.rejects(db.exec(`update subscriptions set setup_fee_status=null where organization_id='${w}'`), /coherent|check/i);

// Starter/essai : fonction de frais
assert.equal((await q(`select setup_fee_cents_for('pro') p, setup_fee_cents_for('agency') a, setup_fee_cents_for('starter') s`))[0].s, null);

console.log("OK — migration 035 : tous les tests passent");
