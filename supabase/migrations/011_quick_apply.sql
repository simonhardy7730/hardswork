-- Étape 5 : candidature rapide (jobs étudiants / flexi-jobs).
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS availability_slots TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interest_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS quick_apply        BOOLEAN NOT NULL DEFAULT FALSE;
