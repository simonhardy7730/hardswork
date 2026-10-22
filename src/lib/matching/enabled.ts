/**
 * Interrupteur du scoring A→E des candidatures. DÉSACTIVÉ par défaut (décision du 22/10/2026 : en attendant
 * l'information RGPD des candidats, l'AIPD et la validation par un juriste belge). Pour le réactiver :
 * variable d'environnement MATCH_ENABLED=1 sur Vercel. Tout le code reste en place.
 */
export const MATCH_ENABLED = process.env.MATCH_ENABLED === "1";
