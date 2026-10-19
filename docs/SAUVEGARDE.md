# Sauvegarde et restauration (plan gratuit Supabase)

Une tâche GitHub Actions (`.github/workflows/backup.yml`) sauvegarde **chaque nuit** :
- la base (schémas `public` + `auth`, format `pg_dump`) ;
- tous les fichiers de Supabase Storage (CV, diplômes…).

Le tout est archivé puis **chiffré (AES-256)** avant d'être conservé 30 jours comme « artefact » GitHub (Actions → dernière exécution → *Artifacts* → `wolko-backup`).

## Mise en place (une seule fois, par Simon)

GitHub → dépôt `hardswork` → **Settings → Secrets and variables → Actions → New repository secret**. Créer 4 secrets :

| Nom | Valeur |
|---|---|
| `SUPABASE_DB_URL` | Supabase → bouton **Connect** → *Session pooler* → chaîne `postgresql://postgres.<ref>:<mot de passe>@…pooler.supabase.com:5432/postgres` (remplacer `[YOUR-PASSWORD]` par le mot de passe de la base ; il se réinitialise dans Settings → Database si oublié) |
| `SUPABASE_URL` | `https://zcqyiplcxmhznypadwyi.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé service_role (Settings → API) |
| `BACKUP_PASSPHRASE` | un mot de passe long inventé. **À noter dans un gestionnaire de mots de passe : sans lui, les sauvegardes sont illisibles.** |

Puis : onglet **Actions → Sauvegarde chiffrée → Run workflow** pour lancer un premier essai, et vérifier qu'il est vert.

## Restaurer

1. Télécharger l'artefact `wolko-backup` (fichier `wolko-AAAA-MM-JJ.tar.gz.gpg`).
2. Déchiffrer et extraire :
   ```
   gpg --output backup.tar.gz --decrypt wolko-AAAA-MM-JJ.tar.gz.gpg
   mkdir restore && tar -xzf backup.tar.gz -C restore
   ```
3. Créer un **nouveau projet Supabase vide** (ne jamais restaurer par-dessus la prod sans réfléchir), puis :
   ```
   pg_restore --no-owner --no-acl --clean --if-exists -d "<URL du nouveau projet>" restore/db.dump
   ```
   Des avertissements sur des objets déjà présents du schéma `auth` sont normaux.
4. Fichiers : `restore/storage/<bucket>/...` → à renvoyer dans les buckets du nouveau projet (même noms de buckets, même chemins).
5. Pointer les variables d'environnement Vercel vers le nouveau projet.

**Un essai de restauration doit être fait avant l'ouverture publique.**

## Limites

- Au pire, 24 h de données perdues.
- Le plan gratuit met le projet en pause après 7 jours d'inactivité : à l'ouverture, passer à Supabase Pro (sauvegardes quotidiennes intégrées, pas de pause).
- Les artefacts GitHub sont hébergés hors UE : c'est pourquoi ils sont chiffrés. Une copie supplémentaire en Suisse (Infomaniak kDrive) est possible plus tard.
