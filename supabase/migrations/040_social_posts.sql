-- 040 : suivi des offres publiées sur la page Facebook Wolko (une ligne par offre : évite tout doublon).
-- RLS activée SANS policy : lu/écrit uniquement par le serveur. Sans danger si relancé.
CREATE TABLE IF NOT EXISTS public.social_posts (
  job_id      uuid PRIMARY KEY,
  channel     text NOT NULL DEFAULT 'facebook_page',
  status      text NOT NULL DEFAULT 'posted',   -- posted | failed
  fb_post_id  text,
  attempts    integer NOT NULL DEFAULT 1,
  last_error  text,
  posted_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.social_posts FROM anon, authenticated;
