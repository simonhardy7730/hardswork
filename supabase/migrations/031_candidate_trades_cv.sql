-- 031 : métiers précis des candidats (candidathèque) + données du CV généré par Wolko.
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS trades text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cv_data jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_candidates_trades ON candidates USING gin (trades);

-- Recherche candidathèque avec filtre par métier (mêmes garde-fous que search_candidate_pool_slots).
CREATE OR REPLACE FUNCTION public.search_candidate_pool_v3(
  p_sectors text[] DEFAULT NULL, p_cities text[] DEFAULT NULL, p_job_type text DEFAULT NULL,
  p_availability text DEFAULT NULL, p_days text[] DEFAULT NULL, p_slots text[] DEFAULT NULL,
  p_trades text[] DEFAULT NULL, p_limit int DEFAULT 24, p_offset int DEFAULT 0)
RETURNS TABLE (id uuid, first_name text, last_initial text, city text, sectors text[], availability text,
               licenses text[], has_caces boolean, experience_years int, job_types text[], is_student boolean, trades text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT u.organization_id INTO v_org FROM users u WHERE u.id = auth.uid();
  IF v_org IS NULL OR NOT public.org_has_access(v_org) THEN RAISE EXCEPTION 'no_access'; END IF;
  RETURN QUERY
    SELECT c.id, c.first_name, upper(left(c.last_name, 1)), c.city, c.sectors, c.availability::text,
           c.licenses, c.has_caces, c.experience_years, c.job_types, c.is_student, c.trades
      FROM candidates c
     WHERE c.visible_to_recruiters
       AND c.visibility_consent_at IS NOT NULL
       AND c.visibility_consent_at > now() - interval '24 months'
       AND c.status = 'actif'
       AND c.birth_date IS NOT NULL AND c.birth_date <= current_date - interval '18 years'
       AND (p_sectors IS NULL OR c.sectors && p_sectors)
       AND (p_trades IS NULL OR c.trades && p_trades)
       AND (p_cities IS NULL OR lower(c.city) = ANY (SELECT lower(x) FROM unnest(p_cities) x))
       AND (p_job_type IS NULL OR p_job_type = ANY (c.job_types))
       AND (p_availability IS NULL OR c.availability::text = p_availability)
       AND ((p_days IS NULL AND p_slots IS NULL) OR EXISTS (
             SELECT 1 FROM candidate_availabilities a
              WHERE a.candidate_id = c.id AND a.kind = 'recurring'
                AND (p_days IS NULL OR a.day_key = ANY (p_days))
                AND (p_slots IS NULL OR a.slot = ANY (p_slots))))
     ORDER BY c.visibility_consent_at DESC
     LIMIT greatest(1, least(coalesce(p_limit, 24), 50)) OFFSET greatest(0, coalesce(p_offset, 0));
END $$;
REVOKE ALL ON FUNCTION public.search_candidate_pool_v3(text[], text[], text, text, text[], text[], text[], int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_candidate_pool_v3(text[], text[], text, text, text[], text[], text[], int, int) TO authenticated;
