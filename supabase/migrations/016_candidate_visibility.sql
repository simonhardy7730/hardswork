-- 016 : visibilité du profil candidat pour les recruteurs abonnés (candidathèque).
-- Choix explicite du candidat : décoché par défaut, retirable à tout moment, preuve conservée.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS visible_to_recruiters boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS visibility_consent_version text;

CREATE INDEX IF NOT EXISTS idx_candidates_visible ON candidates (visible_to_recruiters) WHERE visible_to_recruiters;

-- Un candidat ne peut modifier que SON choix, via cette fonction (jamais d'autres colonnes sensibles).
CREATE OR REPLACE FUNCTION set_candidate_visibility(p_visible boolean, p_version text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE candidates
     SET visible_to_recruiters = p_visible,
         visibility_consent_at = CASE WHEN p_visible THEN now() ELSE NULL END,
         visibility_consent_version = CASE WHEN p_visible THEN left(coalesce(p_version, ''), 20) ELSE NULL END
   WHERE auth_user_id = auth.uid();
END $$;
REVOKE ALL ON FUNCTION set_candidate_visibility(boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION set_candidate_visibility(boolean, text) TO authenticated;
