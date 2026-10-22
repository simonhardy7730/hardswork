-- 036 : cache du texte extrait des CV (PDF / Word) pour la note A→E. Sans danger si relancé.
-- Donnée personnelle : RLS activée SANS aucune policy => lisible uniquement par le serveur (clé service), jamais depuis le navigateur.
CREATE TABLE IF NOT EXISTS public.cv_text_cache (
  path          text PRIMARY KEY,           -- chemin du fichier dans le bucket candidate-documents
  body          text NOT NULL DEFAULT '',   -- texte extrait ('' = fichier illisible : scan, photo, protégé)
  extracted_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cv_text_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cv_text_cache FROM anon, authenticated;
