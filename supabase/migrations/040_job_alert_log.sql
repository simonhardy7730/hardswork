-- 040 : journal des alertes emploi immédiates (une ligne par offre et par candidat) pour ne jamais envoyer deux fois la même offre.
-- RLS activée SANS policy : lu/écrit uniquement par le serveur. Sans danger si relancé.
CREATE TABLE IF NOT EXISTS public.job_alert_log (
  job_id   uuid NOT NULL,
  user_id  uuid NOT NULL,
  sent_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, user_id)
);
ALTER TABLE public.job_alert_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_alert_log FROM anon, authenticated;
