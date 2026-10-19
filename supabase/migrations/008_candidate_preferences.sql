-- Étape 2 : préférences de recherche, profil étudiant et profil flexi-job
-- Un seul profil candidat : on étend la table existante (aucun doublon).

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS job_types          TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_student         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS student_profile    JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS flexi_interested   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flexi_profile      JSONB   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS eligibility_status TEXT    NOT NULL DEFAULT 'to_confirm';

ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_eligibility_status_chk;
ALTER TABLE candidates ADD CONSTRAINT candidates_eligibility_status_chk
  CHECK (eligibility_status IN ('to_confirm', 'confirmed', 'not_eligible'));

CREATE INDEX IF NOT EXISTS idx_candidates_job_types ON candidates USING GIN (job_types);

-- Un candidat ne peut JAMAIS modifier lui-même son statut d'éligibilité :
-- seule une action serveur (service role) ou le SQL Editor peut le faire.
CREATE OR REPLACE FUNCTION protect_eligibility_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.eligibility_status IS DISTINCT FROM OLD.eligibility_status
     AND COALESCE(auth.role(), '') NOT IN ('service_role', 'postgres', 'supabase_admin')
     AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    NEW.eligibility_status := OLD.eligibility_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_eligibility ON candidates;
CREATE TRIGGER trg_protect_eligibility
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION protect_eligibility_status();
