-- =====================================================================
-- 005 — Invitations d'équipe sécurisées (remplace le lien /signup?org=<id>)
-- À exécuter dans le SQL editor de Supabase.
-- =====================================================================

CREATE TABLE IF NOT EXISTS team_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'recruiter',
  token_hash      TEXT NOT NULL UNIQUE,          -- seul le hash SHA-256 est stocké
  invited_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_team_invites_org ON team_invites(organization_id);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth_user_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "team_invites_admin_select" ON team_invites;
CREATE POLICY "team_invites_admin_select" ON team_invites
  FOR SELECT USING (organization_id = auth_user_organization_id() AND auth_user_is_admin());
DROP POLICY IF EXISTS "team_invites_admin_delete" ON team_invites;
CREATE POLICY "team_invites_admin_delete" ON team_invites
  FOR DELETE USING (organization_id = auth_user_organization_id() AND auth_user_is_admin());
-- Pas de policy INSERT/UPDATE : tout passe par les fonctions ci-dessous.

-- Création d'une invitation (admin uniquement). Renvoie le jeton en clair UNE SEULE FOIS.
CREATE OR REPLACE FUNCTION create_team_invite(p_email TEXT, p_role user_role)
RETURNS TEXT AS $$
DECLARE
  v_org UUID;
  v_token TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT auth_user_is_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
  v_org := auth_user_organization_id();
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  INSERT INTO team_invites (organization_id, email, role, token_hash, invited_by)
  VALUES (v_org, lower(trim(p_email)), p_role, encode(sha256(convert_to(v_token, 'utf8')), 'hex'), auth.uid());
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Infos affichables sur la page d'invitation (appelable sans compte) : nom de l'org + email invité.
CREATE OR REPLACE FUNCTION get_team_invite_info(p_token TEXT)
RETURNS TABLE (org_name TEXT, email TEXT, role user_role) AS $$
  SELECT o.name, i.email, i.role
  FROM team_invites i JOIN organizations o ON o.id = i.organization_id
  WHERE i.token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
    AND i.accepted_at IS NULL AND i.expires_at > NOW()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
GRANT EXECUTE ON FUNCTION get_team_invite_info(TEXT) TO anon, authenticated;

-- Acceptation : l'e-mail du compte connecté doit être celui de l'invitation.
CREATE OR REPLACE FUNCTION accept_team_invite(p_token TEXT)
RETURNS UUID AS $$
DECLARE
  v_inv team_invites%ROWTYPE;
  v_email TEXT;
  v_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) THEN RAISE EXCEPTION 'already_member'; END IF;

  SELECT * INTO v_inv FROM team_invites
   WHERE token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex')
     AND accepted_at IS NULL AND expires_at > NOW()
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_invite'; END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', email) INTO v_email, v_name
    FROM auth.users WHERE id = auth.uid();
  IF lower(v_email) <> lower(v_inv.email) THEN RAISE EXCEPTION 'email_mismatch'; END IF;

  INSERT INTO users (id, organization_id, email, full_name, role)
  VALUES (auth.uid(), v_inv.organization_id, v_email, v_name, v_inv.role);
  UPDATE team_invites SET accepted_at = NOW() WHERE id = v_inv.id;
  RETURN v_inv.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION create_team_invite(TEXT, user_role) FROM anon;
REVOKE ALL ON FUNCTION accept_team_invite(TEXT) FROM anon;

-- =====================================================================
-- DURCISSEMENT (étape finale, à faire APRÈS avoir déployé le nouveau code) :
-- aujourd'hui un utilisateur connecté peut s'insérer lui-même dans n'importe
-- quelle organisation si sa policy INSERT sur "users" le permet. Regarde d'abord :
--   SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'users';
-- puis remplace la policy INSERT par : on ne peut créer SA ligne que si l'organisation
-- n'a encore aucun membre (= création d'une nouvelle organisation).
--
--   DROP POLICY IF EXISTS "users_insert" ON users;
--   CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (
--     id = auth.uid()
--     AND role = 'admin'
--     AND NOT EXISTS (SELECT 1 FROM users u WHERE u.organization_id = users.organization_id)
--   );
-- =====================================================================
