// Teste la migration 024 (Flash) dans un Postgres embarqué (pglite) : prix, essai unique, accès, tarif fondateur.
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
for (const f of ["023_subscription_contract.sql", "024_flash.sql"]) await db.exec(fs.readFileSync(R + f, "utf8"));
await db.exec(fs.readFileSync(R + "024_flash.sql", "utf8")); // rejouable
const uid = (u) => db.exec(`select set_config('app.uid', '${u ?? ""}', false)`);

await db.exec(`INSERT INTO auth.users (email, raw_user_meta_data) VALUES
 ('a@x.be','{"signup_kind":"organization","org_name":"Acme","org_type":"company","vat_number":"BE0123456789","full_name":"A"}'),
 ('b@x.be','{"signup_kind":"organization","org_name":"Beta","org_type":"company","vat_number":"BE0999888777","full_name":"B"}')`);
const A = (await q(`select id from organizations where name='Acme'`))[0].id;
const B = (await q(`select id from organizations where name='Beta'`))[0].id;
const UA = (await q(`select id from auth.users where email='a@x.be'`))[0].id;
const billing = `'{"company_name":"Acme SRL","vat_number":"BE0123456789","address":"Rue 1","postal_code":"7500","city":"Tournai","email":"fact@acme.be","contact":"Jean"}'::jsonb`;
const offer = async (org, title = "Maçon") => (await q(`insert into job_offers (organization_id, created_by, title, description, status, contract_type, sector, city, region) values ('${org}',(select id from users where organization_id='${org}' limit 1),'${title}','d','draft','cdi',(select (enum_range(null::sector_type))[1]),'Tournai','wallonie') returning id`))[0].id;

// Prix : 1 = 149, 2 = 223,50, 3 = 372,50, 4 = 521,50, 5 = 670,50 ; remise une seule fois ; TVA 21 % en centimes
const exp = { 1: [14900, 0, 14900, 3129], 2: [29800, 7450, 22350, 4694], 3: [44700, 7450, 37250, 7823], 4: [59600, 7450, 52150, 10952], 5: [74500, 7450, 67050, 14081] };
for (const n of [1, 2, 3, 4, 5]) {
  await db.exec(`delete from flash_orders where organization_id='${A}'`);
  const o = (await q(`select quantity, unit_price_cents*quantity gross, discount_cents d, total_ht_cents ht, vat_cents v, total_ttc_cents ttc from flash_create_order('${A}','${UA}',${n},${billing},'2026-10',null)`))[0];
  assert.deepEqual([o.gross, o.d, o.ht, o.v], exp[n], `prix pour ${n} annonce(s)`);
  assert.equal(o.ttc, o.ht + o.v);
  assert.equal((await q(`select count(*)::int n from flash_credits where organization_id='${A}'`))[0].n, n, "un crédit par annonce");
}
await db.exec(`delete from flash_orders where organization_id='${A}'`);

// Contrôles de saisie
await assert.rejects(db.exec(`select flash_create_order('${A}','${UA}',0,${billing},'2026-10',null)`), /quantité/);
await assert.rejects(db.exec(`select flash_create_order('${A}','${UA}',1,${billing},'  ',null)`), /conditions/);
await assert.rejects(db.exec(`select flash_create_order('${A}','${UA}',1,'{"company_name":"x"}'::jsonb,'2026-10',null)`), /facturation incomplète/);

// Commande avec 2 brouillons ; anti double-clic ; annonce d'une autre entreprise refusée ; pas de rattachement double
const o1 = await offer(A, "Maçon"), o2 = await offer(A, "Plombier"), ob = await offer(B, "Autre");
const ord = (await q(`select id from flash_create_order('${A}','${UA}',2,${billing},'2026-10',array['${o1}'::uuid,'${o2}'::uuid])`))[0].id;
await assert.rejects(db.exec(`select flash_create_order('${A}','${UA}',2,${billing},'2026-10',null)`), /déjà enregistrée/);
await assert.rejects(db.exec(`select flash_create_order('${B}','${UA}',1,${billing},'2026-10',array['${o1}'::uuid])`), /annonce invalide/);
await assert.rejects(db.exec(`select flash_create_order('${A}','${UA}',1,${billing},'2026-10',array['${ob}'::uuid])`), /annonce invalide/, "annonce d'une autre organisation");
assert.equal((await q(`select count(*)::int n from flash_credits where status='pending' and organization_id='${A}'`))[0].n, 2);

// Rien n'est publié tant que le paiement n'est pas confirmé ; une facture émise n'est pas un paiement
await db.exec(`select flash_mark_invoice('${ord}', null, 'F-2026-001')`);
let st = (await q(`select status, payment_status, invoice_status from flash_orders where id='${ord}'`))[0];
assert.deepEqual(st, { status: "awaiting_payment", payment_status: "pending", invoice_status: "issued" });
assert.equal((await q(`select status from job_offers where id='${o1}'`))[0].status, "draft");

// Confirmation du paiement : les 2 annonces rattachées sont publiées, chacune avec sa propre expiration, idempotent
await db.exec(`select flash_confirm_order('${ord}', null, 'payment')`);
await db.exec(`select flash_confirm_order('${ord}', null, 'payment')`);
const cr = await q(`select status, job_offer_id, published_at is not null p, ((expires_at at time zone 'Europe/Brussels') - (published_at at time zone 'Europe/Brussels'))::text d from flash_credits where order_id='${ord}' order by seq`);
assert.deepEqual(cr.map((c) => [c.status, c.p, c.d]), [["active", true, "30 days"], ["active", true, "30 days"]]);
assert.equal((await q(`select count(*)::int n from flash_events where order_id='${ord}' and event_type='payment_confirmed'`))[0].n, 1, "événement répété = un seul enregistrement");
assert.deepEqual((await q(`select status, expires_at is not null e from job_offers where id='${o1}'`))[0], { status: "active", e: true });

// Visibilité publique : expirée => invisible pour tous (politique RLS)
await db.exec(`create role pub; grant usage on schema public to pub; grant select on job_offers to pub`);
const seen = async () => (await q(`set role pub; select count(*)::int n from job_offers where id='${o1}'`)).at(-1)?.n;
await db.exec(`reset role`);
await db.exec(`update job_offers set expires_at = now() + interval '1 day' where id='${o1}'`);
await db.exec(`set role pub`); assert.equal((await q(`select count(*)::int n from job_offers where id='${o1}'`))[0].n, 1); await db.exec(`reset role`);
await db.exec(`update job_offers set expires_at = now() - interval '1 second' where id='${o1}'`);
await db.exec(`set role pub`); assert.equal((await q(`select count(*)::int n from job_offers where id='${o1}'`))[0].n, 0, "expirée => retirée des résultats publics"); await db.exec(`reset role`);

// Expiration automatique : statut, offre fermée, pas de renouvellement ni de nouvelle commande
await db.exec(`update flash_credits set expires_at = now() - interval '1 second' where job_offer_id='${o1}'`);
assert.deepEqual((await q(`select kind from flash_expire_due()`)).map((r) => r.kind), ["expired"]);
assert.equal((await q(`select status from job_offers where id='${o1}'`))[0].status, "closed");
assert.equal((await q(`select count(*)::int n from flash_orders where organization_id='${A}'`))[0].n, 1, "aucune commande automatique");
assert.equal((await q(`select count(*)::int n from subscriptions where organization_id='${A}' and status='active'`))[0].n, 0, "Flash ne crée aucun abonnement");

// Garde-fous côté utilisateur connecté (navigateur) : pas de changement de date, d'intitulé, ni de réactivation
await uid(UA);
await db.exec(`update job_offers set expires_at = now() + interval '1 year' where id='${o2}'`);
assert.notEqual((await q(`select (expires_at > now() + interval '40 days') as far from job_offers where id='${o2}'`))[0].far, true, "expires_at inchangeable");
await assert.rejects(db.exec(`update job_offers set title='Chauffeur' where id='${o2}'`), /flash_title_locked/);
await assert.rejects(db.exec(`update job_offers set status='active' where id='${o1}'`), /flash_not_active|flash_title/);
await uid(null);

// Flash n'ouvre aucun droit Pro/Agence
assert.equal((await q(`select org_has_access('${A}') a`))[0].a, true, "(essai Pro de 7 jours du compte, indépendant de Flash)");
await db.exec(`update subscriptions set trial_ends_at = now() - interval '1 day' where organization_id='${A}'`);
assert.equal((await q(`select org_has_access('${A}') a`))[0].a, false, "Flash seul ≠ accès Pro (candidathèque, contacts généraux)");

// Isolation : l'entreprise B ne voit ni les commandes ni les crédits de A
await db.exec(`select set_config('app.uid', (select id::text from auth.users where email='b@x.be'), false)`);
await db.exec(`grant select on flash_orders, flash_credits, flash_events to authenticated; grant usage on schema public to authenticated`);
await db.exec(`set role authenticated`);
assert.equal((await q(`select count(*)::int n from flash_orders`))[0].n, 0);
assert.equal((await q(`select count(*)::int n from flash_credits`))[0].n, 0);
await assert.rejects(db.exec(`select flash_confirm_order('${ord}', null, 'payment')`), /permission denied/, "un client ne peut pas valider un paiement");
await db.exec(`reset role`);
await uid(null);

// Paiement différé : motif obligatoire, idempotent, puis paiement confirmé sans re-publier
const o3 = await offer(A, "Carreleur");
const ord2 = (await q(`select id from flash_create_order('${A}','${UA}',1,${billing},'2026-10',array['${o3}'::uuid])`))[0].id;
await assert.rejects(db.exec(`select flash_confirm_order('${ord2}', null, 'deferred', ' ')`), /motif requis/);
await db.exec(`select flash_confirm_order('${ord2}', null, 'deferred', 'Client historique, virement sous 10 j')`);
assert.deepEqual((await q(`select status, payment_status from flash_orders where id='${ord2}'`))[0], { status: "authorized_deferred", payment_status: "pending" });
assert.equal((await q(`select status from flash_credits where order_id='${ord2}'`))[0].status, "active");
const pub1 = (await q(`select published_at::text p from flash_credits where order_id='${ord2}'`))[0].p;
await db.exec(`select flash_confirm_order('${ord2}', null, 'payment')`);
assert.equal((await q(`select published_at::text p from flash_credits where order_id='${ord2}'`))[0].p, pub1, "les 30 jours ne redémarrent pas");

// Crédit publié plus tard (2e annonce) ; 90 jours dépassés => refus ; pas de double activation
const o4 = await offer(A, "Électricien");
const ord3 = (await q(`select id from flash_create_order('${A}','${UA}',2,${billing},'2026-10',array['${o4}'::uuid])`))[0].id;
await db.exec(`select flash_confirm_order('${ord3}', null, 'payment')`);
const free = (await q(`select id from flash_credits where order_id='${ord3}' and status='available'`))[0].id;
const o5 = await offer(A, "Peintre");
await db.exec(`select flash_publish_credit('${free}','${o5}', null)`);
await db.exec(`select flash_publish_credit('${free}','${o5}', null)`); // idempotent
await assert.rejects(db.exec(`select flash_publish_credit('${free}','${o4}', null)`), /non disponible/, "pas de double activation / réutilisation");
const ord4 = (await q(`select id from flash_create_order('${A}','${UA}',2,${billing},'2026-10',array[]::uuid[])`).catch(() => [{ id: null }]))[0].id;
await db.exec(`delete from flash_orders where id='${ord4}'`).catch(() => {});

// Crédits de 90 jours : non activés => périmés
const ordL = (await q(`select id from flash_create_order('${B}','${UA}',1,${billing},'2026-10',null)`))[0].id;
await db.exec(`select flash_confirm_order('${ordL}', null, 'payment')`);
await db.exec(`update flash_credits set activate_before = now() - interval '1 second' where order_id='${ordL}'`);
const ob2 = await offer(B, "Soudeur");
await assert.rejects(db.exec(`select flash_publish_credit((select id from flash_credits where order_id='${ordL}'),'${ob2}', null)`), /90 jours/);
assert.ok((await q(`select kind from flash_expire_due()`)).some((r) => r.kind === "lapsed"));

// Suspension et annulation
await db.exec(`select flash_set_suspension((select id from flash_credits where job_offer_id='${o3}'), null, true, 'Annonce non conforme')`);
assert.equal((await q(`select status from job_offers where id='${o3}'`))[0].status, "paused");
await db.exec(`select flash_set_suspension((select id from flash_credits where job_offer_id='${o3}'), null, false)`);
assert.equal((await q(`select status from job_offers where id='${o3}'`))[0].status, "active");
await assert.rejects(db.exec(`select flash_cancel_order('${ord3}', null, '')`), /motif/);

// Promo Flash → Pro : désactivée par défaut ; activée => 149 € max, une seule fois, jamais consommée deux fois
const sub = (plan = "pro") => db.exec(`select subscribe_organization('${A}','${plan}','2026-10','Devis')`);
await sub();
assert.equal((await q(`select count(*)::int n from promo_credits`))[0].n, 0, "promo désactivée");
await db.exec(`update subscriptions set status='trial', subscribed_at=null, cancel_effective_at=null where organization_id='${A}'`);
await db.exec(`update app_settings set value='true' where key='flash_pro_credit_enabled'`);
await sub();
const pc = (await q(`select amount_cents a, remaining_cents r from promo_credits where organization_id='${A}'`))[0];
assert.deepEqual(pc, { a: 14900, r: 14900 }, "plafonné à 149 €");
assert.equal((await q(`select flash_apply_pro_credit('${A}','2026-11',8900) v`))[0].v, 8900);
assert.equal((await q(`select flash_apply_pro_credit('${A}','2026-11',8900) v`))[0].v, 8900, "même mensualité : pas de double usage");
assert.equal((await q(`select flash_apply_pro_credit('${A}','2026-12',8900) v`))[0].v, 6000, "2e mensualité : 60 € de crédit, 29 € restent dus");
assert.equal((await q(`select flash_apply_pro_credit('${A}','2027-01',8900) v`))[0].v, 0, "crédit épuisé");
await db.exec(`update subscriptions set subscribed_at = now() + interval '1 second' where organization_id='${A}'`);
assert.equal((await q(`select count(*)::int n from promo_credits where organization_id='${A}'`))[0].n, 1, "une seule promo par entreprise");

console.log("OK — migration 024 : tous les tests passent");
