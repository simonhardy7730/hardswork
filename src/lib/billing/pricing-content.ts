// Textes commerciaux FR/NL de la page tarifs et des espaces recruteur.
// Uniquement des fonctionnalités RÉELLEMENT disponibles dans la plateforme.
import { LAUNCH_END_LABEL, TRIAL_DAYS, FOUNDER_MONTHS, PRICES } from "./pricing";

export type Bi = { fr: string; nl: string };
const b = (fr: string, nl: string): Bi => ({ fr, nl });

export const CONTENT = {
  launchBanner: {
    title: b("OFFRE DE LANCEMENT WOLKO — JUSQU'AU 31 DÉCEMBRE 2026", "WOLKO LANCERINGSAANBOD — TOT 31 DECEMBER 2026"),
    text: b(
      `Recrutez plus efficacement dès aujourd'hui et profitez de nos tarifs fondateurs pendant ${FOUNDER_MONTHS} mois.`,
      `Werf vandaag nog efficiënter en profiteer ${FOUNDER_MONTHS} maanden van onze oprichterstarieven.`
    ),
  },
  heroTitle: b("Choisissez votre", "Kies je"),
  heroTitleAccent: b("[plan]", "[plan]"),
  heroTitleEnd: b("de recrutement.", "voor werving."),
  heroText: b(
    "Des outils simples et efficaces pour trouver les bons profils.",
    "Eenvoudige en efficiënte tools om de juiste profielen te vinden."
  ),
  trial: {
    title: b("Essayez WOLKO gratuitement pendant 7 jours !", "Probeer WOLKO 7 dagen gratis!"),
    text: b(
      "Découvrez notre plateforme, publiez vos offres et simplifiez vos recrutements. Testez WOLKO pendant 7 jours avant de choisir votre abonnement.",
      "Ontdek ons platform, publiceer je vacatures en vereenvoudig je aanwervingen. Test WOLKO 7 dagen voordat je een abonnement kiest."
    ),
    primary: b("Démarrer mes 7 jours d'essai", "Mijn 7 proefdagen starten"),
    secondary: b("Demander une démonstration", "Een demo aanvragen"),
    notes: [
      b("Sans carte bancaire, aucun prélèvement automatique", "Zonder bankkaart, geen automatische afschrijving"),
      b(`${TRIAL_DAYS} jours calendaires, une seule fois par organisation`, `${TRIAL_DAYS} kalenderdagen, slechts één keer per organisatie`),
      b("Vos données sont conservées à la fin de l'essai", "Je gegevens blijven bewaard na de proefperiode"),
      b("Candidathèque réservée aux abonnés Pro et Agence", "Kandidatendatabank voorbehouden aan Pro- en Kantoor-abonnees"),
    ],
  },
  plans: {
    pro: {
      name: b("Pro — PME", "Pro — kmo"),
      description: b("Pour les PME qui recrutent en direct", "Voor kmo's die rechtstreeks werven"),
      features: [
        b("Publication d'offres d'emploi illimitées", "Onbeperkt vacatures publiceren"),
        b("Gestion des candidatures", "Beheer van sollicitaties"),
        b("Accès à la candidathèque", "Toegang tot de kandidatendatabank"),
        b("Coordonnées des candidats débloquées", "Contactgegevens van kandidaten ontgrendeld"),
        b("Tableau de bord recruteur", "Dashboard voor recruiters"),
        b("Outils de suivi des recrutements", "Tools voor opvolging van aanwervingen"),
      ],
      cta: b("Essayer gratuitement", "Gratis proberen"),
      launchCta: b("Profiter de l'offre de lancement", "Profiteer van het lanceringsaanbod"),
      standardCta: b("Choisir Pro", "Kies Pro"),
    },
    agency: {
      name: b("Agence", "Kantoor"),
      description: b("Pour les cabinets et agences de recrutement", "Voor wervingskantoren en -bureaus"),
      features: [
        b("Gestion des clients et suivi des prospects", "Klantenbeheer en opvolging van prospecten"),
        b("Gestion des candidats", "Kandidatenbeheer"),
        b("Accès à la candidathèque (recherche par métier)", "Toegang tot de kandidatendatabank (zoeken op beroep)"),
        b("ATS de recrutement (suivi des candidatures)", "ATS voor werving (opvolging van sollicitaties)"),
        b("Suivi des missions de recrutement", "Opvolging van wervingsopdrachten"),
        b("Équipe et rôles (administrateur, recruteur, lecture seule)", "Team en rollen (beheerder, recruiter, enkel lezen)"),
      ],
      cta: b("Découvrir WOLKO Agence", "WOLKO Kantoor ontdekken"),
      launchCta: b("Profiter de l'offre de lancement", "Profiteer van het lanceringsaanbod"),
      standardCta: b("Choisir Agence", "Kies Kantoor"),
    },
    network: {
      name: b("Agence Réseau", "Netwerkkantoor"),
      description: b("Pour les structures plus importantes", "Voor grotere structuren"),
      priceLabel: b("À partir de", "Vanaf"),
      priceNote: b("/mois HT — sur devis", "/maand excl. btw — op offerte"),
      features: [
        b("Plusieurs collaborateurs", "Meerdere medewerkers"),
        b("Centralisation des clients et des candidats", "Centralisatie van klanten en kandidaten"),
        b("Gestion des accès et des permissions", "Beheer van toegang en rechten"),
        b("Accompagnement personnalisé", "Persoonlijke begeleiding"),
      ],
      cta: b("Demander un devis", "Een offerte aanvragen"),
    },
  },
  labels: {
    popular: b("Le plus populaire", "Meest gekozen"),
    perMonthHt: b("/mois HT", "/maand excl. btw"),
    refPrice: b("Prix de référence", "Referentieprijs"),
    launchValid: b(
      `Tarif de lancement valable jusqu'au ${LAUNCH_END_LABEL.fr}`,
      `Lanceringstarief geldig tot ${LAUNCH_END_LABEL.nl}`
    ),
    launchBadge: (pct: number): Bi => b(`OFFRE DE LANCEMENT −${pct} %`, `LANCERINGSAANBOD −${pct} %`),
  },
  /** Mention contractuelle affichée sous les offres. */
  contractNote: b(
    "7 jours d'essai gratuits, sans engagement. Puis abonnement professionnel avec engagement initial de 12 mois, facturé mensuellement. Préavis de 30 jours avant échéance. Après la première année, abonnement mensuel résiliable avec un préavis de 30 jours. Tarifs HTVA.",
    "7 dagen gratis proefperiode, zonder verbintenis. Daarna professioneel abonnement met een initiële verbintenis van 12 maanden, maandelijks gefactureerd. Opzegtermijn van 30 dagen voor de vervaldatum. Na het eerste jaar maandelijks abonnement, opzegbaar met een opzegtermijn van 30 dagen. Prijzen excl. btw."
  ),
  conditions: {
    title: b("Conditions de l'offre", "Voorwaarden van het aanbod"),
    launch: [
      b(
        `Tarif de lancement : toute souscription conclue au plus tard le ${LAUNCH_END_LABEL.fr} conserve son prix pendant ${FOUNDER_MONTHS} mois à compter de la date de souscription, y compris aux renouvellements.`,
        `Lanceringstarief: elk abonnement afgesloten uiterlijk op ${LAUNCH_END_LABEL.nl} behoudt zijn prijs gedurende ${FOUNDER_MONTHS} maanden vanaf de datum van onderschrijving, ook bij verlengingen.`
      ),
      b(
        `À partir du 1er janvier 2027, les nouvelles souscriptions sont facturées aux tarifs standards (Pro ${PRICES.standard.pro} €/mois HT, Agence ${PRICES.standard.agency} €/mois HT).`,
        `Vanaf 1 januari 2027 worden nieuwe abonnementen aangerekend tegen de standaardtarieven (Pro ${PRICES.standard.pro} €/maand excl. btw, Kantoor ${PRICES.standard.agency} €/maand excl. btw).`
      ),
    ],
    common: [
      b("Prix exprimés hors TVA, par mois.", "Prijzen exclusief btw, per maand."),
      b(
        `Essai gratuit de ${TRIAL_DAYS} jours sans carte bancaire : aucun prélèvement sans votre accord explicite.`,
        `Gratis proefperiode van ${TRIAL_DAYS} dagen zonder bankkaart: geen afschrijving zonder jouw uitdrukkelijke toestemming.`
      ),
      b(
        "Le paiement en ligne n'est pas encore activé : la souscription se fait avec notre équipe (hello@wolko.be).",
        "Online betalen is nog niet actief: je abonnement wordt samen met ons team afgesloten (hello@wolko.be)."
      ),
    ],
  },
  faqs: [
    {
      q: b("Comment fonctionne l'essai gratuit ?", "Hoe werkt de gratis proefperiode?"),
      a: b(
        "7 jours calendaires, une seule fois par organisation, sans carte bancaire. À la fin de l'essai, vos données sont conservées ; vous choisissez ensuite votre abonnement pour continuer à publier et à contacter les candidats.",
        "7 kalenderdagen, slechts één keer per organisatie, zonder bankkaart. Na de proefperiode blijven je gegevens bewaard; daarna kies je een abonnement om te blijven publiceren en kandidaten te contacteren."
      ),
    },
    {
      q: b("Quel est l'engagement de l'abonnement ?", "Wat is de verbintenis van het abonnement?"),
      a: b(
        "L'abonnement payant comporte un engagement initial de 12 mois, facturé mensuellement. Pour ne pas poursuivre après ces 12 mois, demandez la non-reconduction au moins 30 jours avant l'échéance. Ensuite, l'abonnement continue à durée indéterminée, facturé mensuellement, et peut être résilié avec un préavis de 30 jours. Vous retrouvez toutes les dates dans « Mon abonnement ».",
        "Het betalende abonnement heeft een initiële verbintenis van 12 maanden, maandelijks gefactureerd. Om na die 12 maanden niet verder te gaan, vraagt u de niet-verlenging minstens 30 dagen voor de vervaldatum aan. Daarna loopt het abonnement voor onbepaalde duur door, maandelijks gefactureerd, en kan het met 30 dagen opzegtermijn worden opgezegd. Alle data vindt u terug in « Mijn abonnement »."
      ),
    },
    {
      q: b("Quels secteurs couvrez-vous ?", "Welke sectoren dekken jullie?"),
      a: b(
        "Construction, logistique, transport, industrie, médical, sécurité, nettoyage, Horeca, Tech & IT — tous les métiers.",
        "Bouw, logistiek, transport, industrie, medisch, beveiliging, schoonmaak, horeca, tech & IT — alle beroepen."
      ),
    },
    {
      q: b("Les candidats paient-ils quelque chose ?", "Betalen kandidaten iets?"),
      a: b(
        "Non — Wolko est 100 % gratuit pour les candidats. Ils créent leur profil et postulent aux offres.",
        "Nee — Wolko is 100 % gratis voor kandidaten. Zij maken hun profiel aan en solliciteren op vacatures."
      ),
    },
  ],
  finalCta: b("Lancer mon premier recrutement", "Mijn eerste aanwerving starten"),
} as const;
