-- =============================================
-- Migration 003 — Candidats self-registration
-- + ajout secteur médical
-- =============================================

-- 1. Ajouter auth_user_id aux candidats
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Rendre organization_id nullable (candidats auto-inscrits n'ont pas d'org)
ALTER TABLE candidates
  ALTER COLUMN organization_id DROP NOT NULL;

-- 3. Ajouter secteur médical à l'ENUM
ALTER TYPE sector_type ADD VALUE IF NOT EXISTS 'medical';

-- 4. Index pour recherche par auth_user_id
CREATE INDEX IF NOT EXISTS idx_candidates_auth_user ON candidates(auth_user_id);

-- 5. RLS — candidat peut voir/modifier son propre profil
CREATE POLICY "candidates_self_select" ON candidates
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "candidates_self_update" ON candidates
  FOR UPDATE USING (auth_user_id = auth.uid());

-- 6. RLS — inscription publique candidat (organization_id doit être NULL)
CREATE POLICY "candidates_public_insert" ON candidates
  FOR INSERT WITH CHECK (
    auth_user_id = auth.uid()
    AND organization_id IS NULL
  );
