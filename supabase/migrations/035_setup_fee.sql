-- 035 : frais de mise en service uniques (Pro 199 € HTVA, Agence 499 € HTVA ; Réseau : sur devis).
-- Additif et rejouable. Aucun effet rétroactif : les contrats déjà souscrits gardent setup_fee_cents NULL.
-- Les frais ne sont jamais dus pendant l'essai : ils naissent à la 1re souscription payante acceptée (subscribe_organization).
-- Facturation par facture (pas de paiement en ligne). Clauses à faire valider par un juriste belge.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS setup_fee_cents      INTEGER,      -- frais contractuels (centimes HTVA), NULL = aucun frais
  ADD COLUMN IF NOT EXISTS setup_fee_status     TEXT,         -- due | invoiced | paid | waived
  ADD COLUMN IF NOT EXISTS setup_fee_invoiced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_fee_paid_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_fee_reference  TEXT;        -- n° de facture

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_setup_fee_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_setup_fee_status_check
  CHECK (setup_fee_status IS NULL OR setup_fee_status IN ('due', 'invoiced', 'paid', 'waived'));
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_setup_fee_coherent;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_setup_fee_coherent
  CHECK ((setup_fee_cents IS NULL) = (setup_fee_status IS NULL));

-- Frais en centimes HTVA. Starter et Réseau : NULL (Réseau = sur devis, jamais de montant automatique).
CREATE OR REPLACE FUNCTION public.setup_fee_cents_for(p_plan subscription_plan)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plan WHEN 'pro' THEN 19900 WHEN 'agency' THEN 49900 ELSE NULL END
$$;

-- ─── Souscription : identique à 023 + frais de mise en service à la TOUTE PREMIÈRE souscription ─
-- • changement de formule pendant un contrat en cours : aucun nouveau frais ;
-- • nouvelle souscription après la fin d'un contrat (réactivation) : aucun nouveau frais (à valider avec les fondateurs) ;
-- • organisation déjà souscrite avant 035 : jamais de frais rétroactifs.
CREATE OR REPLACE FUNCTION public.subscribe_organization(p_org UUID, p_plan subscription_plan, p_terms_version TEXT, p_consent_proof TEXT)
RETURNS subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prior subscriptions; running BOOLEAN;
  v_founder INTEGER; v_founder_end TIMESTAMPTZ; v_price INTEGER; v_commit TIMESTAMPTZ; v_fee INTEGER; r subscriptions;
BEGIN
  IF p_plan NOT IN ('pro', 'agency') THEN RAISE EXCEPTION 'plan invalide'; END IF;
  IF COALESCE(btrim(p_terms_version), '') = '' THEN RAISE EXCEPTION 'version des conditions requise'; END IF;
  IF COALESCE(btrim(p_consent_proof), '') = '' THEN RAISE EXCEPTION 'preuve de consentement requise'; END IF;
  SELECT * INTO prior FROM subscriptions WHERE organization_id = p_org;

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

  IF public.launch_offer_active(now()) THEN
    v_founder := public.launch_price_cents(p_plan); v_founder_end := now() + interval '12 months';
  END IF;
  v_price := COALESCE(v_founder, public.standard_price_cents(p_plan));
  v_commit := ((((now() AT TIME ZONE 'Europe/Brussels')::date + interval '12 months')::date)::timestamp) AT TIME ZONE 'Europe/Brussels';
  -- Frais : uniquement si l'organisation n'a JAMAIS eu d'abonnement payant.
  v_fee := CASE WHEN prior.id IS NULL OR prior.subscribed_at IS NULL THEN public.setup_fee_cents_for(p_plan) ELSE NULL END;

  INSERT INTO subscriptions (organization_id, plan, status, subscribed_at, current_period_end, monthly_price_cents,
                             founder_price_cents, founder_price_ends_at, commitment_ends_at, terms_version, consent_at, consent_proof,
                             setup_fee_cents, setup_fee_status)
  VALUES (p_org, p_plan, 'active', now(), now() + interval '1 month', v_price, v_founder, v_founder_end,
          v_commit, btrim(p_terms_version), now(), btrim(p_consent_proof),
          v_fee, CASE WHEN v_fee IS NULL THEN NULL ELSE 'due' END)
  ON CONFLICT (organization_id) DO UPDATE SET
    plan = EXCLUDED.plan, status = 'active', subscribed_at = EXCLUDED.subscribed_at,
    current_period_end = EXCLUDED.current_period_end, monthly_price_cents = EXCLUDED.monthly_price_cents,
    founder_price_cents = EXCLUDED.founder_price_cents, founder_price_ends_at = EXCLUDED.founder_price_ends_at,
    commitment_ends_at = EXCLUDED.commitment_ends_at, terms_version = EXCLUDED.terms_version,
    consent_at = EXCLUDED.consent_at, consent_proof = EXCLUDED.consent_proof,
    -- frais : posés une seule fois (1re souscription) ; une réactivation conserve l'existant, sans nouveau frais
    setup_fee_cents  = CASE WHEN subscriptions.subscribed_at IS NULL THEN EXCLUDED.setup_fee_cents  ELSE subscriptions.setup_fee_cents  END,
    setup_fee_status = CASE WHEN subscriptions.subscribed_at IS NULL THEN EXCLUDED.setup_fee_status ELSE subscriptions.setup_fee_status END,
    cancel_requested_at = NULL, cancel_effective_at = NULL, cancel_notice_respected = NULL,
    confirmation_sent_at = NULL, renewal_reminder_sent_at = NULL, end_sent_at = NULL
  RETURNING * INTO r;

  INSERT INTO subscription_events (organization_id, event_type, details)
  VALUES (p_org, 'subscribed', jsonb_build_object('plan', p_plan, 'monthly_price_cents', v_price,
          'setup_fee_cents', r.setup_fee_cents, 'setup_fee_status', r.setup_fee_status,
          'commitment_ends_at', v_commit, 'terms_version', btrim(p_terms_version), 'consent_proof', btrim(p_consent_proof)));
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.subscribe_organization(UUID, subscription_plan, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_organization(UUID, subscription_plan, TEXT, TEXT) TO service_role;

-- ─── Suivi des frais : due → invoiced → paid (ou waived). Impossible de facturer deux fois. ───
-- Exemple (équipe Wolko, service_role) :
--   select mark_setup_fee('<org uuid>', 'invoiced', 'F-2026-0123');
--   select mark_setup_fee('<org uuid>', 'paid', null);
CREATE OR REPLACE FUNCTION public.mark_setup_fee(p_org UUID, p_status TEXT, p_reference TEXT DEFAULT NULL)
RETURNS subscriptions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur subscriptions; r subscriptions;
BEGIN
  IF p_status NOT IN ('invoiced', 'paid', 'waived') THEN RAISE EXCEPTION 'statut invalide'; END IF;
  SELECT * INTO cur FROM subscriptions WHERE organization_id = p_org FOR UPDATE;
  IF cur.id IS NULL OR cur.setup_fee_cents IS NULL THEN RAISE EXCEPTION 'aucun frais de mise en service pour cette organisation'; END IF;
  IF p_status = 'invoiced' THEN
    IF cur.setup_fee_status <> 'due' THEN RAISE EXCEPTION 'frais déjà facturés, payés ou annulés'; END IF;
    IF COALESCE(btrim(p_reference), '') = '' THEN RAISE EXCEPTION 'numéro de facture requis'; END IF;
    UPDATE subscriptions SET setup_fee_status = 'invoiced', setup_fee_invoiced_at = now(), setup_fee_reference = btrim(p_reference)
     WHERE id = cur.id RETURNING * INTO r;
  ELSIF p_status = 'paid' THEN
    IF cur.setup_fee_status NOT IN ('due', 'invoiced') THEN RAISE EXCEPTION 'frais déjà payés ou annulés'; END IF;
    UPDATE subscriptions SET setup_fee_status = 'paid', setup_fee_paid_at = now(),
           setup_fee_reference = COALESCE(NULLIF(btrim(p_reference), ''), cur.setup_fee_reference)
     WHERE id = cur.id RETURNING * INTO r;
  ELSE
    IF cur.setup_fee_status <> 'due' THEN RAISE EXCEPTION 'seuls des frais non facturés peuvent être annulés'; END IF;
    UPDATE subscriptions SET setup_fee_status = 'waived' WHERE id = cur.id RETURNING * INTO r;
  END IF;
  INSERT INTO subscription_events (organization_id, event_type, details)
  VALUES (p_org, 'setup_fee_' || p_status, jsonb_build_object('setup_fee_cents', cur.setup_fee_cents, 'reference', r.setup_fee_reference));
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.mark_setup_fee(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_setup_fee(UUID, TEXT, TEXT) TO service_role;
-- Les colonnes setup_fee_* ne sont modifiables que par ces fonctions : subscriptions n'a pas de policy d'écriture.
