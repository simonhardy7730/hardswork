-- 019 : demandes de CV (recruteur → candidat) + suppression automatique des candidatures refusées.
-- À lancer une seule fois dans Supabase > SQL Editor. Sans danger si relancé.

CREATE TABLE IF NOT EXISTS public.cv_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_email TEXT NOT NULL,
  org_name        TEXT NOT NULL,
  job_title       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled')),
  cv_path         TEXT,
  cv_name         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fulfilled_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cv_requests_email ON public.cv_requests (lower(candidate_email));

ALTER TABLE public.cv_requests ENABLE ROW LEVEL SECURITY;

-- Le candidat voit uniquement les demandes faites à son adresse e-mail.
-- Les écritures passent par le serveur (clé service) après vérification : aucune policy d'écriture.
DROP POLICY IF EXISTS "cv_requests_candidate_select" ON public.cv_requests;
CREATE POLICY "cv_requests_candidate_select" ON public.cv_requests
  FOR SELECT USING (lower(candidate_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Candidatures refusées : supprimées automatiquement 30 jours après le refus (chaque nuit, 03h00 UTC).
-- Si l'extension pg_cron n'est pas disponible, la migration continue : le site purge aussi à l'ouverture des candidatures.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  PERFORM cron.schedule(
    'purge-refused-applications',
    '0 3 * * *',
    $job$DELETE FROM public.applications WHERE status = 'refuse' AND updated_at < now() - interval '30 days'$job$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron indisponible (%), purge faite par le site uniquement', SQLERRM;
END $$;
