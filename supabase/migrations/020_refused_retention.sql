-- 020 : délai de suppression des candidatures refusées, au choix de chaque organisation (0 = jamais).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS refused_retention_days integer NOT NULL DEFAULT 7;

-- Purge nocturne (03h00 UTC) selon le délai de chaque organisation (remplace celle de 019).
DO $$
BEGIN
  PERFORM cron.unschedule('purge-refused-applications');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.schedule(
    'purge-refused-applications',
    '0 3 * * *',
    $job$DELETE FROM public.applications a USING public.job_offers j, public.organizations o
         WHERE a.job_offer_id = j.id AND j.organization_id = o.id
           AND a.status = 'refuse' AND o.refused_retention_days > 0
           AND a.updated_at < now() - make_interval(days => o.refused_retention_days)$job$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron indisponible : purge faite par le site uniquement';
END $$;
