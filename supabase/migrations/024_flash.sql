-- 024 : WOLKO Flash / Flash Duo — annonces ponctuelles payées sur facture (sans abonnement).
-- Additif et rejouable. Flash est SÉPARÉ des abonnements : il ne modifie ni `subscriptions` ni org_has_access(),
-- donc il ne donne jamais accès à la candidathèque ni aux fonctions Pro/Agence.
-- Les écritures passent uniquement par les fonctions ci-dessous (service_role).

-- ─── 1. Expiration d'une offre (30 jours Flash) : l'offre disparaît des résultats publics toute seule ───
ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
DROP POLICY IF EXISTS "job_offers_public_read" ON job_offers;
CREATE POLICY "job_offers_public_read" ON job_offers
  FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at > now()));

-- ─── 2. Réglages (modifiables par SQL, jamais par les clients) ───
CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO app_settings (key, value) VALUES
  ('flash_unit_price_cents', '14900'),          -- 149 € HTVA
  ('flash_vat_rate',         '21'),             -- TVA à confirmer par le comptable
  ('flash_pro_credit_enabled', 'false')         -- promo Flash → Pro DÉSACTIVÉE jusqu'à validation comptable
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.app_setting(p_key TEXT) RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT value FROM app_settings WHERE key = p_key $$;
REVOKE ALL ON FUNCTION public.app_setting(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.app_setting(TEXT) TO service_role;

-- ─── 3. Administrateurs de la plateforme (distincts des administrateurs d'une organisation) ───
-- Ajout par SQL : insert into platform_admins (user_id, role) select id, 'owner' from auth.users where email = '...';
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'finance', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

-- ─── 4. Commandes, crédits d'annonce, historique ───
CREATE TABLE IF NOT EXISTS flash_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quantity            INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 50),
  -- Prix réellement acceptés à la commande (jamais recalculés ensuite)
  unit_price_cents    INTEGER NOT NULL CHECK (unit_price_cents > 0),
  discount_cents      INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_ht_cents      INTEGER NOT NULL,
  vat_rate            NUMERIC(5,2) NOT NULL,
  vat_cents           INTEGER NOT NULL,
  total_ttc_cents     INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'awaiting_payment'
                      CHECK (status IN ('awaiting_payment', 'paid', 'authorized_deferred', 'cancelled', 'refunded')),
  invoice_status      TEXT NOT NULL DEFAULT 'to_issue' CHECK (invoice_status IN ('to_issue', 'issued')),
  invoice_ref         TEXT,
  invoice_issued_at   TIMESTAMPTZ,
  payment_status      TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed')),
  paid_at             TIMESTAMPTZ,
  billing             JSONB NOT NULL,
  terms_version       TEXT NOT NULL,
  consent_at          TIMESTAMPTZ NOT NULL,
  consent_user_id     UUID,
  authorized_reason   TEXT,
  authorized_by       UUID,
  converted_at        TIMESTAMPTZ,
  confirmation_sent_at TIMESTAMPTZ,
  invoice_mail_sent_at TIMESTAMPTZ,
  paid_mail_sent_at   TIMESTAMPTZ,
  pro_proposal_sent_at TIMESTAMPTZ,
  ordered_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT flash_total_ht CHECK (total_ht_cents = unit_price_cents * quantity - discount_cents),
  CONSTRAINT flash_total_ttc CHECK (total_ttc_cents = total_ht_cents + vat_cents)
);
CREATE INDEX IF NOT EXISTS idx_flash_orders_org ON flash_orders(organization_id, ordered_at DESC);

CREATE TABLE IF NOT EXISTS flash_credits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES flash_orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  seq             INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'available', 'active', 'suspended', 'expired', 'lapsed', 'void')),
  job_offer_id    UUID REFERENCES job_offers(id) ON DELETE SET NULL,
  activate_before TIMESTAMPTZ NOT NULL,         -- validité de 90 jours pour activer l'annonce
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  suspended_reason TEXT,
  reminder7_sent_at TIMESTAMPTZ,
  reminder2_sent_at TIMESTAMPTZ,
  expired_sent_at   TIMESTAMPTZ,
  UNIQUE (order_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_flash_credits_org ON flash_credits(organization_id);
-- Une annonce ne peut être rattachée qu'à un seul crédit en cours (pas de double activation / pas de réutilisation).
CREATE UNIQUE INDEX IF NOT EXISTS flash_credit_one_live_per_offer ON flash_credits(job_offer_id)
  WHERE job_offer_id IS NOT NULL AND status IN ('pending', 'available', 'active', 'suspended');

CREATE TABLE IF NOT EXISTS flash_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES flash_orders(id) ON DELETE CASCADE,
  credit_id       UUID REFERENCES flash_credits(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  actor_kind      TEXT NOT NULL DEFAULT 'system' CHECK (actor_kind IN ('company', 'platform', 'system')),
  actor_user_id   UUID,
  details         JSONB NOT NULL DEFAULT '{}'::jsonb,
  visible_to_org  BOOLEAN NOT NULL DEFAULT true,
  external_id     TEXT UNIQUE,  -- identifiant d'événement d'un futur système de facturation/paiement (idempotence)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flash_events_order ON flash_events(order_id, created_at);

ALTER TABLE flash_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flash_orders_select" ON flash_orders;
CREATE POLICY "flash_orders_select" ON flash_orders FOR SELECT USING (organization_id = auth_user_organization_id());
DROP POLICY IF EXISTS "flash_credits_select" ON flash_credits;
CREATE POLICY "flash_credits_select" ON flash_credits FOR SELECT USING (organization_id = auth_user_organization_id());
DROP POLICY IF EXISTS "flash_events_select" ON flash_events;
CREATE POLICY "flash_events_select" ON flash_events FOR SELECT USING (organization_id = auth_user_organization_id() AND visible_to_org);
-- Aucune policy INSERT/UPDATE/DELETE : seules les fonctions ci-dessous (service_role) écrivent.

-- ─── 5. Tarification (centimes entiers, côté base) ───
-- Remise de 50 % sur la 2e annonce UNIQUEMENT, une seule fois par commande.
CREATE OR REPLACE FUNCTION public.flash_discount_cents(p_qty INTEGER, p_unit INTEGER) RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_qty >= 2 THEN p_unit / 2 ELSE 0 END $$;

CREATE OR REPLACE FUNCTION public.flash_log(p_order UUID, p_credit UUID, p_org UUID, p_type TEXT, p_kind TEXT, p_actor UUID, p_details JSONB, p_visible BOOLEAN DEFAULT true)
RETURNS VOID LANGUAGE sql AS $$
  INSERT INTO flash_events (order_id, credit_id, organization_id, event_type, actor_kind, actor_user_id, details, visible_to_org)
  VALUES (p_order, p_credit, p_org, p_type, p_kind, p_actor, COALESCE(p_details, '{}'::jsonb), p_visible) $$;

-- ─── 6. Création d'une commande (atomique, protégée contre les commandes concurrentes) ───
CREATE OR REPLACE FUNCTION public.flash_create_order(p_org UUID, p_user UUID, p_qty INTEGER, p_billing JSONB, p_terms TEXT, p_offers UUID[])
RETURNS flash_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_unit INTEGER := (public.app_setting('flash_unit_price_cents'))::text::integer;
  v_rate NUMERIC := (public.app_setting('flash_vat_rate'))::text::numeric;
  v_disc INTEGER; v_ht INTEGER; v_vat INTEGER; o flash_orders; i INTEGER; v_credit UUID; v_offer UUID; v_before TIMESTAMPTZ;
  k TEXT;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 OR p_qty > 50 THEN RAISE EXCEPTION 'quantité invalide'; END IF;
  IF COALESCE(btrim(p_terms), '') = '' THEN RAISE EXCEPTION 'conditions non acceptées'; END IF;
  FOREACH k IN ARRAY ARRAY['company_name', 'vat_number', 'address', 'postal_code', 'city', 'email', 'contact'] LOOP
    IF COALESCE(btrim(p_billing ->> k), '') = '' THEN RAISE EXCEPTION 'facturation incomplète : %', k; END IF;
  END LOOP;
  IF p_offers IS NOT NULL AND cardinality(p_offers) > p_qty THEN RAISE EXCEPTION 'trop d''annonces rattachées'; END IF;
  IF p_offers IS NOT NULL AND (SELECT count(DISTINCT x) FROM unnest(p_offers) x) <> cardinality(p_offers) THEN RAISE EXCEPTION 'annonce en double'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('flash:' || p_org::text));
  v_disc := public.flash_discount_cents(p_qty, v_unit);
  v_ht := v_unit * p_qty - v_disc;
  v_vat := round(v_ht * v_rate / 100)::integer;

  -- Anti double-clic : même commande identique dans la dernière minute
  IF EXISTS (SELECT 1 FROM flash_orders WHERE organization_id = p_org AND quantity = p_qty AND total_ht_cents = v_ht
             AND ordered_at > now() - interval '1 minute' AND status = 'awaiting_payment') THEN
    RAISE EXCEPTION 'commande déjà enregistrée';
  END IF;

  v_before := ((now() AT TIME ZONE 'Europe/Brussels') + interval '90 days') AT TIME ZONE 'Europe/Brussels';
  INSERT INTO flash_orders (organization_id, quantity, unit_price_cents, discount_cents, total_ht_cents, vat_rate, vat_cents, total_ttc_cents,
                            billing, terms_version, consent_at, consent_user_id)
  VALUES (p_org, p_qty, v_unit, v_disc, v_ht, v_rate, v_vat, v_ht + v_vat, p_billing, btrim(p_terms), now(), p_user)
  RETURNING * INTO o;

  FOR i IN 1..p_qty LOOP
    INSERT INTO flash_credits (order_id, organization_id, seq, activate_before) VALUES (o.id, p_org, i, v_before) RETURNING id INTO v_credit;
    v_offer := CASE WHEN p_offers IS NOT NULL AND i <= cardinality(p_offers) THEN p_offers[i] END;
    IF v_offer IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM job_offers WHERE id = v_offer AND organization_id = p_org AND status = 'draft') THEN
        RAISE EXCEPTION 'annonce invalide (brouillon de votre organisation requis)';
      END IF;
      UPDATE flash_credits SET job_offer_id = v_offer WHERE id = v_credit;  -- l'index unique refuse une annonce déjà rattachée
    END IF;
  END LOOP;

  PERFORM public.flash_log(o.id, NULL, p_org, 'order_created', 'company', p_user,
    jsonb_build_object('quantity', p_qty, 'unit_price_cents', v_unit, 'discount_cents', v_disc, 'total_ht_cents', v_ht,
                       'vat_rate', v_rate, 'vat_cents', v_vat, 'total_ttc_cents', v_ht + v_vat, 'terms_version', btrim(p_terms)));
  RETURN o;
END $$;

-- ─── 7. Publication d'un crédit sur une annonce : démarre les 30 jours (une seule fois) ───
CREATE OR REPLACE FUNCTION public.flash_publish_credit(p_credit UUID, p_offer UUID, p_actor UUID, p_kind TEXT DEFAULT 'company')
RETURNS flash_credits LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c flash_credits; v_exp TIMESTAMPTZ;
BEGIN
  SELECT * INTO c FROM flash_credits WHERE id = p_credit FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'crédit introuvable'; END IF;
  IF c.status = 'active' AND c.job_offer_id = p_offer THEN RETURN c; END IF;           -- idempotent
  IF c.status <> 'available' THEN RAISE EXCEPTION 'crédit non disponible (%)', c.status; END IF;
  IF c.activate_before <= now() THEN RAISE EXCEPTION 'crédit expiré (90 jours dépassés)'; END IF;
  IF NOT EXISTS (SELECT 1 FROM job_offers WHERE id = p_offer AND organization_id = c.organization_id AND status IN ('draft', 'paused', 'closed')) THEN
    RAISE EXCEPTION 'annonce invalide pour ce crédit';
  END IF;
  v_exp := ((now() AT TIME ZONE 'Europe/Brussels') + interval '30 days') AT TIME ZONE 'Europe/Brussels';
  UPDATE flash_credits SET job_offer_id = p_offer, status = 'active', published_at = now(), expires_at = v_exp WHERE id = c.id RETURNING * INTO c;
  UPDATE job_offers SET status = 'active', expires_at = v_exp WHERE id = p_offer;
  PERFORM public.flash_log(c.order_id, c.id, c.organization_id, 'credit_published', p_kind, p_actor,
    jsonb_build_object('job_offer_id', p_offer, 'published_at', c.published_at, 'expires_at', v_exp));
  RETURN c;
END $$;

-- ─── 8. Confirmation de paiement / autorisation de publication avec paiement différé ───
CREATE OR REPLACE FUNCTION public.flash_confirm_order(p_order UUID, p_actor UUID, p_mode TEXT, p_reason TEXT DEFAULT NULL)
RETURNS flash_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o flash_orders; c RECORD;
BEGIN
  SELECT * INTO o FROM flash_orders WHERE id = p_order FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'commande introuvable'; END IF;
  IF o.status IN ('cancelled', 'refunded') THEN RAISE EXCEPTION 'commande annulée'; END IF;

  IF p_mode = 'payment' THEN
    IF o.payment_status = 'confirmed' THEN RETURN o; END IF;                          -- idempotent (événement répété)
    UPDATE flash_orders SET payment_status = 'confirmed', paid_at = now(), status = 'paid' WHERE id = o.id RETURNING * INTO o;
    PERFORM public.flash_log(o.id, NULL, o.organization_id, 'payment_confirmed', 'platform', p_actor, jsonb_build_object('total_ht_cents', o.total_ht_cents));
  ELSIF p_mode = 'deferred' THEN
    IF COALESCE(btrim(p_reason), '') = '' THEN RAISE EXCEPTION 'motif requis'; END IF;
    IF o.status <> 'awaiting_payment' THEN RETURN o; END IF;                           -- idempotent
    UPDATE flash_orders SET status = 'authorized_deferred', authorized_by = p_actor, authorized_reason = btrim(p_reason) WHERE id = o.id RETURNING * INTO o;
    PERFORM public.flash_log(o.id, NULL, o.organization_id, 'deferred_authorized', 'platform', p_actor, jsonb_build_object('reason', btrim(p_reason)), false);
  ELSE
    RAISE EXCEPTION 'mode invalide';
  END IF;

  -- Les crédits deviennent disponibles ; ceux déjà rattachés à un brouillon sont publiés tout de suite.
  UPDATE flash_credits SET status = 'available' WHERE order_id = o.id AND status = 'pending';
  FOR c IN SELECT id, job_offer_id FROM flash_credits WHERE order_id = o.id AND status = 'available' AND job_offer_id IS NOT NULL ORDER BY seq LOOP
    PERFORM public.flash_publish_credit(c.id, c.job_offer_id, p_actor, 'platform');
  END LOOP;
  RETURN o;
END $$;

CREATE OR REPLACE FUNCTION public.flash_mark_invoice(p_order UUID, p_actor UUID, p_ref TEXT)
RETURNS flash_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o flash_orders;
BEGIN
  IF COALESCE(btrim(p_ref), '') = '' THEN RAISE EXCEPTION 'référence de facture requise'; END IF;
  SELECT * INTO o FROM flash_orders WHERE id = p_order FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'commande introuvable'; END IF;
  IF o.invoice_status = 'issued' THEN RETURN o; END IF;
  UPDATE flash_orders SET invoice_status = 'issued', invoice_ref = btrim(p_ref), invoice_issued_at = now() WHERE id = o.id RETURNING * INTO o;
  PERFORM public.flash_log(o.id, NULL, o.organization_id, 'invoice_issued', 'platform', p_actor, jsonb_build_object('invoice_ref', btrim(p_ref)));
  RETURN o;
END $$;

CREATE OR REPLACE FUNCTION public.flash_cancel_order(p_order UUID, p_actor UUID, p_reason TEXT, p_refund BOOLEAN DEFAULT false)
RETURNS flash_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o flash_orders;
BEGIN
  IF COALESCE(btrim(p_reason), '') = '' THEN RAISE EXCEPTION 'motif requis'; END IF;
  SELECT * INTO o FROM flash_orders WHERE id = p_order FOR UPDATE;
  IF o.id IS NULL THEN RAISE EXCEPTION 'commande introuvable'; END IF;
  IF o.status IN ('cancelled', 'refunded') THEN RETURN o; END IF;
  UPDATE flash_orders SET status = CASE WHEN p_refund THEN 'refunded' ELSE 'cancelled' END WHERE id = o.id RETURNING * INTO o;
  UPDATE flash_credits SET status = 'void' WHERE order_id = o.id AND status IN ('pending', 'available');
  PERFORM public.flash_log(o.id, NULL, o.organization_id, 'order_cancelled', 'platform', p_actor, jsonb_build_object('reason', btrim(p_reason), 'refund', p_refund), false);
  RETURN o;
END $$;

CREATE OR REPLACE FUNCTION public.flash_set_suspension(p_credit UUID, p_actor UUID, p_suspend BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS flash_credits LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c flash_credits;
BEGIN
  SELECT * INTO c FROM flash_credits WHERE id = p_credit FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'crédit introuvable'; END IF;
  IF p_suspend THEN
    IF COALESCE(btrim(p_reason), '') = '' THEN RAISE EXCEPTION 'motif requis'; END IF;
    IF c.status <> 'active' THEN RETURN c; END IF;
    UPDATE flash_credits SET status = 'suspended', suspended_reason = btrim(p_reason) WHERE id = c.id RETURNING * INTO c;
    UPDATE job_offers SET status = 'paused' WHERE id = c.job_offer_id;
    PERFORM public.flash_log(c.order_id, c.id, c.organization_id, 'credit_suspended', 'platform', p_actor, jsonb_build_object('reason', btrim(p_reason)), false);
  ELSE
    IF c.status <> 'suspended' THEN RETURN c; END IF;
    IF c.expires_at <= now() THEN
      UPDATE flash_credits SET status = 'expired' WHERE id = c.id RETURNING * INTO c;
      UPDATE job_offers SET status = 'closed' WHERE id = c.job_offer_id;
    ELSE
      UPDATE flash_credits SET status = 'active', suspended_reason = NULL WHERE id = c.id RETURNING * INTO c;
      UPDATE job_offers SET status = 'active' WHERE id = c.job_offer_id;
    END IF;
    PERFORM public.flash_log(c.order_id, c.id, c.organization_id, 'credit_unsuspended', 'platform', p_actor, '{}'::jsonb, false);
  END IF;
  RETURN c;
END $$;

-- ─── 9. Expiration automatique (cron quotidien ; la visibilité publique est déjà coupée par expires_at) ───
CREATE OR REPLACE FUNCTION public.flash_expire_due()
RETURNS TABLE (credit_id UUID, kind TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD;
BEGIN
  FOR c IN SELECT * FROM flash_credits WHERE status = 'active' AND expires_at <= now() FOR UPDATE LOOP
    UPDATE flash_credits SET status = 'expired' WHERE id = c.id;
    UPDATE job_offers SET status = 'closed' WHERE id = c.job_offer_id AND status = 'active';
    PERFORM public.flash_log(c.order_id, c.id, c.organization_id, 'credit_expired', 'system', NULL, '{}'::jsonb);
    credit_id := c.id; kind := 'expired'; RETURN NEXT;
  END LOOP;
  FOR c IN SELECT * FROM flash_credits WHERE status = 'available' AND activate_before <= now() FOR UPDATE LOOP
    UPDATE flash_credits SET status = 'lapsed' WHERE id = c.id;
    PERFORM public.flash_log(c.order_id, c.id, c.organization_id, 'credit_lapsed', 'system', NULL, '{}'::jsonb);
    credit_id := c.id; kind := 'lapsed'; RETURN NEXT;
  END LOOP;
END $$;

-- ─── 10. Garde-fous sur les offres (appliqués aux utilisateurs connectés, pas au serveur) ───
CREATE OR REPLACE FUNCTION public.job_offers_flash_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;       -- serveur (service_role) / éditeur SQL
  IF TG_OP = 'INSERT' THEN NEW.expires_at := NULL; RETURN NEW; END IF;
  NEW.expires_at := OLD.expires_at;                    -- la date d'expiration ne se modifie pas depuis le navigateur
  SELECT status INTO v_status FROM flash_credits
   WHERE job_offer_id = OLD.id AND status IN ('active', 'suspended', 'expired', 'lapsed') ORDER BY published_at DESC NULLS LAST LIMIT 1;
  IF v_status IS NOT NULL THEN
    IF v_status IN ('active', 'suspended', 'expired') AND NEW.title IS DISTINCT FROM OLD.title THEN
      RAISE EXCEPTION 'flash_title_locked: l''intitulé d''une annonce Flash ne peut plus être modifié après publication';
    END IF;
    IF v_status IN ('suspended', 'expired') AND NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'flash_not_active: cette annonce Flash n''est pas réactivable';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS job_offers_flash_guard ON job_offers;
CREATE TRIGGER job_offers_flash_guard BEFORE INSERT OR UPDATE ON job_offers FOR EACH ROW EXECUTE FUNCTION public.job_offers_flash_guard();

-- ─── 11. Promotion Flash → Pro (DÉSACTIVÉE par défaut : app_settings.flash_pro_credit_enabled) ───
CREATE TABLE IF NOT EXISTS promo_credits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,   -- une seule fois par entreprise
  source_order_id   UUID REFERENCES flash_orders(id) ON DELETE SET NULL,
  amount_cents      INTEGER NOT NULL CHECK (amount_cents > 0),
  remaining_cents   INTEGER NOT NULL CHECK (remaining_cents >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promo_credit_uses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id     UUID NOT NULL REFERENCES promo_credits(id) ON DELETE CASCADE,
  period_label  TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (credit_id, period_label)                      -- une mensualité ne consomme le crédit qu'une fois
);
ALTER TABLE promo_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_credit_uses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_credits_select" ON promo_credits;
CREATE POLICY "promo_credits_select" ON promo_credits FOR SELECT USING (organization_id = auth_user_organization_id());

-- Crédit maximal 149 € HTVA, si Pro souscrit dans les 30 jours après l'achat Flash ET paiement Flash effectivement confirmé.
CREATE OR REPLACE FUNCTION public.flash_grant_pro_credit(p_org UUID) RETURNS promo_credits LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o flash_orders; s subscriptions; pc promo_credits;
BEGIN
  IF COALESCE((public.app_setting('flash_pro_credit_enabled'))::text, 'false') <> 'true' THEN RETURN NULL; END IF;
  SELECT * INTO s FROM subscriptions WHERE organization_id = p_org;
  IF s.id IS NULL OR s.plan <> 'pro' OR s.subscribed_at IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO o FROM flash_orders WHERE organization_id = p_org AND payment_status = 'confirmed'
     AND ordered_at <= s.subscribed_at AND s.subscribed_at <= ordered_at + interval '30 days' ORDER BY ordered_at DESC LIMIT 1;
  IF o.id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO promo_credits (organization_id, source_order_id, amount_cents, remaining_cents)
  VALUES (p_org, o.id, LEAST(14900, o.total_ht_cents), LEAST(14900, o.total_ht_cents))
  ON CONFLICT (organization_id) DO NOTHING RETURNING * INTO pc;
  IF pc.id IS NOT NULL THEN
    UPDATE flash_orders SET converted_at = now() WHERE id = o.id;
    PERFORM public.flash_log(o.id, NULL, p_org, 'pro_credit_granted', 'system', NULL, jsonb_build_object('amount_cents', pc.amount_cents), false);
  END IF;
  RETURN pc;
END $$;

CREATE OR REPLACE FUNCTION public.flash_subscription_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.plan = 'pro' AND NEW.subscribed_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.subscribed_at IS DISTINCT FROM NEW.subscribed_at) THEN
    PERFORM public.flash_grant_pro_credit(NEW.organization_id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS flash_subscription_credit ON subscriptions;
CREATE TRIGGER flash_subscription_credit AFTER INSERT OR UPDATE OF subscribed_at ON subscriptions FOR EACH ROW EXECUTE FUNCTION public.flash_subscription_trigger();

-- Imputation sur une mensualité Pro (idempotente par période). Renvoie le montant de crédit appliqué.
CREATE OR REPLACE FUNCTION public.flash_apply_pro_credit(p_org UUID, p_period TEXT, p_amount_cents INTEGER) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pc promo_credits; u promo_credit_uses; v_apply INTEGER;
BEGIN
  SELECT * INTO pc FROM promo_credits WHERE organization_id = p_org FOR UPDATE;
  IF pc.id IS NULL OR p_amount_cents <= 0 THEN RETURN 0; END IF;
  SELECT * INTO u FROM promo_credit_uses WHERE credit_id = pc.id AND period_label = p_period;
  IF u.id IS NOT NULL THEN RETURN u.amount_cents; END IF;
  v_apply := LEAST(pc.remaining_cents, p_amount_cents);
  IF v_apply <= 0 THEN RETURN 0; END IF;
  INSERT INTO promo_credit_uses (credit_id, period_label, amount_cents) VALUES (pc.id, p_period, v_apply);
  UPDATE promo_credits SET remaining_cents = remaining_cents - v_apply WHERE id = pc.id;
  RETURN v_apply;
END $$;

-- ─── 12. Droits : uniquement le serveur ───
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'flash_create_order(uuid,uuid,integer,jsonb,text,uuid[])', 'flash_publish_credit(uuid,uuid,uuid,text)',
    'flash_confirm_order(uuid,uuid,text,text)', 'flash_mark_invoice(uuid,uuid,text)', 'flash_cancel_order(uuid,uuid,text,boolean)',
    'flash_set_suspension(uuid,uuid,boolean,text)', 'flash_expire_due()', 'flash_grant_pro_credit(uuid)',
    'flash_apply_pro_credit(uuid,text,integer)', 'flash_log(uuid,uuid,uuid,text,text,uuid,jsonb,boolean)'] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
END $$;
