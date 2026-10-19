-- 015 : Offre de lancement WOLKO + essai gratuit de 7 jours (remplace l'abonnement gratuit permanent)
-- Additif et rejouable. Ne modifie PAS les conditions des comptes existants (essais en cours conservés).
-- Retour arrière : voir bas de fichier.

-- ─── 1. Colonnes d'abonnement ────────────────────────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at      TIMESTAMPTZ,  -- début de l'essai (1 essai max par organisation)
  ADD COLUMN IF NOT EXISTS subscribed_at         TIMESTAMPTZ,  -- date de 1re souscription payante
  ADD COLUMN IF NOT EXISTS monthly_price_cents   INTEGER,      -- prix mensuel HT actuel (centimes)
  ADD COLUMN IF NOT EXISTS founder_price_cents   INTEGER,      -- prix de lancement verrouillé (centimes)
  ADD COLUMN IF NOT EXISTS founder_price_ends_at TIMESTAMPTZ;  -- fin du verrouillage = souscription + 12 mois

-- Comptes existants : on retient seulement la date de début d'essai, sans toucher à leurs dates de fin.
UPDATE subscriptions SET trial_started_at = created_at
 WHERE trial_started_at IS NULL AND trial_ends_at IS NOT NULL;

-- ─── 2. Tarifs (source de vérité côté base, alignée sur src/lib/billing/pricing.ts) ─
-- Fin de l'offre de lancement : 1er janvier 2027 à 00:00 heure de Bruxelles.
CREATE OR REPLACE FUNCTION public.launch_offer_active(p_at TIMESTAMPTZ DEFAULT now())
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT p_at < timestamptz '2027-01-01 00:00:00 Europe/Brussels'
$$;

-- Prix mensuels HT en centimes. Starter = ancien plan gratuit : plus de prix (NULL).
CREATE OR REPLACE FUNCTION public.standard_price_cents(p_plan subscription_plan)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plan WHEN 'pro' THEN 11900 WHEN 'agency' THEN 34900 ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.launch_price_cents(p_plan subscription_plan)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plan WHEN 'pro' THEN 8900 WHEN 'agency' THEN 24900 ELSE NULL END
$$;

CREATE OR REPLACE FUNCTION public.plan_price_cents(p_plan subscription_plan, p_at TIMESTAMPTZ DEFAULT now())
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN public.launch_offer_active(p_at) THEN public.launch_price_cents(p_plan)
              ELSE public.standard_price_cents(p_plan) END
$$;

-- ─── 3. Droit d'accès d'une organisation (essai ou abonnement en cours) ─────
-- Essai : jusqu'à trial_ends_at. Abonnement actif : tant que la période payée court.
-- Résilié : accès conservé jusqu'à la fin de la période déjà facturée.
CREATE OR REPLACE FUNCTION public.org_has_access(p_org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions s
     WHERE s.organization_id = p_org
       AND (
         (s.status = 'trial' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now())
         OR (s.status = 'active' AND s.plan IN ('pro', 'agency')
             AND (s.current_period_end IS NULL OR s.current_period_end > now()))
         OR (s.status = 'cancelled' AND s.plan IN ('pro', 'agency')
             AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
       )
  )
$$;
GRANT EXECUTE ON FUNCTION public.org_has_access(UUID) TO authenticated;

-- ─── 4. Souscription (appelée par le futur système de paiement / par l'équipe Wolko) ─
-- Réservée au service_role. Verrouille le prix de lancement 12 mois si la souscription a lieu
-- avant le 1er janvier 2027 (heure de Bruxelles).
CREATE OR REPLACE FUNCTION public.subscribe_organization(p_org UUID, p_plan subscription_plan)
RETURNS subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prior subscriptions;
  v_founder INTEGER; v_founder_end TIMESTAMPTZ; v_price INTEGER; r subscriptions;
BEGIN
  IF p_plan NOT IN ('pro', 'agency') THEN RAISE EXCEPTION 'plan invalide'; END IF;
  SELECT * INTO prior FROM subscriptions WHERE organization_id = p_org;

  IF prior.id IS NULL OR prior.subscribed_at IS NULL THEN
    -- Première souscription
    IF public.launch_offer_active(now()) THEN
      v_founder := public.launch_price_cents(p_plan); v_founder_end := now() + interval '12 months';
    END IF;
  ELSIF prior.founder_price_ends_at IS NOT NULL AND prior.founder_price_ends_at > now() THEN
    -- Changement de formule pendant la fenêtre de 12 mois : on garde la fenêtre d'origine
    v_founder := public.launch_price_cents(p_plan); v_founder_end := prior.founder_price_ends_at;
  END IF;
  v_price := COALESCE(v_founder, public.standard_price_cents(p_plan));

  INSERT INTO subscriptions (organization_id, plan, status, subscribed_at, current_period_end,
                             monthly_price_cents, founder_price_cents, founder_price_ends_at)
  VALUES (p_org, p_plan, 'active', now(), now() + interval '1 month', v_price, v_founder, v_founder_end)
  ON CONFLICT (organization_id) DO UPDATE SET
    plan = EXCLUDED.plan, status = 'active',
    subscribed_at = COALESCE(subscriptions.subscribed_at, EXCLUDED.subscribed_at),
    current_period_end = EXCLUDED.current_period_end,
    monthly_price_cents = EXCLUDED.monthly_price_cents,
    founder_price_cents = EXCLUDED.founder_price_cents,
    founder_price_ends_at = EXCLUDED.founder_price_ends_at
  RETURNING * INTO r;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.subscribe_organization(UUID, subscription_plan) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_organization(UUID, subscription_plan) TO service_role;

-- Prix à facturer au prochain renouvellement (tarif fondateur tant que la fenêtre de 12 mois court).
CREATE OR REPLACE FUNCTION public.subscription_renewal_price_cents(p_org UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN s.founder_price_cents IS NOT NULL AND s.founder_price_ends_at > now()
              THEN s.founder_price_cents ELSE public.standard_price_cents(s.plan) END
    FROM subscriptions s WHERE s.organization_id = p_org
$$;
REVOKE ALL ON FUNCTION public.subscription_renewal_price_cents(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscription_renewal_price_cents(UUID) TO service_role;

-- ─── 5. Inscription entreprise/agence : essai de 7 jours, une seule fois par organisation ─
-- Même numéro de TVA déjà vu avec un essai => pas de nouvel essai (organisation recréée).
CREATE OR REPLACE FUNCTION public.handle_new_organization_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT; v_type organization_type; v_vat TEXT; v_full TEXT; v_org UUID; v_trial_ok BOOLEAN;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'signup_kind', '') <> 'organization' THEN RETURN NEW; END IF;
  v_name := btrim(COALESCE(NEW.raw_user_meta_data->>'org_name', ''));
  IF v_name = '' OR length(v_name) > 120 THEN RETURN NEW; END IF;
  v_type := CASE WHEN NEW.raw_user_meta_data->>'org_type' = 'agency' THEN 'agency'::organization_type ELSE 'company'::organization_type END;
  v_vat  := left(btrim(COALESCE(NEW.raw_user_meta_data->>'vat_number', '')), 20);
  v_full := left(COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email), 120);

  v_trial_ok := v_vat = '' OR NOT EXISTS (
    SELECT 1 FROM organizations o JOIN subscriptions s ON s.organization_id = o.id
     WHERE upper(regexp_replace(o.vat_number, '[^A-Za-z0-9]', '', 'g')) = upper(regexp_replace(v_vat, '[^A-Za-z0-9]', '', 'g'))
       AND s.trial_started_at IS NOT NULL);

  INSERT INTO organizations (name, type, vat_number) VALUES (v_name, v_type, NULLIF(v_vat, '')) RETURNING id INTO v_org;
  INSERT INTO users (id, organization_id, email, full_name, role) VALUES (NEW.id, v_org, NEW.email, v_full, 'admin');
  -- Essai de 7 jours sur la formule correspondante (Pro pour une entreprise, Agence pour une agence).
  INSERT INTO subscriptions (organization_id, plan, status, trial_started_at, trial_ends_at)
  VALUES (v_org, CASE WHEN v_type = 'agency' THEN 'agency'::subscription_plan ELSE 'pro'::subscription_plan END,
          'trial', now(), CASE WHEN v_trial_ok THEN now() + interval '7 days' ELSE now() END);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_organization_signup: %', SQLERRM;
  RETURN NEW;
END $$;

-- ─── 6. Offres d'emploi : publication réservée aux organisations avec accès ─
-- Les brouillons restent possibles ; activer/publier exige un essai en cours ou un abonnement.
DROP POLICY IF EXISTS "job_offers_insert" ON job_offers;
CREATE POLICY "job_offers_insert" ON job_offers FOR INSERT
  WITH CHECK (organization_id = auth_user_organization_id() AND auth_user_can_write()
              AND (status <> 'active' OR public.org_has_access(organization_id)));
DROP POLICY IF EXISTS "job_offers_update" ON job_offers;
CREATE POLICY "job_offers_update" ON job_offers FOR UPDATE
  USING (organization_id = auth_user_organization_id() AND auth_user_can_write())
  WITH CHECK (organization_id = auth_user_organization_id() AND auth_user_can_write()
              AND (status <> 'active' OR public.org_has_access(organization_id)));

-- ─── Retour arrière (si besoin) ─────────────────────────────────────────────
-- Remettre les policies job_offers_insert / job_offers_update de la migration 012 ;
-- recréer handle_new_organization_signup depuis 012 ; les colonnes ajoutées sont inoffensives.
