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

**Direction artistique « l'atelier »** : pour ne pas ressembler à un site généré, tout vient du monde du vêtement.
Toile denim et fil de surpiqûre orange, papier patron quadrillé, mètre ruban, étiquette tissée pour le logo,
étiquette de composition pour la fiche de la pièce, étiquettes de prix volantes pour les offres, tringle et cintres pour l'historique.
Typographies : Archivo en largeur étendue (titres « étiquette de travail ») et IBM Plex Mono (mentions techniques).

**L'arrivée sur le site** : une veste en denim fermée par une fermeture éclair. Le curseur descend, la veste s'ouvre en V
et révèle le site, comme une doublure. On peut aussi tirer la fermeture au doigt. Jouée une fois par visite,
désactivée pour les personnes qui préfèrent moins d'animations, bouton « Entrer » pour passer.

**Le parcours en 3 étapes**
1. **Photo** (ou capture d'écran), avec une précision facultative (« la montre, pas le pull »).
2. **Marque** : le site dit ce qu'il voit (« On pense que c'est du Lacoste, modèle L.12.12. C'est bien ça ? »)
   avec ses indices et son niveau de confiance. L'utilisateur confirme, corrige (suggestions de marques)
   ou répond « je ne connais pas la marque ». Puis il choisit : **la pièce exacte au meilleur prix** ou **son sosie, moins cher**.
3. **Résultats** notés, triables (recommandé, prix, qualité), avec un **curseur de budget**.

**Le look complet** : sur la photo d'une personne, le site repère chaque pièce de la tête aux pieds
(lunettes, veste, chemise, pantalon, montre, sac, chaussures…) et plante une épingle numérotée sur chacune.
Pour chaque pièce : marque proposée à confirmer ou corriger, choix « exacte » ou « sosie » (ou tout d'un coup),
case à décocher pour ignorer une pièce. Toutes les pièces sont cherchées en parallèle, puis le look est recomposé :
notre choix pour chaque pièce (la mieux notée chez un vendeur sûr), 3 offres par pièce, et le total du look
comparé aux prix boutique. Chaque pièce s'ouvre sur toutes ses offres, avec l'alerte promo.
Coût : une seule analyse de photo pour tout le look, mais une recherche par pièce.

**Les onglets**
- **Chercher** : le parcours ci-dessus.
- **Mes alertes** : un bouton « M'alerter d'une promo » sur chaque recherche. Prix de départ, prix du jour,
  prix cible modifiable (10 % sous le meilleur prix par défaut). Les prix sont revérifiés à chaque visite
  (au-delà de 6 h) ; une pièce en baisse ou sous le prix cible remonte en haut avec la mention « Promo ».
- **Mon vestiaire** : l'historique des recherches, sur une tringle, pour rouvrir un résultat en un geste.
- **La promesse** : « Des sosies, jamais des faux », comment on classe les vendeurs et comment on note.
- Sur téléphone, les onglets passent en barre fixe en bas de l'écran, comme une appli.

**Sous le capot**
- `/api/analyze` : Claude (vision) lit la photo : univers, marque et confiance, modèle, matière, coupe, prix boutique,
  requêtes de recherche, checklist qualité adaptée (grammage, mouvement, verre, métal, protection UV…).
- `/api/search` : prend la marque confirmée par l'utilisateur, reconstruit la requête si elle a été corrigée,
  cherche sur Google Shopping France (SerpApi), puis note chaque offre : fiabilité du vendeur, qualité, prix, alertes contrefaçon.
- Alertes et vestiaire sont gardés dans le navigateur (prototype). **Mode démo** automatique sans clés API, clairement signalé.

### 3.2 Idées pour la suite (classées par impact)
1. **Plusieurs pièces sur une photo** : on encadre chaque pièce, l'utilisateur touche celle qu'il veut.
2. **La lettre impact (le « Yuka de la mode »)** : une lettre de A à E par offre, pour savoir d'où vient la pièce
   et ce qu'elle coûte à la planète. Voir la section 3.5.
3. **Carte à partager** (format story) : « Trouvé sur Sosilook : −72 % ». Le meilleur moteur de bouche-à-oreille.
4. **Historique des prix** en courbe : savoir si une « promo » en est vraiment une.
5. **Mes tailles** (taille, pointure, tour de poignet) pour ne montrer que ce qui est disponible, et alerte « retour en stock ».
6. **Comparateur côte à côte** original / sosie : matière, fabrication, prix, note.
7. **Coût par port** : prix ÷ nombre de fois qu'on la portera. Montre pourquoi une pièce de qualité peut coûter moins cher à l'usage.
8. **Compteur d'économies** : « Tu as économisé 340 € cette année avec Sosilook ».
9. **Coller un lien** (Instagram, Pinterest, vidéo) au lieu d'une photo.
10. **Boutiques proches** pour essayer avant d'acheter.

### 3.3 Feuille de route

**Phase 1 — Lancement (semaines 1 à 4)**
- Brancher les vraies clés (Anthropic + SerpApi), mettre en ligne sur Vercel, acheter le domaine.
- Tester sur 50 pièces réelles (20 vêtements, 10 montres, 10 sacs, 5 bijoux, 5 lunettes) et ajuster les notes.
- **Plusieurs pièces sur une photo** : choisir celle qu'on veut.
- Mise en cache des recherches (même pièce = même résultat pendant 24 h) pour diviser les coûts.
- Inscription aux programmes d'affiliation (Awin, Effiliation, Kwanko, Amazon Partenaires, Vestiaire Collective, Zalando…).

**Phase 2 — Traction (mois 2 et 3)**
- **Pages « Look »** partageables : sosilook.fr/look/… avec la pièce, les meilleurs prix et les sosies (très bon pour le référencement Google et le partage TikTok).
- **Alertes par e-mail** : comptes utilisateurs + base Supabase + vérification planifiée (cron Vercel) + envoi via Resend (déjà utilisés sur Hardswork). Le prototype vérifie déjà les prix à chaque visite.
- Lecture des fiches produit par l'IA pour une note qualité plus précise (composition exacte, pays de fabrication, grammage).
- Compte utilisateur : favoris, taille, budget, style préféré.
- Ajout de la seconde main en direct (Vinted, Vestiaire Collective, Chrono24) en plus de Google Shopping.

**Phase 3 — Créateurs et échelle (mois 4 à 6)**
- **Espace créateurs** : un créateur TikTok colle sa vidéo, Sosilook identifie toutes les pièces du look et génère sa page avec liens exacts et sosies. Il partage le lien en bio et **touche une part des commissions**.
- Extension navigateur « Existe-t-il moins cher ? » sur les sites de marques.
- Version installable (PWA) avec appareil photo direct. L'appli native seulement si les chiffres le justifient.
- Ouverture Belgique, Suisse, puis Espagne et Italie.

### 3.5 La lettre impact : le « Yuka de la mode »
Une lettre de A à E sur chaque offre, à côté du prix et de la qualité. Très bonne idée, et le moment est idéal :
- **La loi AGEC** oblige depuis 2023 les grandes marques à indiquer sur la fiche produit les pays de tissage,
  de teinture et de confection, la part de matière recyclée et le relargage de microplastiques.
- **Le coût environnemental officiel** (méthode Écobalyse de l'ADEME) peut être affiché par les marques depuis
  octobre 2025, et près de 100 marques l'ont déjà adopté. Une base publique existe sur beta.gouv.
- **Clear Fashion** fait déjà un « Fashion Score » (appli de scan, environ 500 marques notées). C'est un partenaire
  possible plus qu'un concurrent : eux notent la pièce, nous trouvons où l'acheter moins cher.

Ce qui nous différencie : la lettre apparaît **au moment du choix**, entre la pièce originale et ses sosies,
et la seconde main est mise en avant (réutiliser une pièce est ce qui a le moins d'impact).

Proposition en deux temps :
1. **Version estimée** (rapide) : seconde main, matière (naturelle, recyclée ou synthétique), durabilité
   (notre note qualité), fabrication européenne quand elle est indiquée. Toujours marquée « estimation ».
2. **Version officielle** : lecture de la fiche produit (pays AGEC), coût environnemental Écobalyse quand il existe,
   voire partenariat avec Clear Fashion.

Point de vigilance : une lettre mal fondée ferait perdre la confiance. On affiche toujours d'où vient la note.

### 3.6 Technique

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

### 4.5 L'équation économique : dépenser le moins de tokens possible
Estimations à partir des tarifs publics, à confirmer par des mesures dès qu'on a les clés.

| | Pièce seule | Tenue complète |
|---|---|---|
| Premier prototype (Claude Opus 5, réflexion, photo 1280 px) | ≈ 5 c | ≈ 12 c |
| **Aujourd'hui** : Claude Haiku 4.5, sans réflexion, photo 896 px, réponse courte | **≈ 0,4 c** | **≈ 1 c** |
| + cache (même photo, même recherche) et pages Look partagées | moins encore | moins encore |

Déjà en place dans le code :
- **Modèle réglable** (`SOSILOOK_MODEL`), Haiku 4.5 par défaut : environ 5 fois moins cher par token. L'utilisateur confirme la marque, donc une petite erreur coûte peu.
- **Pas de réflexion** et des réponses courtes : ce que l'IA écrit coûte 5 fois plus cher que ce qu'elle lit.
- **Photo réduite à 896 px** : une image coûte environ (largeur × hauteur) / 750 tokens.
- **Cache** : même photo = même analyse pendant 24 h ; même recherche de prix = mêmes résultats pendant 6 h.
- **Coût réel journalisé** à chaque analyse, pour décider sur des chiffres.

Prochaines étapes :
1. Test comparatif sur 50 vraies photos : Haiku 4.5 contre un plus gros modèle (qualité des marques, coût mesuré).
2. Cache partagé entre serveurs (Vercel KV / Upstash) et pages Look publiques.
3. **Google Lens d'abord** pour une pièce seule : zéro token Claude, Claude seulement pour découper une tenue.
4. **Catalogues d'affiliation** (Awin, Effiliation…) stockés chez nous : la recherche de prix devient quasi gratuite, et chaque lien est affilié.

Revenu moyen estimé : ≈ 17 c par recherche (3 % d'achat, panier de 80 €, 7 % de commission). Sous le centime d'analyse, la marge est confortable ; le plus gros coût restant est la recherche de prix, d'où les étapes 3 et 4.

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
