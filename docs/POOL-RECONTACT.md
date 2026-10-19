# Pool de recontact (étudiants / flexi-jobs) — conception, NON implémenté

Décision : ne pas livrer avant validation juridique. Un interrupteur côté candidat sans fonction côté
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
