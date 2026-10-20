/**
 * Interrupteur de la candidathèque : OUVERTE depuis le 20/10/2026 (décision Simon).
 * L'accès reste réservé aux abonnés payants (Pro / Agence), contrôlé en base (org_has_pool_access).
 * Pour la refermer en urgence : variable Vercel CANDIDATE_POOL_ENABLED="false".
 */
export function poolEnabled(): boolean {
  return process.env.CANDIDATE_POOL_ENABLED !== "false";
}
