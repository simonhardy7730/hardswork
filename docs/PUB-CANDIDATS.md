# Pub candidats — Wolko (Wallonie picarde)

Objectif : des inscriptions candidats gratuites (profil + CV). Page d'arrivée : `https://wolko.be/candidats`.
Seules les promesses vraies sont utilisées : gratuit, recherche par ville et distance, jours/horaires, postuler en ligne.
Pas de promesse de salaire, de nombre d'offres ni de délai d'embauche.

## Règles Meta (annonces d'emploi)
- Cocher la catégorie spéciale « Emploi » à la création de la campagne (obligatoire). Le ciblage par âge, sexe
  et code postal est alors limité : ciblez par zone (Tournai + 25 à 40 km, Mouscron, Mons, Ath) et centres d'intérêt larges.
- Pas de pixel installé : Meta ne peut pas optimiser sur « inscription ». Objectif : **Trafic** vers la page
  d'arrivée ; les inscriptions réelles se mesurent avec la requête de `docs/SUIVI-PUB.sql`.

## Budget et plafond
- Départ : 10 à 15 €/jour pendant 3 jours, puis on coupe ce qui ne marche pas.
- Plafond technique : Resend gratuit = 100 mails/jour, 2 mails par inscription ≈ 50 inscriptions/jour. Au-delà, l'envoi s'arrête.

## Liens à utiliser (un par annonce, pour savoir laquelle marche)
`https://wolko.be/candidats?utm_source=facebook&utm_medium=paid&utm_campaign=lancement-oct26&utm_content=A1`
Changer seulement `utm_content` : A1, A2, A3, B1, B2, B3 (voir ci-dessous).

## Textes (français) — texte principal / titre / bouton « S'inscrire » ou « En savoir plus »
**A1 — Proximité**
Texte : Un job près de chez vous, c'est possible. Cherchez autour de Tournai, Mouscron ou Mons, choisissez votre distance et postulez en ligne. Gratuit pour les candidats.
Titre : Trouvez un job près de chez vous

**A2 — Disponibilités**
Texte : Étudiant, flexi-job, intérim ou temps plein ? Indiquez vos jours et horaires disponibles : les offres affichées correspondent à votre planning. Inscription gratuite.
Titre : Des jobs qui collent à votre planning

**A3 — Métiers**
Texte : Construction, logistique, transport, industrie, santé, nettoyage, horeca : parcourez les offres de votre région et postulez en quelques clics. Gratuit.
Titre : Les offres de Wallonie picarde

**B1 — Étudiants / flexi**
Texte : Un job étudiant ou un flexi-job près de chez toi ? Indique tes dispos (après les cours, week-end, soirée) et postule en ligne. Gratuit.
Titre : Ton job étudiant près de chez toi

**B2 — Reprise rapide**
Texte : Disponible tout de suite ? Crée ton profil gratuit, ajoute ton CV et postule aux offres de ta région.
Titre : Crée ton profil en quelques minutes

**B3 — Données maîtrisées**
Texte : Tu décides qui voit ton profil. Par défaut, seuls les recruteurs auxquels tu postules. Export et suppression en un clic. Gratuit.
Titre : Ton profil, tes règles

Note : les annonces B (tutoiement) visent les jeunes ; A (vouvoiement) les adultes. Ne pas cibler les moins de 18 ans pour la visibilité recruteurs.

## Briefs visuels (à produire avec le loup Wolko, fond bleu nuit #101F43, jaune #FFB900)
1. Carte de la Wallonie picarde avec un cercle « 25 km » autour de Tournai et la phrase « Un job près de chez vous ».
2. Calendrier hebdomadaire simplifié avec des créneaux jaunes cochés : « Vos jours, vos horaires ».
3. Photos de métiers (déjà dans `public/images/sectors/`) avec bandeau « Gratuit pour les candidats ».
Formats : 1080×1350 (feed), 1080×1920 (stories/reels).

## Plan de test (3 jours)
- Jour 1 : A1, A2, A3 sur la même audience, budget égal. Jour 2 : B1, B2, B3. Jour 3 : on garde les 2 meilleurs.
- Critères : coût par inscription (budget ÷ inscrits dans `SUIVI-PUB.sql`), % de profils avec CV.
- Seuil d'arrêt : une annonce à plus de 2× le coût de la meilleure est coupée.

## Hors Meta (gratuit)
Groupes Facebook locaux d'emploi (respecter les règles de chaque groupe), Instagram du loup Wolko, WhatsApp, centres PMTIC / écoles.
