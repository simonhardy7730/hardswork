# Wolko — Dossier de lancement (audit, RGPD, déploiement)

Ce document n'est pas un avis juridique. Les points marqués ⚖️ doivent être validés par un juriste.

## 1. Sécurité — état

| Point | État |
|---|---|
| CV publics | Corrigé : bucket `candidate-cvs` privé, dépôts dans `candidate-documents` (URL signées 60 s). Migration 012. |
| Rôle / organisation modifiables par un membre | Corrigé (012) : trigger + policies. **À tester** avec deux comptes. |
| Inscription entreprise/agence | Refaite côté base (trigger 012). **À tester.** |
| Inscription candidat | Identité vérifiée côté serveur + limite de débit (013). |
| Candidature anonyme | Validation, limite 5/10 min et 20/jour, anti-doublon 24 h, emails non bloquants. Turnstile prêt (voir §4). |
| Build | TypeScript + ESLint obligatoires (plus de `ignore`). |
| Dépendances | Next 14 : failles corrigées seulement en 15.5.24+/16. **Migration à planifier avant ouverture.** |
| Secrets | Aucun secret dans le dépôt. service_role uniquement côté serveur. |

## 2. RGPD — inventaire des traitements

| Donnée | Finalité | Base légale (à valider ⚖️) | Où | Conservation |
|---|---|---|---|---|
| Identité, contact | Compte, candidature | Contrat | Supabase (UE, Irlande) | ⚖️ à définir |
| CV, diplômes | Candidature | Consentement / contrat | Bucket privé | ⚖️ à définir |
| Disponibilités, préférences | Mise en relation | Consentement | Supabase | ⚖️ à définir |
| Candidatures reçues par un recruteur | Recrutement | Intérêt légitime du recruteur | Supabase | ⚖️ à définir |
| Emails | Notifications | Contrat | Resend | Logs Resend |

Mis en place : export des données (`/api/account/export`), suppression du compte candidat (`/api/account/delete`, candidatures anonymisées), pages `/legal/privacy` et `/legal/cgu`.

À faire / ⚖️ :
- Durées de conservation : la page actuelle dit « 3 ans après la dernière activité » (écrite avant l'audit) → à faire valider.
- **Mineurs (15–17 ans)** : âge minimum, accord parental, traitement des disponibilités → avis juridique avant ouverture.
- **Qualification** : Wolko = jobboard/éditeur logiciel, ou activité de placement/recrutement réglementée selon la région ? ⚖️
- Vivier privé / CVthèque / réutilisation : non implémentés, nécessiteront un consentement explicite.
- Suppression des comptes entreprise/agence : par email à hello@wolko.be (pas de libre-service).
- Cookies : seulement techniques actuellement ; pas de bandeau nécessaire tant que rien d'analytique n'est ajouté.
- Entité légale : « Wolko SRL (en cours de constitution) » à mettre à jour (n° BCE, adresse).
- Registre des traitements et contrats sous-traitants (DPA Supabase, Vercel, Resend) à compléter.

## 3. Sauvegarde, restauration, retour arrière

- **Code** : Vercel → Deployments → ⋯ sur un déploiement précédent → *Promote to Production* (retour arrière immédiat, sans toucher à la base).
- **Base** : le plan gratuit Supabase n'a pas de sauvegarde automatique. Avant l'ouverture : plan Pro (sauvegardes quotidiennes) ou export régulier (`pg_dump`). **Aucune restauration n'a encore été testée → bloquant.**
- **Migrations** : additives. Retour arrière de 012 : voir les commentaires en bas du fichier.

## 4. Variables d'environnement à connaître

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret).
- Anti-bot (optionnel, à créer) : `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (publique) et `TURNSTILE_SECRET_KEY` (secret).
- Previews Vercel : `SUPABASE_SERVICE_ROLE_KEY` est aussi défini en Preview → une preview peut écrire dans la vraie base. Retirer Preview de cette variable ou créer une base de préproduction.

## 5. Checklist Go / No-Go

| Critère | Statut |
|---|---|
| CV non publics | Corrigé, à tester |
| Isolation entre organisations (test avec 2 entreprises) | À tester |
| Rôles non modifiables | Corrigé, à tester |
| Candidature anonyme protégée | Corrigé (Turnstile à activer) |
| Emails d'authentification | Validé (confirmation reçue) ; reset mot de passe à tester |
| Parcours candidat → candidature → recruteur | À tester |
| Pages légales complètes | ⚖️ |
| Sauvegarde/restauration vérifiée | **Bloquant** |
| Mise à jour de Next.js | **À faire avant ouverture** |
| Paiement / facturation | Non opérationnel : ne pas vendre avant validation |
