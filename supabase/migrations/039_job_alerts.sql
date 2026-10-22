-- 039 : alertes emploi par e-mail pour les candidats (une ligne par compte, activée seulement par le candidat lui-même).
-- Les critères viennent du profil (ville, métiers, secteurs) : aucune donnée supplémentaire. Lien de désinscription = jeton secret.
-- RLS activée SANS policy : lu/écrit uniquement par le serveur. Sans danger si relancé.
CREATE TABLE IF NOT EXISTS public.job_alerts (
  user_id       uuid PRIMARY KEY,
  email         text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  unsub_token   uuid NOT NULL DEFAULT gen_random_uuid(),
  last_sent_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS job_alerts_unsub_token_idx ON public.job_alerts (unsub_token);
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_alerts FROM anon, authenticated;
