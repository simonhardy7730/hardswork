// Textes commerciaux FR/NL de la page tarifs et des espaces recruteur.
// Uniquement des fonctionnalités RÉELLEMENT disponibles dans la plateforme.
import { LAUNCH_END_LABEL, TRIAL_DAYS, FOUNDER_MONTHS, PRICES, SETUP_FEES } from "./pricing";

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
      b("Sans carte bancaire, sans frais de mise en service, aucun prélèvement automatique", "Zonder bankkaart, zonder opstartkosten, geen automatische afschrijving"),
      b(`${TRIAL_DAYS} jours calendaires, une seule fois par organisation`, `${TRIAL_DAYS} kalenderdagen, slechts één keer per organisatie`),
      b("Aucun abonnement n'est activé automatiquement à la fin de l'essai", "Na de proefperiode wordt niet automatisch een abonnement geactiveerd"),
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
    "L'essai de 7 jours est entièrement gratuit et sans engagement. Les frais de mise en service et l'engagement de 12 mois ne s'appliquent qu'après acceptation explicite d'un abonnement payant. Préavis de 30 jours avant l'échéance annuelle. Tarifs HTVA.",
    "De proefperiode van 7 dagen is volledig gratis en vrijblijvend. De opstartkosten en de verbintenis van 12 maanden gelden pas na uitdrukkelijke aanvaarding van een betalend abonnement. Opzegtermijn van 30 dagen vóór de jaarlijkse vervaldatum. Prijzen excl. btw."
  ),
  /** Mention promotionnelle sous les cartes (seulement pendant l'offre de lancement). */
  launchGuarantee: b(
    "Tarifs de lancement jusqu'au 31/12/2026. Prix mensuel garanti pendant les 12 premiers mois pour toute souscription éligible.",
    "Lanceringstarieven tot 31/12/2026. Maandprijs gegarandeerd gedurende de eerste 12 maanden voor elk in aanmerking komend abonnement."
  ),
  labels2: {
    setupFee: (eur: number): Bi => b(`Frais de mise en service : ${eur} € HTVA, une seule fois`, `Opstartkosten: ${eur} € excl. btw, eenmalig`),
    setupQuote: b("Frais de mise en service sur devis", "Opstartkosten op offerte"),
    trialLine: b("7 jours d'essai gratuits", "7 dagen gratis proefperiode"),
    commitLine: b("Engagement de 12 mois après souscription", "Verbintenis van 12 maanden na onderschrijving"),
  },
  setupWhy: {
    title: b("Un accompagnement dès le départ", "Begeleiding vanaf dag één"),
    intro: b(
      "Nos frais de mise en service correspondent à l'accompagnement initial nécessaire pour prendre en main WOLKO et configurer votre espace professionnel. Ils sont facturés une seule fois, uniquement si vous souscrivez un abonnement payant après l'essai, et jamais pendant l'essai ni à chaque renouvellement.",
      "Onze opstartkosten komen overeen met de eerste begeleiding om WOLKO onder de knie te krijgen en je professionele ruimte te configureren. Ze worden slechts één keer aangerekend, enkel als je na de proefperiode een betalend abonnement afsluit, en nooit tijdens de proefperiode of bij elke verlenging."
    ),
    pro: {
      title: b(`Pro — ${SETUP_FEES.pro} € HTVA`, `Pro — ${SETUP_FEES.pro} € excl. btw`),
      items: [
        b("Configuration du compte", "Configuratie van het account"),
        b("Assistance à la première publication", "Hulp bij de eerste publicatie"),
        b("Présentation de l'espace de recrutement", "Voorstelling van de wervingsruimte"),
      ],
    },
    agency: {
      title: b(`Agence — ${SETUP_FEES.agency} € HTVA`, `Kantoor — ${SETUP_FEES.agency} € excl. btw`),
      items: [
        b("Paramétrage de l'espace agence", "Configuratie van de kantoorruimte"),
        b("Configuration des utilisateurs", "Configuratie van de gebruikers"),
        b("Présentation du CRM et de l'ATS", "Voorstelling van de CRM en de ATS"),
        b("Accompagnement initial", "Eerste begeleiding"),
      ],
    },
    network: {
      title: b("Agence Réseau — sur devis", "Netwerkkantoor — op offerte"),
      items: [
        b("Déploiement personnalisé", "Uitrol op maat"),
        b("Prestations définies sur devis (migrations ou intégrations éventuelles : uniquement si elles figurent au devis)", "Prestaties vastgelegd in de offerte (eventuele migraties of integraties: enkel indien opgenomen in de offerte)"),
      ],
    },
  },
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
        `Frais de mise en service uniques (Pro ${SETUP_FEES.pro} € HTVA, Agence ${SETUP_FEES.agency} € HTVA, Agence Réseau sur devis) : dus uniquement à la souscription d'un abonnement payant, jamais pendant l'essai, une seule fois et non à chaque renouvellement.`,
        `Eenmalige opstartkosten (Pro ${SETUP_FEES.pro} € excl. btw, Kantoor ${SETUP_FEES.agency} € excl. btw, Netwerkkantoor op offerte): enkel verschuldigd bij het afsluiten van een betalend abonnement, nooit tijdens de proefperiode, eenmalig en niet bij elke verlenging.`
      ),
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
        "7 jours calendaires, une seule fois par organisation, sans carte bancaire. À la fin de l'essai, aucun abonnement n'est activé automatiquement et aucune facture n'est émise : pour continuer à publier et à contacter les candidats, vous choisissez expressément une formule payante avec notre équipe. Vos données sont conservées selon notre politique de confidentialité.",
        "7 kalenderdagen, slechts één keer per organisatie, zonder bankkaart. Na de proefperiode wordt niet automatisch een abonnement geactiveerd en volgt geen factuur: om te blijven publiceren en kandidaten te contacteren kies je uitdrukkelijk een betalende formule met ons team. Je gegevens worden bewaard volgens ons privacybeleid."
      ),
    },
    {
      q: b("Quel est l'engagement de l'abonnement ?", "Wat is de verbintenis van het abonnement?"),
      a: b(
        "L'abonnement payant (Pro ou Agence) se souscrit expressément avec notre équipe. Il comporte un engagement initial de 12 mois à compter de son activation, facturé mensuellement. Pour mettre fin au contrat à l'échéance annuelle, la demande doit nous parvenir au moins 30 jours avant cette échéance. Les dates exactes figurent dans « Mon abonnement ».",
        "Het betalende abonnement (Pro of Kantoor) wordt uitdrukkelijk afgesloten met ons team. Het heeft een initiële verbintenis van 12 maanden vanaf de activering, maandelijks gefactureerd. Om het contract op de jaarlijkse vervaldatum te beëindigen, moet de aanvraag ons minstens 30 dagen voor die vervaldatum bereiken. De exacte data vindt u terug in « Mijn abonnement »."
      ),
    },
    {
      q: b("J'ai déjà un logiciel de recrutement (ATS) : WOLKO m'est-il utile ?", "Ik heb al recruitmentsoftware (ATS): is WOLKO nuttig voor mij?"),
      a: b(
        "WOLKO peut être un canal supplémentaire pour publier vos offres et toucher des candidats de votre région, en plus de votre logiciel habituel. Il n'existe pas, à ce jour, de synchronisation automatique avec les logiciels RH tiers : les candidatures reçues sur WOLKO se gèrent dans WOLKO. L'essai gratuit de 7 jours permet de juger si ce canal vous convient.",
        "WOLKO kan een extra kanaal zijn om je vacatures te publiceren en kandidaten uit je regio te bereiken, naast je gebruikelijke software. Er bestaat vandaag geen automatische synchronisatie met HR-software van derden: sollicitaties via WOLKO beheer je in WOLKO. Met de gratis proefperiode van 7 dagen kun je beoordelen of dit kanaal bij je past."
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
