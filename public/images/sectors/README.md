# Images des secteurs (mosaïque de la page d'accueil)

La mosaïque lit ces fichiers WebP. **Tant qu'un fichier est absent, l'ancienne photo est affichée à la place.**

| Fichier             | Secteur             | Ce qu'on cherche                                              |
|---------------------|---------------------|---------------------------------------------------------------|
| `construction.webp` | Construction        | ouvrier sur chantier (l'image actuelle peut rester)           |
| `sante.webp`        | Santé & médical     | infirmier(ère) en tenue bleue, hôpital moderne, en activité   |
| `transport.webp`    | Transport           | chauffeur poids lourd près de son camion, dépôt européen      |
| `industrie.webp`    | Industrie           | opérateur sur machine / ligne de production                   |
| `logistique.webp`   | Logistique          | préparateur de commandes ou cariste, entrepôt moderne         |
| `bureau.webp`       | Bureau              | collaborateur sur ordinateur, bureau moderne, ambiance naturelle |

Recherches Pexels : nurse hospital · truck driver · factory worker · warehouse worker · office worker · construction worker.
Licence Pexels : usage commercial autorisé, sans attribution obligatoire (garder le lien de la photo si possible).

## Ajouter / remplacer une photo
1. Dépose le JPG/PNG original dans `public/images/sectors/_source/` en le nommant comme ci-dessus (ex. `sante.jpg`).
2. Lance `node scripts/optimize-sector-images.mjs` : il crée les WebP (900 px de large, qualité 78) dans `public/images/sectors/`.
3. Commit + push. Cadrage : ajuste `pos` dans `MOSAIC` (src/app/page.tsx) si besoin.
