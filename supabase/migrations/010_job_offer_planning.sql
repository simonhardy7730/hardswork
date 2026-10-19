-- Étape 4 : offres spécialisées (job étudiant, flexi-job, intérim) — planning de la mission.
ALTER TABLE job_offers
  ADD COLUMN IF NOT EXISTS work_date_from  DATE,
  ADD COLUMN IF NOT EXISTS work_date_to    DATE,
  ADD COLUMN IF NOT EXISTS days_needed     TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_slots      TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS schedule_note   TEXT,
  ADD COLUMN IF NOT EXISTS positions_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS recurrence      TEXT,
  ADD COLUMN IF NOT EXISTS requirements    TEXT,
  ADD COLUMN IF NOT EXISTS work_location   TEXT;

ALTER TABLE job_offers DROP CONSTRAINT IF EXISTS job_offers_planning_chk;
ALTER TABLE job_offers ADD CONSTRAINT job_offers_planning_chk CHECK (
  positions_count BETWEEN 1 AND 999
  AND (recurrence IS NULL OR recurrence IN ('ponctuelle', 'recurrente'))
  AND (work_date_to IS NULL OR work_date_from IS NULL OR work_date_to >= work_date_from)
  AND days_needed <@ ARRAY['mon','tue','wed','thu','fri','sat','sun','holiday']::TEXT[]
  AND time_slots  <@ ARRAY['morning','afternoon','evening','night']::TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_job_offers_days  ON job_offers USING GIN (days_needed);
CREATE INDEX IF NOT EXISTS idx_job_offers_slots ON job_offers USING GIN (time_slots);
