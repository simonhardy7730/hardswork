-- 013 : limitation de débit centralisée (anti-abus candidature / inscription)
CREATE TABLE IF NOT EXISTS rate_limits (
  id     BIGSERIAL PRIMARY KEY,
  key    TEXT NOT NULL,
  hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits (key, hit_at DESC);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;   -- aucune policy : seul le serveur (service_role) y accède

-- Renvoie TRUE si l'action est autorisée (et la compte), FALSE si la limite est atteinte.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key TEXT, p_window_seconds INT, p_max INT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  IF random() < 0.02 THEN DELETE FROM rate_limits WHERE hit_at < now() - interval '2 days'; END IF;
  SELECT count(*) INTO v_count FROM rate_limits
   WHERE key = p_key AND hit_at > now() - make_interval(secs => p_window_seconds);
  IF v_count >= p_max THEN RETURN FALSE; END IF;
  INSERT INTO rate_limits (key) VALUES (p_key);
  RETURN TRUE;
END $$;
REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INT, INT) TO service_role;
