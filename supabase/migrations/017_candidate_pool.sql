-- 017 : candidathèque (recherche de profils par les recruteurs abonnés).
-- Prérequis : 015 (org_has_access) et 016 (visibilité opt-in). Ne montre QUE les candidats qui ont accepté.
-- Aucune lecture directe de la table : tout passe par ces deux fonctions, qui contrôlent l'abonnement.

CREATE TABLE IF NOT EXISTS candidate_pool_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('reveal')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pool_access_org ON candidate_pool_access (organization_id, created_at DESC);
ALTER TABLE candidate_pool_access ENABLE ROW LEVEL SECURITY; -- aucune politique : accessible via les fonctions uniquement

CREATE OR REPLACE FUNCTION public.search_candidate_pool(
  p_sectors text[] DEFAULT NULL, p_cities text[] DEFAULT NULL, p_job_type text DEFAULT NULL,
  p_availability text DEFAULT NULL, p_limit int DEFAULT 24, p_offset int DEFAULT 0)
RETURNS TABLE (id uuid, first_name text, last_initial text, city text, sectors text[], availability text,
               licenses text[], has_caces boolean, experience_years int, job_types text[], is_student boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT u.organization_id INTO v_org FROM users u WHERE u.id = auth.uid();
  IF v_org IS NULL OR NOT public.org_has_access(v_org) THEN RAISE EXCEPTION 'no_access'; END IF;
  RETURN QUERY
    SELECT c.id, c.first_name, upper(left(c.last_name, 1)), c.city, c.sectors, c.availability::text,
           c.licenses, c.has_caces, c.experience_years, c.job_types, c.is_student
      FROM candidates c
     WHERE c.visible_to_recruiters
       AND c.visibility_consent_at IS NOT NULL
       AND c.visibility_consent_at > now() - interval '24 months'
       AND c.status = 'actif'
       AND (p_sectors IS NULL OR c.sectors && p_sectors)
       AND (p_cities IS NULL OR lower(c.city) = ANY (SELECT lower(x) FROM unnest(p_cities) x))
       AND (p_job_type IS NULL OR p_job_type = ANY (c.job_types))
       AND (p_availability IS NULL OR c.availability::text = p_availability)
     ORDER BY c.visibility_consent_at DESC
     LIMIT greatest(1, least(coalesce(p_limit, 24), 50)) OFFSET greatest(0, coalesce(p_offset, 0));
END $$;

CREATE OR REPLACE FUNCTION public.reveal_candidate_contact(p_candidate_id uuid)
RETURNS TABLE (first_name text, last_name text, email text, phone text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT u.organization_id INTO v_org FROM users u WHERE u.id = auth.uid();
  IF v_org IS NULL OR NOT public.org_has_access(v_org) THEN RAISE EXCEPTION 'no_access'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM candidates c
     WHERE c.id = p_candidate_id AND c.visible_to_recruiters AND c.status = 'actif'
       AND c.visibility_consent_at > now() - interval '24 months'
  ) THEN RAISE EXCEPTION 'not_found'; END IF;

  -- Plafond anti-aspiration : 100 nouvelles coordonnées par organisation et par jour.
  IF NOT EXISTS (SELECT 1 FROM candidate_pool_access a WHERE a.organization_id = v_org AND a.candidate_id = p_candidate_id)
     AND (SELECT count(*) FROM candidate_pool_access a
           WHERE a.organization_id = v_org AND a.created_at > now() - interval '1 day') >= 100 THEN
    RAISE EXCEPTION 'quota';
  END IF;
  INSERT INTO candidate_pool_access (organization_id, user_id, candidate_id, action) VALUES (v_org, auth.uid(), p_candidate_id, 'reveal');

  RETURN QUERY SELECT c.first_name, c.last_name, c.email, c.phone FROM candidates c WHERE c.id = p_candidate_id;
END $$;

REVOKE ALL ON FUNCTION public.search_candidate_pool(text[], text[], text, text, int, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reveal_candidate_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_candidate_pool(text[], text[], text, text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reveal_candidate_contact(uuid) TO authenticated;
