# Scénario de tests finaux (avant les vrais candidats)

Prérequis : SQL 015 exécuté, clés Turnstile en place, 2 adresses mail de test.

## 1. Parcours candidat
1. Inscription candidat (FR puis NL) → mail de confirmation reçu, un seul message de bienvenue, expéditeur « Wolko ».
2. Compléter le profil, postuler à une offre → la candidature apparaît côté entreprise.
3. Se déconnecter / se reconnecter / mot de passe oublié.

## 2. Parcours entreprise
1. Inscription entreprise → essai de 7 jours affiché (bandeau + Paramètres > Abonnement).
2. Publier une offre, recevoir la candidature du test 1, coordonnées visibles pendant l'essai.
3. Réinscrire un 2e compte avec le même numéro de TVA → pas de nouvel essai.
4. Après expiration (simuler en SQL) : publication bloquée, coordonnées masquées, données conservées.

## 3. Parcours agence
1. Inscription agence → essai, accès CRM / ATS / missions.
2. Activation manuelle : `select subscribe_organization('<org_id>','pro');`

## 4. Isolation entre organisations (2 comptes entreprise A et B)
- A ne voit jamais les candidatures, offres internes ou candidats de B (liste, URL directe avec l'id de B).
- Un candidat ne voit jamais les données d'un autre candidat.
- Les routes /api/* sans session renvoient 401.

## 5. Mobile / sécurité
- Pages principales sur téléphone (≈375 px).
- /api/health renvoie {"ok":true}.
- En-têtes présents (securityheaders.com).

## 6. Candidathèque (après SQL 015-017 et CANDIDATE_POOL_ENABLED=true)
- Inscription candidat : date de naissance obligatoire ; < 15 ans refusé ; 15-17 ans : pas de case de visibilité.
- Majeur : cocher la case → apparaît dans la candidathèque d'une entreprise en essai/abonnée ; décocher → disparaît.
- Entreprise sans accès (essai expiré) : message d'abonnement, aucun profil ni coordonnée.
- Coordonnées visibles uniquement après clic ; le clic est journalisé (table candidate_pool_access).
