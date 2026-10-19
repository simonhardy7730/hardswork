// Teste la migration 017 : candidathèque (accès abonnés, consentement, coordonnées masquées, plafond).
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";

const R = new URL("../supabase/migrations/", import.meta.url).pathname;
const db = new PGlite();
const q = async (sql) => (await db.query(sql)).rows;
const as = (uid) => db.exec(`SELECT set_config('app.uid','${uid ?? ""}',false)`);

await db.exec(`
CREATE SCHEMA auth; CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb DEFAULT '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('app.uid', true), '')::uuid $$;
CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;`);
await db.exec(fs.readFileSync(R + "001_initial_schema.sql", "utf8").replace(/CREATE EXTENSION[^;]*;/g, ""));
await db.exec(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS vat_number TEXT;
CREATE OR REPLACE FUNCTION auth_user_can_write() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
ALTER TABLE candidates ADD COLUMN auth_user_id uuid; ALTER TABLE candidates ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE candidates ADD COLUMN job_types text[] NOT NULL DEFAULT '{}', ADD COLUMN is_student boolean NOT NULL DEFAULT false;`);
for (const f of ["015_launch_offer_trial.sql", "016_candidate_visibility.sql", "017_candidate_pool.sql"]) {
  await db.exec(fs.readFileSync(R + f, "utf8"));
}
await db.exec(fs.readFileSync(R + "017_candidate_pool.sql", "utf8")); // rejouable
await db.exec(`CREATE TRIGGER t_org AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_signup();`);

// Deux organisations (essai actif) créées comme à l'inscription
await db.exec(`INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-0000000000a1','r@x.be','{"signup_kind":"organization","org_name":"Acme","org_type":"company","vat_number":"BE0123456789","full_name":"R"}')`);
const U = "00000000-0000-0000-0000-0000000000a1";
assert.equal((await q(`select count(*)::int n from users where id='${U}'`))[0].n, 1);

await db.exec(`INSERT INTO candidates (id, first_name, last_name, phone, email, city, sectors, job_types, auth_user_id, visible_to_recruiters, visibility_consent_at) VALUES
 ('00000000-0000-0000-0000-00000000000c','Camille','Dupont','0470','c@x.be','Tournai','{logistique}','{etudiant}','00000000-0000-0000-0000-0000000000c1', true, now()),
 ('00000000-0000-0000-0000-00000000000d','Dan','Martin','0471','d@x.be','Mons','{construction}','{}','00000000-0000-0000-0000-0000000000d1', false, null),
 ('00000000-0000-0000-0000-00000000000e','Old','Timer','0472','o@x.be','Tournai','{logistique}','{}','00000000-0000-0000-0000-0000000000e1', true, now() - interval '30 months')`);

// Sans session : refusé
await as(null);
await assert.rejects(() => q(`select * from search_candidate_pool()`), /forbidden/);

// Avec essai actif : seul le candidat consentant et récent apparaît, SANS coordonnées
await as(U);
let r = await q(`select * from search_candidate_pool()`);
assert.equal(r.length, 1);
assert.equal(r[0].first_name, "Camille");
assert.equal(r[0].last_initial, "D");
assert.ok(!("email" in r[0]) && !("phone" in r[0]) && !("last_name" in r[0]));
// Filtres
assert.equal((await q(`select * from search_candidate_pool(p_cities => ARRAY['tournai'])`)).length, 1);
assert.equal((await q(`select * from search_candidate_pool(p_cities => ARRAY['mons'])`)).length, 0);
assert.equal((await q(`select * from search_candidate_pool(p_sectors => ARRAY['construction'])`)).length, 0);
assert.equal((await q(`select * from search_candidate_pool(p_job_type => 'etudiant')`)).length, 1);

// Coordonnées : seulement pour un candidat visible ; journalisé
let c = await q(`select * from reveal_candidate_contact('00000000-0000-0000-0000-00000000000c')`);
assert.deepEqual(c, [{ first_name: "Camille", last_name: "Dupont", email: "c@x.be", phone: "0470" }]);
await assert.rejects(() => q(`select * from reveal_candidate_contact('00000000-0000-0000-0000-00000000000d')`), /not_found/); // non consentant
await assert.rejects(() => q(`select * from reveal_candidate_contact('00000000-0000-0000-0000-00000000000e')`), /not_found/); // consentement expiré
assert.equal((await q(`select count(*)::int n from candidate_pool_access`))[0].n, 1);
await q(`select * from reveal_candidate_contact('00000000-0000-0000-0000-00000000000c')`); // déjà révélé : pas de double comptage
assert.equal((await q(`select count(*)::int n from candidate_pool_access`))[0].n, 2); // journal complet, quota sur nouveaux candidats

// Essai expiré : plus d'accès
await as(null);
await db.exec(`UPDATE subscriptions SET trial_ends_at = now() - interval '1 day'`);
await as(U);
await assert.rejects(() => q(`select * from search_candidate_pool()`), /no_access/);
await assert.rejects(() => q(`select * from reveal_candidate_contact('00000000-0000-0000-0000-00000000000c')`), /no_access/);

console.log("sql-017 ok");
