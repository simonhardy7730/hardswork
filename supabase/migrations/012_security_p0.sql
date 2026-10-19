-- 012 : Sécurité P0 (audit Phase A)
-- Additif et rejouable. Retour arrière : voir bas de fichier.

-- ─── 1. CV : le bucket public devient privé ─────────────────────────────────
-- Plus aucun lien public. Les CV se déposent désormais dans le bucket privé
-- "candidate-documents" (déjà protégé, URL signées de 60 s, propriétaire seul).
UPDATE storage.buckets SET public = false WHERE id = 'candidate-cvs';

-- ─── 2. Inscription entreprise/agence créée CÔTÉ BASE ───────────────────────
-- Avant : le navigateur insérait organisation + utilisateur + abonnement (impossible sans
-- policies permissives = faille). Maintenant : un trigger crée tout à la création du compte,
-- uniquement pour SA propre nouvelle organisation, en tant qu'admin.
CREATE OR REPLACE FUNCTION public.handle_new_organization_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT; v_type organization_type; v_vat TEXT; v_full TEXT; v_org UUID;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'signup_kind', '') <> 'organization' THEN RETURN NEW; END IF;
  v_name := btrim(COALESCE(NEW.raw_user_meta_data->>'org_name', ''));
  IF v_name = '' OR length(v_name) > 120 THEN RETURN NEW; END IF;
  v_type := CASE WHEN NEW.raw_user_meta_data->>'org_type' = 'agency' THEN 'agency'::organization_type ELSE 'company'::organization_type END;
  v_vat  := left(btrim(COALESCE(NEW.raw_user_meta_data->>'vat_number', '')), 20);
  v_full := left(COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email), 120);

  INSERT INTO organizations (name, type, vat_number) VALUES (v_name, v_type, NULLIF(v_vat, '')) RETURNING id INTO v_org;
  INSERT INTO users (id, organization_id, email, full_name, role) VALUES (NEW.id, v_org, NEW.email, v_full, 'admin');
  INSERT INTO subscriptions (organization_id, plan, status, trial_ends_at)
  VALUES (v_org, CASE WHEN v_type = 'agency' THEN 'agency'::subscription_plan ELSE 'starter'::subscription_plan END,
          'trial', now() + interval '30 days');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ne jamais bloquer la création d'un compte à cause de ce trigger.
  RAISE WARNING 'handle_new_organization_signup: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_signup();

-- ─── 3. Table users : plus d'insertion directe, rôle et organisation protégés ─
DROP POLICY IF EXISTS "users_insert" ON users;          -- créations via trigger / accept_team_invite uniquement
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_update_self_or_admin" ON users;
CREATE POLICY "users_update_self_or_admin" ON users FOR UPDATE
  USING (id = auth.uid() OR (organization_id = auth_user_organization_id() AND auth_user_is_admin()))
  WITH CHECK (organization_id = auth_user_organization_id());

DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin" ON users FOR DELETE
  USING (organization_id = auth_user_organization_id() AND auth_user_is_admin() AND id <> auth.uid());

CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;      -- service_role / éditeur SQL
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  -- Le rôle ne change que par un admin, sur un AUTRE membre
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT (auth_user_is_admin() AND OLD.id <> auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_user_columns ON users;
CREATE TRIGGER trg_protect_user_columns BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileged_columns();

-- ─── 4. Organisation : modification réservée aux admins ─────────────────────
DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (id = auth_user_organization_id() AND auth_user_is_admin())
  WITH CHECK (id = auth_user_organization_id());

-- ─── 5. Observateurs (viewer) : lecture seule sur offres et candidatures ────
CREATE OR REPLACE FUNCTION public.auth_user_can_write()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'recruiter'))
$$;

DROP POLICY IF EXISTS "job_offers_insert" ON job_offers;
CREATE POLICY "job_offers_insert" ON job_offers FOR INSERT
  WITH CHECK (organization_id = auth_user_organization_id() AND auth_user_can_write());
DROP POLICY IF EXISTS "job_offers_update" ON job_offers;
CREATE POLICY "job_offers_update" ON job_offers FOR UPDATE
  USING (organization_id = auth_user_organization_id() AND auth_user_can_write());
DROP POLICY IF EXISTS "job_offers_delete" ON job_offers;
CREATE POLICY "job_offers_delete" ON job_offers FOR DELETE
  USING (organization_id = auth_user_organization_id() AND auth_user_can_write());
DROP POLICY IF EXISTS "applications_update" ON applications;
CREATE POLICY "applications_update" ON applications FOR UPDATE
  USING (auth_user_can_write() AND job_offer_id IN (SELECT id FROM job_offers WHERE organization_id = auth_user_organization_id()));

-- ─── 6. Candidatures : plus d'insertion directe depuis le navigateur ────────
-- Elles passent par /api/postuler (validation + protections). Cette policy permettait
-- d'écrire n'importe quoi dans "applications" sans passer par le site.
DROP POLICY IF EXISTS "applications_public_insert" ON applications;

-- ─── 7. Candidat : ne peut pas se rattacher à une organisation ──────────────
DROP POLICY IF EXISTS "candidates_self_update" ON candidates;
CREATE POLICY "candidates_self_update" ON candidates FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid() AND organization_id IS NULL);

-- ─── Retour arrière (si besoin) ─────────────────────────────────────────────
--   DROP TRIGGER on_auth_user_created_org ON auth.users;
--   UPDATE storage.buckets SET public = true WHERE id = 'candidate-cvs';  -- déconseillé
-- Les anciennes policies sont dans 001 (users_insert, users_update, org_update, applications_*).
