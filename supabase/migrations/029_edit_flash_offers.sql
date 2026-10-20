-- 029 : permettre de modifier une annonce WOLKO Flash publiée (organisation sans abonnement).
-- La policy d'UPDATE d'origine exige org_has_access() dès que status = 'active' : une annonce Flash active n'était donc
-- pas modifiable. On ajoute une policy permissive qui l'autorise UNIQUEMENT si l'offre a un crédit Flash actif
-- (un crédit actif ne se crée que par la fonction serveur de publication : impossible de s'auto-publier ainsi).
-- Le trigger job_offers_flash_guard continue de verrouiller le titre et la date d'expiration.
DROP POLICY IF EXISTS "job_offers_update_flash" ON job_offers;
CREATE POLICY "job_offers_update_flash" ON job_offers FOR UPDATE
  USING (organization_id = auth_user_organization_id() AND auth_user_can_write())
  WITH CHECK (
    organization_id = auth_user_organization_id() AND auth_user_can_write()
    AND EXISTS (SELECT 1 FROM flash_credits fc WHERE fc.job_offer_id = job_offers.id AND fc.status = 'active')
  );
-- Retour arrière : DROP POLICY "job_offers_update_flash" ON job_offers;
