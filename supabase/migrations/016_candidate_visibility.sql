-- 016 : visibilité du profil candidat pour les recruteurs abonnés (candidathèque).
-- Choix explicite du candidat : décoché par défaut, retirable à tout moment, preuve conservée.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS visible_to_recruiters boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS visibility_consent_version text,
  ADD COLUMN IF NOT EXISTS birth_date date;

CREATE INDEX IF NOT EXISTS idx_candidates_visible ON candidates (visible_to_recruiters) WHERE visible_to_recruiters;

-- Date de naissance : saisie une seule fois (impossible de la modifier ensuite pour passer majeur), 15 à 100 ans.
CREATE OR REPLACE FUNCTION set_candidate_birth_date(p_date date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_date IS NULL OR p_date > current_date - interval '15 years' OR p_date < current_date - interval '100 years' THEN
    RAISE EXCEPTION 'invalid_age';
  END IF;
  UPDATE candidates SET birth_date = p_date WHERE auth_user_id = auth.uid() AND birth_date IS NULL;
END $$;
REVOKE ALL ON FUNCTION set_candidate_birth_date(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION set_candidate_birth_date(date) TO authenticated;

-- Un candidat ne peut modifier que SON choix, via cette fonction ; réservé aux majeurs.
CREATE OR REPLACE FUNCTION set_candidate_visibility(p_visible boolean, p_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_visible AND NOT EXISTS (
    SELECT 1 FROM candidates WHERE auth_user_id = auth.uid() AND birth_date IS NOT NULL AND birth_date <= current_date - interval '18 years'
  ) THEN RAISE EXCEPTION 'adult_required'; END IF;
  UPDATE candidates
     SET visible_to_recruiters = p_visible,
         visibility_consent_at = CASE WHEN p_visible THEN now() ELSE NULL END,
         visibility_consent_version = CASE WHEN p_visible THEN left(coalesce(p_version, ''), 20) ELSE NULL END
   WHERE auth_user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION set_candidate_visibility(boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION set_candidate_visibility(boolean, text) TO authenticated;
