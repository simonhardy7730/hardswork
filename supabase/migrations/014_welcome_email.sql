-- 014 : file d'attente fiable pour l'email de bienvenue (un seul par compte, après confirmation de l'adresse)
CREATE TABLE IF NOT EXISTS welcome_emails (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts        INT  NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at       TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE welcome_emails ENABLE ROW LEVEL SECURITY;   -- aucune policy : réservé au serveur (service_role)

-- Ajoute une ligne « à envoyer » quand l'adresse est CONFIRMÉE (ou déjà confirmée à la création).
-- ON CONFLICT DO NOTHING : un événement répété ne crée jamais de doublon.
CREATE OR REPLACE FUNCTION public.enqueue_welcome_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.email_confirmed_at IS NOT NULL THEN
      INSERT INTO welcome_emails (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    END IF;
  ELSIF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO welcome_emails (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'enqueue_welcome_email: %', SQLERRM;   -- ne jamais bloquer inscription ou confirmation
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_welcome_ins ON auth.users;
CREATE TRIGGER on_auth_user_welcome_ins AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_welcome_email();
DROP TRIGGER IF EXISTS on_auth_user_welcome_upd ON auth.users;
CREATE TRIGGER on_auth_user_welcome_upd AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_welcome_email();

-- Réservation atomique : une seule requête peut obtenir « TRUE » pour un compte donné (même en concurrence).
-- Reprend aussi les envois « failed » dont le délai est écoulé (max 5 essais) ou bloqués > 10 min.
CREATE OR REPLACE FUNCTION public.claim_welcome_email(p_user UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE welcome_emails
     SET status = 'sending', attempts = attempts + 1, locked_at = now()
   WHERE user_id = p_user AND attempts < 5
     AND (status = 'pending'
          OR (status = 'failed'  AND next_attempt_at <= now())
          OR (status = 'sending' AND locked_at < now() - interval '10 minutes'));
  RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_welcome_email(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_welcome_email(UUID) TO service_role;
