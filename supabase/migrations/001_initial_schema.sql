-- =============================================
-- REKRUUT — Schéma initial de base de données
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE organization_type AS ENUM ('agency', 'company');
CREATE TYPE region_type AS ENUM ('wallonie', 'bruxelles', 'flandre');
CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'viewer');
CREATE TYPE contract_type AS ENUM ('interim', 'cdi', 'cdd', 'apprentissage');
CREATE TYPE sector_type AS ENUM (
  'logistique', 'industrie', 'construction',
  'transport', 'nettoyage', 'securite', 'autre'
);
CREATE TYPE salary_period AS ENUM ('heure', 'jour', 'mois');
CREATE TYPE shift_type AS ENUM ('jour', 'nuit', 'week-end', 'flexible');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed');
CREATE TYPE candidate_availability AS ENUM ('immediate', '1_semaine', '1_mois');
CREATE TYPE candidate_status AS ENUM ('actif', 'en_mission', 'inactif', 'place');
CREATE TYPE application_status AS ENUM ('nouveau', 'contacte', 'entretien', 'place', 'refuse');
CREATE TYPE subscription_plan AS ENUM ('starter', 'pro', 'agency');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled');

-- =============================================
-- TABLE: organizations
-- =============================================

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  type          organization_type NOT NULL,
  address       TEXT,
  city          TEXT,
  region        region_type,
  phone         TEXT,
  email         TEXT,
  website       TEXT,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#1E40AF',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- TABLE: users
-- =============================================

CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'recruiter',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_organization ON users(organization_id);

-- =============================================
-- TABLE: job_offers
-- =============================================

CREATE TABLE job_offers (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by           UUID NOT NULL REFERENCES users(id),
  title                TEXT NOT NULL,
  description          TEXT,
  contract_type        contract_type NOT NULL,
  sector               sector_type NOT NULL,
  city                 TEXT NOT NULL,
  region               region_type NOT NULL,
  salary_min           INTEGER,
  salary_max           INTEGER,
  salary_period        salary_period,
  show_salary          BOOLEAN DEFAULT TRUE,
  required_licenses    TEXT[] DEFAULT '{}',
  required_languages   TEXT[] DEFAULT '{}',
  shift_type           shift_type,
  start_date           DATE,
  is_urgent            BOOLEAN DEFAULT FALSE,
  status               job_status DEFAULT 'draft' NOT NULL,
  views_count          INTEGER DEFAULT 0 NOT NULL,
  applications_count   INTEGER DEFAULT 0 NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_job_offers_organization ON job_offers(organization_id);
CREATE INDEX idx_job_offers_status ON job_offers(status);

-- =============================================
-- TABLE: candidates
-- =============================================

CREATE TABLE candidates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  city             TEXT,
  region           region_type,
  availability     candidate_availability NOT NULL DEFAULT 'immediate',
  licenses         TEXT[] DEFAULT '{}',
  languages        TEXT[] DEFAULT '{}',
  has_caces        BOOLEAN DEFAULT FALSE,
  caces_types      TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  sectors          TEXT[] DEFAULT '{}',
  notes            TEXT,
  status           candidate_status DEFAULT 'actif' NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_candidates_organization ON candidates(organization_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_availability ON candidates(availability);

-- =============================================
-- TABLE: applications
-- =============================================

CREATE TABLE applications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_offer_id     UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  candidate_id     UUID REFERENCES candidates(id) ON DELETE SET NULL,
  applicant_name   TEXT NOT NULL,
  applicant_phone  TEXT NOT NULL,
  applicant_email  TEXT,
  cover_message    TEXT,
  licenses         TEXT[] DEFAULT '{}',
  has_caces        BOOLEAN DEFAULT FALSE,
  caces_types      TEXT[] DEFAULT '{}',
  availability     candidate_availability NOT NULL DEFAULT 'immediate',
  status           application_status DEFAULT 'nouveau' NOT NULL,
  notes            TEXT,
  applied_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_applications_job_offer ON applications(job_offer_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at DESC);

-- =============================================
-- TABLE: subscriptions
-- =============================================

CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                subscription_plan NOT NULL DEFAULT 'starter',
  status              subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at       TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX idx_subscriptions_organization ON subscriptions(organization_id);

-- =============================================
-- TRIGGERS — updated_at automatique
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_job_offers_updated_at
  BEFORE UPDATE ON job_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER — applications_count sur job_offers
-- =============================================

CREATE OR REPLACE FUNCTION increment_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_offers
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_offer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_applications_count
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION increment_applications_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Fonction utilitaire : org de l'utilisateur connecté
CREATE OR REPLACE FUNCTION auth_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- organizations : voir uniquement la sienne
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = auth_user_organization_id());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = auth_user_organization_id());

-- users : voir uniquement ceux de son org
CREATE POLICY "users_select" ON users
  FOR SELECT USING (organization_id = auth_user_organization_id());

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (organization_id = auth_user_organization_id());

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (organization_id = auth_user_organization_id());

-- job_offers
CREATE POLICY "job_offers_select" ON job_offers
  FOR SELECT USING (organization_id = auth_user_organization_id());

CREATE POLICY "job_offers_insert" ON job_offers
  FOR INSERT WITH CHECK (organization_id = auth_user_organization_id());

CREATE POLICY "job_offers_update" ON job_offers
  FOR UPDATE USING (organization_id = auth_user_organization_id());

CREATE POLICY "job_offers_delete" ON job_offers
  FOR DELETE USING (organization_id = auth_user_organization_id());

-- job_offers publiques (pour le formulaire de candidature)
CREATE POLICY "job_offers_public_read" ON job_offers
  FOR SELECT USING (status = 'active');

-- candidates
CREATE POLICY "candidates_select" ON candidates
  FOR SELECT USING (organization_id = auth_user_organization_id());

CREATE POLICY "candidates_insert" ON candidates
  FOR INSERT WITH CHECK (organization_id = auth_user_organization_id());

CREATE POLICY "candidates_update" ON candidates
  FOR UPDATE USING (organization_id = auth_user_organization_id());

-- applications
CREATE POLICY "applications_select" ON applications
  FOR SELECT USING (
    job_offer_id IN (
      SELECT id FROM job_offers WHERE organization_id = auth_user_organization_id()
    )
  );

CREATE POLICY "applications_update" ON applications
  FOR UPDATE USING (
    job_offer_id IN (
      SELECT id FROM job_offers WHERE organization_id = auth_user_organization_id()
    )
  );

-- applications : insertion publique (formulaire candidature)
CREATE POLICY "applications_public_insert" ON applications
  FOR INSERT WITH CHECK (
    job_offer_id IN (SELECT id FROM job_offers WHERE status = 'active')
  );

-- subscriptions
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (organization_id = auth_user_organization_id());
