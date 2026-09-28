# Sosilook

**Le sosie de ton look.** Prends en photo un vêtement, des chaussures, un sac, une montre, un bijou ou des lunettes de soleil :
Sosilook trouve la pièce exacte au meilleur prix chez des vendeurs fiables, ou des pièces au même style, moins chères,
et note chaque offre (prix, qualité, fiabilité du vendeur).

Le plan complet (concurrence, feuille de route, monétisation, juridique) est dans [PLAN.md](./PLAN.md).

## Lancer le site

```bash
npm install
cp .env.example .env.local   # facultatif : sans clés, le site tourne en mode démo
npm run dev                  # http://localhost:3100
```

| Variable | Rôle | Sans la clé |
|---|---|---|
| `ANTHROPIC_API_KEY` | Analyse de la photo par Claude | Analyse d'exemple (polo Lacoste) |
| `SERPAPI_KEY` | Recherche Google Shopping France | Offres d'exemple, signalées à l'écran |

## Organisation du code

```
app/page.tsx                 En-tête, onglets, alertes et vestiaire
app/api/analyze/route.ts     Étape 1 : la photo → ce qu'on voit (marque proposée…)
app/api/search/route.ts      Étape 2 : marque confirmée → recherche → notation
components/ZipperIntro.tsx   L'intro « veste qui s'ouvre » (canvas)
components/SearchFlow.tsx    Parcours Photo → Marque → Résultats
components/Results.tsx       Étiquette de composition + étiquettes de prix
components/AlertsPanel.tsx   Onglet « Mes alertes »
components/Wardrobe.tsx      Onglet « Mon vestiaire »
lib/storage.ts               Alertes et vestiaire (stockés dans le navigateur)
lib/analyze.ts               Analyse de la photo par Claude (sortie structurée)
lib/search.ts                Recherche Google Shopping (SerpApi)
lib/score.ts                 Notes qualité / prix / globale et alertes
lib/retailers.ts             Base de confiance des vendeurs (officiel, agréé, seconde main…)
lib/demo.ts                  Données d'exemple du mode démo
```

## Déplacer vers son propre dépôt

Ce dossier vit pour l'instant dans `hardswork/sosilook`. Pour lui donner son propre dépôt :

```bash
# 1. Créer le dépôt vide "sosilook" sur github.com
# 2. Depuis ce dossier :
cp -r sosilook ../sosilook && cd ../sosilook
git init && git add . && git commit -m "Sosilook : prototype initial"
git remote add origin https://github.com/<ton-compte>/sosilook.git
git push -u origin main
```
