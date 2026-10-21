-- 034 : journal des notifications envoyées à Google (Indexing API). Sans danger si relancé.
CREATE TABLE IF NOT EXISTS public.indexing_log (
  url            text PRIMARY KEY,
  job_offer_id   uuid,
  last_type      text NOT NULL CHECK (last_type IN ('URL_UPDATED', 'URL_DELETED')),
  last_sent_at   timestamptz NOT NULL DEFAULT now(),
  last_error     text,
  attempts       int NOT NULL DEFAULT 0
);
ALTER TABLE public.indexing_log ENABLE ROW LEVEL SECURITY; -- aucune policy : lisible uniquement par le serveur (clé service)
