-- 038 : retours des recruteurs sur la note A→E (« juste / trop haute / trop basse »), pour régler les règles sur des cas réels.
-- RLS activée SANS policy : écrit/lu uniquement par le serveur. Sans danger si relancé.
CREATE TABLE IF NOT EXISTS public.match_feedback (
  application_id  uuid NOT NULL,
  user_id         uuid NOT NULL,
  organization_id uuid NOT NULL,
  verdict         text NOT NULL CHECK (verdict IN ('juste', 'trop_haute', 'trop_basse')),
  grade           text CHECK (grade IN ('A','B','C','D','E')),
  percent         int,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id, user_id)
);
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.match_feedback FROM anon, authenticated;
