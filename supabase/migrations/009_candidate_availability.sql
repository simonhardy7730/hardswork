-- Étape 3 : calendrier de disponibilités du candidat (récurrentes et ponctuelles).
-- Les recruteurs n'y ont PAS accès pour l'instant : l'accès recruteur (autorisé uniquement)
-- sera ajouté à l'étape 6, avec les permissions de consultation des profils.

CREATE TABLE IF NOT EXISTS candidate_availabilities (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  -- recurring   : disponible chaque semaine (jour + créneau), ou chaque jour férié
  -- available   : disponibilité ponctuelle (dates précises, ex. vacances)
  -- unavailable : indisponibilité (dates précises)
  kind          TEXT NOT NULL CHECK (kind IN ('recurring', 'available', 'unavailable')),
  day_key       TEXT CHECK (day_key IN ('mon','tue','wed','thu','fri','sat','sun','holiday')),
  slot          TEXT CHECK (slot IN ('morning','afternoon','evening','night')),
  date_from     DATE,
  date_to       DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT availability_shape_chk CHECK (
    (kind = 'recurring' AND day_key IS NOT NULL AND slot IS NOT NULL AND date_from IS NULL AND date_to IS NULL)
    OR
    (kind IN ('available', 'unavailable') AND day_key IS NULL AND date_from IS NOT NULL AND date_to IS NOT NULL AND date_to >= date_from)
  )
);

CREATE INDEX IF NOT EXISTS idx_cand_avail_candidate ON candidate_availabilities(candidate_id);
CREATE INDEX IF NOT EXISTS idx_cand_avail_recurring ON candidate_availabilities(day_key, slot) WHERE kind = 'recurring';

ALTER TABLE candidate_availabilities ENABLE ROW LEVEL SECURITY;

-- Le candidat gère uniquement ses propres disponibilités.
DROP POLICY IF EXISTS "cand_avail_self_all" ON candidate_availabilities;
CREATE POLICY "cand_avail_self_all" ON candidate_availabilities
  FOR ALL TO authenticated
  USING (candidate_id IN (SELECT id FROM candidates WHERE auth_user_id = auth.uid()))
  WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE auth_user_id = auth.uid()));
