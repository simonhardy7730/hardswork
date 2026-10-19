// Teste la migration 016 : visibilité candidat (opt-in, horodatée, limitée à son propre profil).
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";

const R = new URL("../supabase/migrations/", import.meta.url).pathname;
const db = new PGlite();
const q = async (sql) => (await db.query(sql)).rows;

await db.exec(`
CREATE SCHEMA auth; CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role;
CREATE TABLE auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('app.uid', true), '')::uuid $$;
CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;`);
await db.exec(fs.readFileSync(R + "001_initial_schema.sql", "utf8").replace(/CREATE EXTENSION[^;]*;/g, ""));
await db.exec(`ALTER TABLE candidates ADD COLUMN auth_user_id uuid; ALTER TABLE candidates ALTER COLUMN organization_id DROP NOT NULL;`);
const mig = fs.readFileSync(R + "016_candidate_visibility.sql", "utf8");
await db.exec(mig);
await db.exec(mig); // rejouable

const a = "00000000-0000-0000-0000-00000000000a", b = "00000000-0000-0000-0000-00000000000b";
await db.exec(`INSERT INTO candidates (auth_user_id, first_name, last_name, phone) VALUES ('${a}','A','A','1'),('${b}','B','B','2')`);

// Par défaut : invisible
assert.deepEqual(await q(`select count(*)::int n from candidates where visible_to_recruiters`), [{ n: 0 }]);

// A accepte : seul A change, avec horodatage et version
await db.exec(`SELECT set_config('app.uid','${a}',false)`);
await db.exec(`SELECT set_candidate_visibility(true,'v1')`);
let r = await q(`select first_name, visible_to_recruiters v, visibility_consent_at is not null has_ts, visibility_consent_version ver from candidates order by first_name`);
assert.deepEqual(r, [
  { first_name: "A", v: true, has_ts: true, ver: "v1" },
  { first_name: "B", v: false, has_ts: false, ver: null },
]);

// Retrait : preuve effacée, plus visible
await db.exec(`SELECT set_candidate_visibility(false,'v1')`);
r = await q(`select visible_to_recruiters v, visibility_consent_at is null no_ts from candidates where first_name='A'`);
assert.deepEqual(r, [{ v: false, no_ts: true }]);

// Sans session : refusé
await db.exec(`SELECT set_config('app.uid','',false)`);
await assert.rejects(() => db.exec(`SELECT set_candidate_visibility(true,'v1')`), /forbidden/);

console.log("sql-016 ok");
