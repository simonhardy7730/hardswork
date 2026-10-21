-- 033 : d'où vient chaque candidature / inscription (lien Facebook, groupe, WhatsApp…). Sans danger si relancé.
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.candidates   ADD COLUMN IF NOT EXISTS source text;
