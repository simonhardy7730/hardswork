# Sosilook — Plan détaillé

> **Le sosie de ton look.** Prends en photo un vêtement, des chaussures, un sac, une montre, un bijou ou des lunettes :
> Sosilook trouve **la pièce exacte au meilleur prix chez des vendeurs fiables**, ou **son sosie moins cher**,
> et note chaque offre sur le prix, la qualité et la fiabilité du vendeur.

---

## 1. Verdict : est-ce faisable ? Oui.

| Question | Réponse |
|---|---|
| Techniquement possible ? | **Oui, dès aujourd'hui.** Le prototype de ce dossier fonctionne : photo → analyse IA → recherche → classement noté. |
| Le besoin existe ? | **Oui.** « C'est quoi la marque ? » / « Où le trouver ? » est l'un des commentaires les plus fréquents sous les vidéos mode. Le contenu « dupe » est un phénomène massif sur TikTok. |
| Il y a de la concurrence ? | **Oui, beaucoup** (voir §2). C'est plutôt une bonne nouvelle : le marché est validé. Mais il faut un angle net pour exister. |
| Ça peut rapporter ? | **Oui, via l'affiliation** d'abord, puis les créateurs et les marques (voir §4). L'équation est serrée au début : il faut maîtriser le coût par recherche. |
| Site ou application ? | **Site web (responsive + installable sur l'écran d'accueil).** Coût quasi nul, pas de commission Apple/Google, partage de liens facile depuis TikTok. L'appli viendra si le site décolle. |

---

## 2. Concurrence (septembre 2026)

| Acteur | Ce qu'il fait | Forces | Faiblesses (notre ouverture) |
|---|---|---|---|
| **Google Lens** | Recherche visuelle universelle | Gratuit, énorme index, intégré partout | Ne conseille pas : pas de note qualité, pas de tri par fiabilité, pas de distinction « exact / style ». Mélange vrais et faux. |
| **Phia** (Phoebe Gates) | Extension/appli qui compare les prix neuf + seconde main | 40 000 sites, 250 M d'articles d'occasion, levée de fonds | Part d'un **lien produit**, pas d'une photo. Centré US. |
| **Dupe.com** | Trouve des « lookalikes » moins chers (photo, lien) | Positionnement « dupe » clair | US. Le mot « dupe » flirte avec la contrefaçon : sujet sensible en France. |
| **Copped, Snapped, Outfit Lens, FetchFashion** | Applis « AI outfit finder » (photo → pièces exactes + similaires) | Rapides, IA mode, certaines indexent la revente | Surtout anglophones, centrés vêtements, **aucune garantie d'authenticité**, notes de qualité faibles ou absentes. |
| **Amazon StyleSnap, ASOS/Zalando visual search** | Recherche visuelle dans **leur** catalogue | Achat en 1 clic | Enfermés dans un seul magasin : pas comparatif, pas neutre. |
| **Vinted, Vestiaire Collective** | Revente | Énorme en France | Ce sont des **sources**, pas des comparateurs. Ce sont nos partenaires potentiels. |

### Ce qui rend Sosilook « beaucoup mieux »

1. **Deux modes clairs, un seul geste** : « La pièce exacte » (authentique, au meilleur prix) **ou** « Le même style » (alternatives légales moins chères). Personne ne les sépare aussi clairement.
2. **La promesse « Des sosies, jamais des faux »** : en mode exact, on ne met en avant que le site officiel, les revendeurs reconnus et la seconde main authentifiée (Vestiaire Collective, Collector Square, Chrono24…). Les plateformes à risque sont signalées. **En France, acheter ou détenir une contrefaçon est un délit douanier** : c'est un vrai argument de confiance.
3. **Une note transparente** pour chaque offre (prix, qualité, fiabilité), avec le *pourquoi* : « + 100 % coton », « + verre saphir », « − plaqué or ». On apprend à l'utilisateur à reconnaître la qualité.
4. **Tous les univers dès le départ** : vêtements, chaussures, sacs à main et sacoches, **montres, bijoux, lunettes de soleil**. C'est là que les prix sont les plus élevés, et donc les économies les plus fortes : une montre automatique à verre saphir existe à 300 € quand l'originale en coûte 3 000.
5. **Français et européen d'abord** : Google Shopping France, marques et revendeurs européens, livraison en France, prix en euros. Les concurrents IA sont presque tous américains.
6. **Positionnement style « classique / old money »** au lancement : une niche passionnée, très présente sur TikTok, où les prix des marques sont élevés et les bonnes alternatives existent (Uniqlo, Arket, Saint James, Asphalte, Seiko, Baltic, Polène…).
7. **Pensé pour les créateurs** (voir §4) : chaque look de TikTok devient une page Sosilook partageable.

---

## 3. Le produit

### 3.1 Ce que fait déjà le prototype (dans ce dossier)

- Envoi d'une photo ou capture d'écran (réduite dans le navigateur pour aller vite).
- **Analyse par Claude (vision)** : univers (vêtement, montre, sac…), marque et niveau de confiance, modèle probable, matière, coupe, prix boutique estimé, requête « exacte », requêtes « style » **sans nom de marque**, et checklist qualité adaptée (grammage, mouvement, verre, type de cuir, protection UV…).
- **Recherche Google Shopping France** (via SerpApi) : 1 requête en mode exact, 3 en mode style, dédoublonnées.
- **Classement noté** :
  - *Fiabilité* : officiel > revendeur reconnu > seconde main authentifiée > occasion entre particuliers > à vérifier.
  - *Qualité* : indices dans l'annonce (matière, fabrication, mouvement, métal, verres…), marques réputées, avis clients.
  - *Prix* : relatif aux autres offres, avec l'économie en % par rapport au prix boutique.
  - *Alertes* : plateforme à risque, prix anormalement bas pour du neuf de marque, vente entre particuliers.
  - Mode exact : la fiabilité pèse 50 %. Mode style : la qualité pèse 45 %.
- Tri « Recommandé / Prix / Qualité ».
- **Mode démo** automatique sans clés API, avec des données d'exemple clairement signalées.

### 3.2 Feuille de route

**Phase 1 — Lancement (semaines 1 à 4)**
- Brancher les vraies clés (Anthropic + SerpApi), mettre en ligne sur Vercel, acheter le domaine.
- Tester sur 50 pièces réelles (20 vêtements, 10 montres, 10 sacs, 5 bijoux, 5 lunettes) et ajuster les notes.
- Ajouter un **lien TikTok/Instagram** en entrée (en plus de la photo) et un **recadrage** quand plusieurs pièces sont visibles (« laquelle veux-tu ? »).
- Mise en cache des recherches (même pièce = même résultat pendant 24 h) pour diviser les coûts.
- Inscription aux programmes d'affiliation (Awin, Effiliation, Kwanko, Amazon Partenaires, Vestiaire Collective, Zalando…).

**Phase 2 — Traction (mois 2 et 3)**
- **Pages « Look »** partageables : sosilook.fr/look/… avec la pièce, les meilleurs prix et les sosies (très bon pour le référencement Google et le partage TikTok).
- **Alertes prix** : « préviens-moi quand ce sac passe sous 200 € ».
- Lecture des fiches produit par l'IA pour une note qualité plus précise (composition exacte, pays de fabrication, grammage).
- Compte utilisateur : favoris, taille, budget, style préféré.
- Ajout de la seconde main en direct (Vinted, Vestiaire Collective, Chrono24) en plus de Google Shopping.

**Phase 3 — Créateurs et échelle (mois 4 à 6)**
- **Espace créateurs** : un créateur TikTok colle sa vidéo, Sosilook identifie toutes les pièces du look et génère sa page avec liens exacts et sosies. Il partage le lien en bio et **touche une part des commissions**.
- Extension navigateur « Existe-t-il moins cher ? » sur les sites de marques.
- Version installable (PWA) avec appareil photo direct. L'appli native seulement si les chiffres le justifient.
- Ouverture Belgique, Suisse, puis Espagne et Italie.

### 3.3 Technique

| Brique | Choix | Pourquoi |
|---|---|---|
| Site | Next.js 14 + Tailwind (comme Hardswork) | Tu connais déjà la stack, déploiement Vercel gratuit au départ |
| Vision IA | Claude Opus 5 (API Anthropic), sortie structurée | Excellente reconnaissance, JSON garanti |
| Recherche produits | SerpApi Google Shopping France | Démarrage immédiat, sans négocier avec chaque marchand |
| Plus tard | Flux produits d'affiliation (Awin…) + base de données (Supabase) | Moins cher par recherche, liens affiliés natifs, historique des prix |

---

## 4. Monétisation : comment gagner de l'argent

### 4.1 Affiliation (revenu principal, dès le jour 1)
Quand quelqu'un achète via un lien Sosilook, le marchand nous verse une commission.
- Ordres de grandeur en mode : **3 à 12 %** du panier (ex. Privé by Zalando FR sur Awin : 5 % nouveaux clients). Luxe et seconde main : souvent 3 à 8 %, mais sur des paniers beaucoup plus gros (sac à 800 €, montre à 1 500 €).
- **Règle d'or : le classement ne dépend jamais de la commission.** C'est ce qui rend la promesse crédible, et c'est écrit sur le site.

### 4.2 Programme créateurs (le vrai accélérateur)
- Les créateurs mode ont le problème chaque jour (« c'est quoi ton pull ? »).
- Sosilook leur fournit la page de leurs looks, et **partage avec eux les commissions** générées (par ex. 50/50).
- Résultat : ils ramènent le trafic gratuitement. C'est le canal d'acquisition le moins cher possible.

### 4.3 Sosilook+ (abonnement, phase 2)
Environ **3,99 €/mois** : recherches illimitées, alertes prix, recherche de la pièce exacte en seconde main en priorité, historique des prix.
La version gratuite reste généreuse (ex. 10 recherches par jour).

### 4.4 Marques (phase 3)
- **Emplacements « Alternative mise en avant »**, toujours signalés comme sponsorisés et jamais devant une offre mieux notée.
- **Tendances** : rapports anonymisés vendus aux marques (« les pièces les plus recherchées ce mois-ci, les prix que les gens trouvent trop chers »).

### 4.5 L'équation économique (à surveiller dès le lancement)
| Poste | Estimation par recherche |
|---|---|
| Analyse IA (Claude Opus 5, 1 photo) | ≈ 0,03 à 0,06 € |
| Recherche Shopping (1 à 3 requêtes SerpApi) | ≈ 0,01 à 0,05 € |
| **Coût total** | **≈ 0,05 à 0,10 €** |
| Revenu moyen si 3 % des recherches mènent à un achat à 80 € avec 7 % de commission | ≈ 0,17 € |

C'est rentable, mais avec peu de marge : d'où le **cache**, les **pages Look** (une analyse, des milliers de vues) et les créateurs.
Si besoin, on pourra passer l'analyse sur un modèle Claude moins cher, **après avoir mesuré** que la qualité tient.

---

## 5. Juridique (à ne pas négliger)
- **Contrefaçon** : ne jamais proposer de copie portant un logo ou un motif protégé. Les requêtes « style » excluent les marques, et on signale les plateformes à risque.
- **Noms de marque** : les citer pour identifier un produit est permis. Ne jamais laisser croire à un partenariat officiel.
- **Affiliation** : indiquer clairement la présence de liens affiliés (DGCCRF, loi Influenceurs 2023).
- **RGPD** : ne pas stocker les photos par défaut (c'est le cas du prototype). Les photos de personnes restent privées.
- **CGU de SerpApi et de Google** : à respecter. À terme, les flux d'affiliation officiels réduisent cette dépendance.

---

## 6. Nom et domaine
- **Sosilook** = *sosie* + *look* : « le sosie de ton look ». Il dit exactement ce que fait le site, en français, facile à retenir et à prononcer.
- Aucune marque ni aucun site existant trouvé sous ce nom lors de la recherche (septembre 2026). **sosilook.com** ne pointe vers aucun site.
- À faire : vérifier chez un registrar (OVH, Gandi…) et réserver **sosilook.fr** + **sosilook.com** (≈ 10 à 15 € par an chacun), et le compte **@sosilook** sur TikTok et Instagram.
- Avant d'investir : une recherche de marque à l'INPI / EUIPO (classes 35 et 42).

---

## 7. Prochaines étapes concrètes
1. Créer le dépôt GitHub `sosilook` et y déplacer ce dossier (voir README).
2. Créer une clé API Anthropic et une clé SerpApi, puis les mettre dans `.env.local`.
3. Tester avec 50 vraies photos et noter ce qui marche ou pas.
4. Réserver le domaine et les comptes sociaux.
5. Mettre en ligne sur Vercel et faire tester à 10 personnes de ton entourage.
6. Contacter 5 créateurs TikTok « style classique » pour le programme créateurs.
