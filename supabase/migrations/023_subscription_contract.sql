-- 023 : contrat d'abonnement B2B (engagement 12 mois, préavis, résiliation, historique, preuve de consentement).
-- Additif et rejouable. Les règles de fonctionnement sont celles de WOLKO ; les clauses restent à valider par un juriste belge.

-- ─── 1. Colonnes de contrat ──────────────────────────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS commitment_ends_at       TIMESTAMPTZ,  -- fin de l'engagement initial (minuit Bruxelles suivant le dernier jour)
  ADD COLUMN IF NOT EXISTS terms_version            TEXT,         -- version des conditions acceptées
  ADD COLUMN IF NOT EXISTS consent_at               TIMESTAMPTZ,  -- date du consentement explicite
  ADD COLUMN IF NOT EXISTS consent_proof            TEXT,         -- preuve (réf. devis / bon de commande signé / e-mail)
  ADD COLUMN IF NOT EXISTS cancel_requested_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_effective_at      TIMESTAMPTZ,  -- fin d'accès demandée (après cet instant : plus d'accès)
  ADD COLUMN IF NOT EXISTS cancel_notice_respected  BOOLEAN,
  ADD COLUMN IF NOT EXISTS trial_reminder_sent_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_expired_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_sent_at              TIMESTAMPTZ;

-- ─── 2. Historique horodaté (lecture par l'organisation, écriture par le serveur uniquement) ─
CREATE TABLE IF NOT EXISTS subscription_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  actor_user_id   UUID,
  details         JSONB NOT NULL DEFAULT '{}'::jsonb,
  external_id     TEXT UNIQUE,  -- identifiant d'événement d'un futur prestataire de paiement (idempotence)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events(organization_id, created_at DESC);
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_events_select" ON subscription_events;
CREATE POLICY "subscription_events_select" ON subscription_events FOR SELECT
  USING (organization_id = auth_user_organization_id());
-- Aucune policy INSERT/UPDATE/DELETE : seul le service_role (serveur) écrit.

-- ─── 3. Accès : une fin demandée coupe l'accès à la date effective ──────────
CREATE OR REPLACE FUNCTION public.org_has_access(p_org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions s
     WHERE s.organization_id = p_org
       AND (
         (s.status = 'trial' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now())
         OR (s.status = 'active' AND s.plan IN ('pro', 'agency')
             AND (s.current_period_end IS NULL OR s.current_period_end > now())
             AND (s.cancel_effective_at IS NULL OR s.cancel_effective_at > now()))
         OR (s.status = 'cancelled' AND s.plan IN ('pro', 'agency')
             AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
       )
  )
$$;
GRANT EXECUTE ON FUNCTION public.org_has_access(UUID) TO authenticated;

-- ─── 4. Souscription : consentement + version des conditions obligatoires ───
-- Réservée au service_role (équipe Wolko, après accord explicite du client). Exemple :
--   select subscribe_organization('<org uuid>', 'pro', '2026-10', 'Devis D-2026-014 signé le 15/11/2026');
DROP FUNCTION IF EXISTS public.subscribe_organization(UUID, subscription_plan);
CREATE OR REPLACE FUNCTION public.subscribe_organization(p_org UUID, p_plan subscription_plan, p_terms_version TEXT, p_consent_proof TEXT)
RETURNS subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prior subscriptions; running BOOLEAN;
  v_founder INTEGER; v_founder_end TIMESTAMPTZ; v_price INTEGER; v_commit TIMESTAMPTZ; r subscriptions;
BEGIN
  IF p_plan NOT IN ('pro', 'agency') THEN RAISE EXCEPTION 'plan invalide'; END IF;
  IF COALESCE(btrim(p_terms_version), '') = '' THEN RAISE EXCEPTION 'version des conditions requise'; END IF;
  IF COALESCE(btrim(p_consent_proof), '') = '' THEN RAISE EXCEPTION 'preuve de consentement requise'; END IF;
  SELECT * INTO prior FROM subscriptions WHERE organization_id = p_org;

  -- Contrat en cours (non résilié) : simple changement de formule, les dates d'origine sont conservées.
  running := prior.id IS NOT NULL AND prior.status = 'active' AND prior.subscribed_at IS NOT NULL
             AND prior.cancel_effective_at IS NULL;

  IF running THEN
    IF prior.founder_price_ends_at IS NOT NULL AND prior.founder_price_ends_at > now() THEN
      v_founder := public.launch_price_cents(p_plan); v_founder_end := prior.founder_price_ends_at;
    END IF;
    v_price := COALESCE(v_founder, public.standard_price_cents(p_plan));
    UPDATE subscriptions SET plan = p_plan, monthly_price_cents = v_price,
           founder_price_cents = v_founder, founder_price_ends_at = v_founder_end
     WHERE organization_id = p_org RETURNING * INTO r;
    INSERT INTO subscription_events (organization_id, event_type, details)
    VALUES (p_org, 'plan_changed', jsonb_build_object('plan', p_plan, 'monthly_price_cents', v_price));
    RETURN r;
  END IF;

  -- Nouveau contrat (1re souscription, ou nouvelle souscription après la fin d'un contrat)
  IF public.launch_offer_active(now()) THEN
    v_founder := public.launch_price_cents(p_plan); v_founder_end := now() + interval '12 months';
  END IF;
  v_price := COALESCE(v_founder, public.standard_price_cents(p_plan));
  v_commit := ((((now() AT TIME ZONE 'Europe/Brussels')::date + interval '12 months')::date)::timestamp) AT TIME ZONE 'Europe/Brussels';

  INSERT INTO subscriptions (organization_id, plan, status, subscribed_at, current_period_end, monthly_price_cents,
                             founder_price_cents, founder_price_ends_at, commitment_ends_at, terms_version, consent_at, consent_proof)
  VALUES (p_org, p_plan, 'active', now(), now() + interval '1 month', v_price, v_founder, v_founder_end,
          v_commit, btrim(p_terms_version), now(), btrim(p_consent_proof))
  ON CONFLICT (organization_id) DO UPDATE SET
    plan = EXCLUDED.plan, status = 'active', subscribed_at = EXCLUDED.subscribed_at,
    current_period_end = EXCLUDED.current_period_end, monthly_price_cents = EXCLUDED.monthly_price_cents,
    founder_price_cents = EXCLUDED.founder_price_cents, founder_price_ends_at = EXCLUDED.founder_price_ends_at,
    commitment_ends_at = EXCLUDED.commitment_ends_at, terms_version = EXCLUDED.terms_version,
    consent_at = EXCLUDED.consent_at, consent_proof = EXCLUDED.consent_proof,
    cancel_requested_at = NULL, cancel_effective_at = NULL, cancel_notice_respected = NULL,
    confirmation_sent_at = NULL, renewal_reminder_sent_at = NULL, end_sent_at = NULL
  RETURNING * INTO r;

  INSERT INTO subscription_events (organization_id, event_type, details)
  VALUES (p_org, 'subscribed', jsonb_build_object('plan', p_plan, 'monthly_price_cents', v_price,
          'commitment_ends_at', v_commit, 'terms_version', btrim(p_terms_version), 'consent_proof', btrim(p_consent_proof)));
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.subscribe_organization(UUID, subscription_plan, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_organization(UUID, subscription_plan, TEXT, TEXT) TO service_role;

-- ─── 5. Une organisation ne peut pas modifier son contrat elle-même ─────────
-- (subscriptions n'a que la policy SELECT : aucune écriture possible depuis le navigateur.)
