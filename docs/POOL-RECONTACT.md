# Candidathèque (type HelloWork) — recherche par les recruteurs abonnés

Mise à jour 19/10/2026 : c'est le cœur de l'offre Pro, donc retenu. Fait : case de consentement (inscription +
Mon compte), migration 016, texte de confidentialité. À faire : écran de recherche recruteur (voir ci-dessous).

## Ancienne conception (toujours valable pour la suite)

Ne pas ouvrir la recherche aux recruteurs avant validation juridique. Un interrupteur côté candidat sans fonction côté
recruteur serait trompeur, et l'inverse (recruteurs voient des profils) sans base légale est interdit
par notre propre politique de confidentialité (« une candidature ne vaut pas autorisation de réutilisation »).

## Principes
- Opt-in explicite, séparé de l'inscription et de toute candidature, case non pré-cochée, retirable en 1 clic.
- Horodatage + version du texte de consentement stockés (`pool_consent_at`, `pool_consent_version`).
- Exclusion automatique des moins de 18 ans et des comptes sans disponibilités renseignées.
- Expiration : consentement caduc après 12 mois sans activité ; purge/anonymisation ensuite.
- Données minimisées côté recruteur : prénom, ville, type de job, disponibilités ; coordonnées uniquement
  après acceptation du candidat (contact via Wolko, pas de téléchargement de masse).
- Accès réservé aux organisations avec `org_has_access` (essai ou abonnement) ; journal des consultations.
- RLS : lecture via fonction SECURITY DEFINER filtrant sur consentement valide, jamais via la table brute.

## À valider avec un juriste avant de coder
Base légale (consentement), texte exact, durée, information des candidats, rôle de Wolko (responsable
conjoint ou sous-traitant), traitement des mineurs.

## État du code (19/10/2026)
- Migrations : 016 (consentement) puis 017 (fonctions `search_candidate_pool` et `reveal_candidate_contact`, journal des accès).
- Écran : /dashboard/candidatheque, FERMÉ tant que la variable Vercel `CANDIDATE_POOL_ENABLED` n'est pas `true`.
- Garde-fous : abonnés/essai actif uniquement, candidats consentants (< 24 mois), coordonnées masquées jusqu'au clic,
  100 nouveaux contacts/jour/organisation, journal de chaque consultation.
- Point ouvert : l'âge n'est pas collecté, donc les moins de 18 ans ne peuvent pas être exclus automatiquement.
  À trancher avant ouverture (champ date de naissance / confirmation « j'ai 18 ans » dans le consentement).
