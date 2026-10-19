export type WelcomeKind = "candidate" | "company" | "agency";
export type WelcomeLang = "fr" | "nl";

export interface WelcomeCopy {
  subject: string;
  title: string;
  greet: (name: string) => string;
  paragraphs: string[];
  closing: string;
  cta: string;
  ctaPath: string;
  preview: string;
}

/** Textes de bienvenue. Uniquement des fonctionnalités réellement disponibles. */
export const WELCOME: Record<WelcomeKind, Record<WelcomeLang, WelcomeCopy>> = {
  candidate: {
    fr: {
      subject: "🐺 Bienvenue dans la meute WOLKO !",
      title: "Ton prochain job commence ici.",
      greet: (n) => (n ? `Bonjour ${n},` : "Bonjour,"),
      paragraphs: [
        "Bienvenue chez WOLKO ! 🎉",
        "Tu viens de rejoindre une nouvelle façon de trouver du travail.",
        "Que tu recherches un CDI, un CDD, une mission d'intérim, un job étudiant ou un flexi-job, WOLKO t'aide à découvrir les opportunités qui correspondent à ton profil et à tes disponibilités.",
        "Complète ton profil, explore les offres et trouve le job qui te correspond.",
      ],
      closing: "La meute est ravie de t'accueillir !",
      cta: "Découvrir les offres",
      ctaPath: "/jobs",
      preview: "Ton prochain job commence ici.",
    },
    nl: {
      subject: "🐺 Welkom in de WOLKO-roedel!",
      title: "Je volgende job begint hier.",
      greet: (n) => (n ? `Hallo ${n},` : "Hallo,"),
      paragraphs: [
        "Welkom bij WOLKO! 🎉",
        "Je hebt zonet een nieuwe manier ontdekt om werk te vinden.",
        "Zoek je een vast contract, een contract van bepaalde duur, een interimopdracht, een studentenjob of een flexi-job? WOLKO helpt je de kansen te ontdekken die passen bij je profiel en je beschikbaarheid.",
        "Vul je profiel aan, bekijk de vacatures en vind de job die bij je past.",
      ],
      closing: "De roedel is blij je te verwelkomen!",
      cta: "Vacatures ontdekken",
      ctaPath: "/jobs",
      preview: "Je volgende job begint hier.",
    },
  },
  company: {
    fr: {
      subject: "🐺 Bienvenue chez WOLKO — Le recrutement a du flair !",
      title: "Vos prochains talents sont à portée de clic.",
      greet: (n) => (n ? `Bonjour ${n},` : "Bonjour,"),
      paragraphs: [
        "Bienvenue dans la meute WOLKO !",
        "Nous sommes ravis d'accueillir votre entreprise sur notre plateforme.",
        "Avec WOLKO, publiez vos offres d'emploi, centralisez vos candidatures et suivez vos recrutements depuis un espace simple et intuitif.",
        "Notre mission : rendre le recrutement plus accessible, plus rapide et plus humain.",
        "Votre essai gratuit de 7 jours est en cours : testez WOLKO sans carte bancaire et sans aucun prélèvement automatique.",
      ],
      closing: "Prêt à trouver vos prochains talents ?",
      cta: "Accéder à mon espace recruteur",
      ctaPath: "/dashboard",
      preview: "Vos prochains talents sont à portée de clic.",
    },
    nl: {
      subject: "🐺 Welkom bij WOLKO — Werven met flair!",
      title: "Uw volgende talenten zijn binnen handbereik.",
      greet: (n) => (n ? `Beste ${n},` : "Beste,"),
      paragraphs: [
        "Welkom in de WOLKO-roedel!",
        "We zijn verheugd uw bedrijf op ons platform te verwelkomen.",
        "Met WOLKO publiceert u uw vacatures, centraliseert u uw sollicitaties en volgt u uw aanwervingen op in een eenvoudige en intuïtieve omgeving.",
        "Onze missie: werven toegankelijker, sneller en menselijker maken.",
        "Uw gratis proefperiode van 7 dagen loopt: test WOLKO zonder bankkaart en zonder automatische afschrijving.",
      ],
      closing: "Klaar om uw volgende talenten te vinden?",
      cta: "Naar mijn recruiterruimte",
      ctaPath: "/dashboard",
      preview: "Uw volgende talenten zijn binnen handbereik.",
    },
  },
  agency: {
    fr: {
      subject: "🐺 Votre agence rejoint la meute WOLKO !",
      title: "Un nouvel allié pour vos recrutements.",
      greet: (n) => (n ? `Bonjour ${n},` : "Bonjour,"),
      paragraphs: [
        "Bienvenue chez WOLKO !",
        "Nous sommes heureux d'accueillir votre agence au sein de notre plateforme.",
        "WOLKO a été pensé pour les professionnels du recrutement qui souhaitent gagner du temps et organiser efficacement leurs missions.",
        "Retrouvez vos offres, vos candidatures et vos outils de suivi depuis votre espace professionnel.",
        "Votre essai gratuit de 7 jours est en cours : testez WOLKO sans carte bancaire et sans aucun prélèvement automatique.",
      ],
      closing: "Ensemble, donnons du flair à vos recrutements !",
      cta: "Accéder à mon espace agence",
      ctaPath: "/dashboard",
      preview: "Un nouvel allié pour vos recrutements.",
    },
    nl: {
      subject: "🐺 Uw bureau treedt toe tot de WOLKO-roedel!",
      title: "Een nieuwe bondgenoot voor uw aanwervingen.",
      greet: (n) => (n ? `Beste ${n},` : "Beste,"),
      paragraphs: [
        "Welkom bij WOLKO!",
        "We zijn blij uw bureau op ons platform te mogen verwelkomen.",
        "WOLKO is ontworpen voor wervingsprofessionals die tijd willen winnen en hun opdrachten efficiënt willen organiseren.",
        "Vind uw vacatures, sollicitaties en opvolgingstools terug in uw professionele omgeving.",
        "Uw gratis proefperiode van 7 dagen loopt: test WOLKO zonder bankkaart en zonder automatische afschrijving.",
      ],
      closing: "Samen geven we uw aanwervingen flair!",
      cta: "Naar mijn bureau-ruimte",
      ctaPath: "/dashboard",
      preview: "Een nieuwe bondgenoot voor uw aanwervingen.",
    },
  },
};

export const FOOTER: Record<WelcomeLang, { tagline: string; privacy: string; legal: string; why: string }> = {
  fr: {
    tagline: "WOLKO — Le recrutement a du flair.",
    privacy: "Politique de confidentialité",
    legal: "Wolko SRL (en cours de constitution) · Belgique",
    why: "Vous recevez cet email car vous venez de créer un compte sur wolko.be.",
  },
  nl: {
    tagline: "WOLKO — Werven met flair.",
    privacy: "Privacybeleid",
    legal: "Wolko SRL (in oprichting) · België",
    why: "U ontvangt deze e-mail omdat u zonet een account hebt aangemaakt op wolko.be.",
  },
};
