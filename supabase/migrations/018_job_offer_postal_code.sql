-- 018 : code postal des offres (4 chiffres, Belgique). Facultatif en base ; le formulaire le demande.
ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS postal_code TEXT;
DO $$ BEGIN
  ALTER TABLE job_offers ADD CONSTRAINT job_offers_postal_code_format CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{4}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
