-- =====================================================================
-- 006 — Espace Agence : clients et missions
-- À exécuter dans le SQL editor de Supabase (après 005).
-- =====================================================================

CREATE OR REPLACE FUNCTION auth_user_is_agency()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u JOIN organizations o ON o.id = u.organization_id
    WHERE u.id = auth.uid() AND o.type = 'agency'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE TABLE IF NOT EXISTS agency_clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  city            TEXT,
  vat_number      TEXT,
  status          TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'actif', 'inactif')),
  notes           TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agency_clients_org ON agency_clients(organization_id);

CREATE TABLE IF NOT EXISTS agency_missions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES agency_clients(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'ouverte' CHECK (status IN ('ouverte', 'en_cours', 'pourvue', 'annulee')),
  positions       INT NOT NULL DEFAULT 1 CHECK (positions > 0),
  start_date      DATE,
  notes           TEXT,
  job_offer_id    UUID REFERENCES job_offers(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agency_missions_org ON agency_missions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_missions_client ON agency_missions(client_id);

ALTER TABLE agency_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_missions ENABLE ROW LEVEL SECURITY;

-- Isolation stricte : seule l'agence propriétaire voit et modifie ses clients/missions.
DROP POLICY IF EXISTS "agency_clients_all" ON agency_clients;
CREATE POLICY "agency_clients_all" ON agency_clients FOR ALL
  USING (organization_id = auth_user_organization_id() AND auth_user_is_agency())
  WITH CHECK (organization_id = auth_user_organization_id() AND auth_user_is_agency());

DROP POLICY IF EXISTS "agency_missions_all" ON agency_missions;
CREATE POLICY "agency_missions_all" ON agency_missions FOR ALL
  USING (organization_id = auth_user_organization_id() AND auth_user_is_agency())
  WITH CHECK (
    organization_id = auth_user_organization_id() AND auth_user_is_agency()
    AND EXISTS (SELECT 1 FROM agency_clients c WHERE c.id = client_id AND c.organization_id = agency_missions.organization_id)
  );
