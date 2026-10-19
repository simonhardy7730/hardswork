-- 021 : date de naissance demandée dans le formulaire de candidature sans compte.
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS birth_date date;
