-- 037 : lien VÉRIFIÉ entre une candidature et le compte du candidat connecté au moment de postuler.
-- Rempli uniquement côté serveur à partir de la session (jamais à partir d'un e-mail saisi). Sans danger si relancé.
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS account_user_id uuid;
CREATE INDEX IF NOT EXISTS idx_applications_account_user ON public.applications (account_user_id) WHERE account_user_id IS NOT NULL;
