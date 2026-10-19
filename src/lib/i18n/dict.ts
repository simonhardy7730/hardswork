/** Textes des pages publiques en français et en néerlandais. Même structure obligatoire (typée). */
const fr = {
  tagline: "Le bon talent. La bonne entreprise.",
  nav: {
    jobs: "Trouver un emploi", recruit: "Recruter", pricing: "Nos tarifs", how: "Comment ça marche",
    login: "Connexion", signup: "Créer un compte", open: "Ouvrir le menu", close: "Fermer le menu",
    home: "Accueil", main: "Navigation principale", mobile: "Menu mobile", lang: "Langue",
  },
  footer: {
    candidates: "Candidats", recruiters: "Recruteurs", info: "Informations",
    findJob: "Trouver un emploi", createProfile: "Créer mon profil", login: "Connexion",
    recruiterSpace: "Espace recruteurs", pricing: "Tarifs", createAccount: "Créer un compte",
    contact: "Contact", cgu: "Conditions générales", privacy: "Politique de confidentialité",
    rights: "Tous droits réservés",
  },
  hero: {
    h1a: "Le bon talent.", h1b: "La bonne ", h1c: "entreprise.",
    sub: "La plateforme belge qui rapproche les candidats, les entreprises et les agences d'intérim. Trouvez un emploi ou recrutez plus simplement, près de chez vous.",
    candTitle: "Je cherche un emploi", candText: "Découvrez les opportunités près de chez vous et postulez facilement.", candCta: "Trouver un emploi",
    recTitle: "Je recrute", recText: "Publiez vos offres et rencontrez vos futurs collaborateurs.", recCta: "Publier une offre",
  },
  mosaic: { construction: "Construction", health: "Santé", transport: "Transport", industry: "Industrie", logistics: "Logistique", office: "Bureau" },
  search: {
    title: "Trouvez votre prochain emploi", kw: "Métier, compétence ou mot-clé", place: "Ville ou code postal",
    button: "Rechercher", example: "Par exemple :",
    suggestions: ["Cariste", "Opérateur de production", "Assistant administratif", "Chauffeur CE", "Électromécanicien"],
  },
  recent: { label: "Offres récentes", title: ["Les postes", "du moment."], all: "Toutes les offres", seeAll: "Voir toutes les offres d'emploi", urgent: "Urgent", org: "Organisation" },
  contracts: { interim: "Intérim", cdi: "CDI", cdd: "CDD", apprentissage: "Apprentissage" } as Record<string, string>,
  how: {
    label: "Comment ça marche", title: "Simple, en trois étapes.", aria: "Comment ça marche",
    candTab: "Pour les candidats", entTab: "Pour les entreprises",
    candCta: "Créer mon profil", entCta: "Publier une offre",
    cand: [
      { title: "Créez votre profil", body: "Indiquez votre métier, vos permis et vos disponibilités, ajoutez votre CV." },
      { title: "Découvrez les offres adaptées", body: "Parcourez les offres près de chez vous, par métier ou par secteur." },
      { title: "Postulez et échangez", body: "Candidatez en quelques clics et échangez avec les recruteurs." },
    ],
    ent: [
      { title: "Publiez votre offre", body: "Décrivez le poste, le contrat et les permis requis dans un formulaire simple." },
      { title: "Recevez des candidatures", body: "Retrouvez toutes les candidatures au même endroit, dans votre tableau de bord." },
      { title: "Contactez vos futurs collaborateurs", body: "Reprenez contact avec les profils qui vous correspondent." },
    ],
  },
  why: {
    label: "Pourquoi nous", title: "Pourquoi nous choisir.",
    items: [
      { title: "Recrutement local", body: "Trouvez des opportunités et des talents près de chez vous." },
      { title: "Simple et rapide", body: "Une expérience pensée pour faciliter les recherches et les candidatures." },
      { title: "Tous les secteurs", body: "Industrie, logistique, commerce, administratif et bien plus." },
      { title: "Une plateforme humaine", body: "Un outil conçu avec une véritable connaissance du recrutement." },
    ],
  },
  sectors: {
    label: "Secteurs", title: ["Chaque métier,", "une offre."],
    construction: "Construction", logistics: "Logistique", transport: "Transport", industry: "Industrie",
    medical: "Médical", security: "Sécurité", cleaning: "Nettoyage", horeca: "Horeca", tech: "Tech & IT",
  },
  recruiters: {
    label: "PME & agences d'intérim", title1: "Vos prochains talents sont ", title2: "peut-être déjà ici.",
    points: [
      { t: "Publiez vos offres facilement", b: "Un formulaire simple, adapté à chaque métier." },
      { t: "Centralisez vos candidatures", b: "Retrouvez tous vos candidats au même endroit." },
      { t: "Simplifiez votre recrutement", b: "Moins d'allers-retours, plus de temps pour les bons profils." },
    ],
    cta: "Découvrir les solutions recruteurs",
  },
  final: { title: "Prêt à vous lancer ?", text: "Candidat ou recruteur, créez votre compte en quelques minutes.", cand: "Je cherche un emploi", rec: "Je recrute" },
  signup: {
    title: "Créer un compte", ask: "Vous êtes plutôt…",
    candTitle: "Je cherche un emploi", candText: "Créez votre profil et postulez facilement.", candCta: "Créer mon profil",
    recTitle: "Je recrute", recText: "Publiez vos offres et rencontrez vos futurs collaborateurs.", recCta: "Créer mon espace",
    already: "Déjà inscrit ?", login: "Connexion",
  },
};

export type Dict = typeof fr;

const nl: Dict = {
  tagline: "Het juiste talent. Het juiste bedrijf.",
  nav: {
    jobs: "Vind een job", recruit: "Werven", pricing: "Onze tarieven", how: "Hoe het werkt",
    login: "Inloggen", signup: "Account aanmaken", open: "Menu openen", close: "Menu sluiten",
    home: "Home", main: "Hoofdnavigatie", mobile: "Mobiel menu", lang: "Taal",
  },
  footer: {
    candidates: "Kandidaten", recruiters: "Werkgevers", info: "Informatie",
    findJob: "Vind een job", createProfile: "Mijn profiel maken", login: "Inloggen",
    recruiterSpace: "Werkgeversruimte", pricing: "Tarieven", createAccount: "Account aanmaken",
    contact: "Contact", cgu: "Algemene voorwaarden", privacy: "Privacybeleid",
    rights: "Alle rechten voorbehouden",
  },
  hero: {
    h1a: "Het juiste talent.", h1b: "Het juiste ", h1c: "bedrijf.",
    sub: "Het Belgische platform dat kandidaten, bedrijven en uitzendkantoren samenbrengt. Vind een job of werf eenvoudiger aan, dicht bij huis.",
    candTitle: "Ik zoek een job", candText: "Ontdek de kansen in je buurt en solliciteer eenvoudig.", candCta: "Vind een job",
    recTitle: "Ik werf aan", recText: "Plaats je vacatures en ontmoet je toekomstige collega's.", recCta: "Plaats een vacature",
  },
  mosaic: { construction: "Bouw", health: "Zorg", transport: "Transport", industry: "Industrie", logistics: "Logistiek", office: "Kantoor" },
  search: {
    title: "Vind je volgende job", kw: "Beroep, vaardigheid of trefwoord", place: "Stad of postcode",
    button: "Zoeken", example: "Bijvoorbeeld:",
    suggestions: ["Heftruckchauffeur", "Productieoperator", "Administratief medewerker", "Chauffeur CE", "Elektromecanicien"],
  },
  recent: { label: "Recente vacatures", title: ["De vacatures", "van het moment."], all: "Alle vacatures", seeAll: "Bekijk alle vacatures", urgent: "Dringend", org: "Organisatie" },
  contracts: { interim: "Interim", cdi: "Onbepaalde duur", cdd: "Bepaalde duur", apprentissage: "Leercontract" },
  how: {
    label: "Hoe het werkt", title: "Eenvoudig, in drie stappen.", aria: "Hoe het werkt",
    candTab: "Voor kandidaten", entTab: "Voor bedrijven",
    candCta: "Mijn profiel maken", entCta: "Een vacature plaatsen",
    cand: [
      { title: "Maak je profiel aan", body: "Geef je beroep, rijbewijzen en beschikbaarheid op en voeg je cv toe." },
      { title: "Ontdek passende vacatures", body: "Blader door vacatures in je buurt, per beroep of per sector." },
      { title: "Solliciteer en praat met werkgevers", body: "Solliciteer in enkele klikken en neem contact op met werkgevers." },
    ],
    ent: [
      { title: "Plaats je vacature", body: "Beschrijf de functie, het contract en de vereiste rijbewijzen in een eenvoudig formulier." },
      { title: "Ontvang sollicitaties", body: "Vind alle sollicitaties op één plek in je dashboard." },
      { title: "Contacteer je toekomstige collega's", body: "Neem contact op met de profielen die bij je passen." },
    ],
  },
  why: {
    label: "Waarom wij", title: "Waarom kiezen voor ons.",
    items: [
      { title: "Lokaal werven", body: "Vind kansen en talent in je buurt." },
      { title: "Eenvoudig en snel", body: "Een ervaring die zoeken en solliciteren makkelijker maakt." },
      { title: "Alle sectoren", body: "Industrie, logistiek, handel, administratie en nog veel meer." },
      { title: "Een menselijk platform", body: "Een tool ontworpen met echte kennis van werving." },
    ],
  },
  sectors: {
    label: "Sectoren", title: ["Elk beroep,", "een vacature."],
    construction: "Bouw", logistics: "Logistiek", transport: "Transport", industry: "Industrie",
    medical: "Medisch", security: "Beveiliging", cleaning: "Schoonmaak", horeca: "Horeca", tech: "Tech & IT",
  },
  recruiters: {
    label: "KMO's & uitzendkantoren", title1: "Je volgende talenten zijn ", title2: "misschien al hier.",
    points: [
      { t: "Plaats eenvoudig je vacatures", b: "Een eenvoudig formulier, aangepast aan elk beroep." },
      { t: "Centraliseer je sollicitaties", b: "Vind al je kandidaten op één plek." },
      { t: "Vereenvoudig je werving", b: "Minder heen-en-weer, meer tijd voor de juiste profielen." },
    ],
    cta: "Ontdek de oplossingen voor werkgevers",
  },
  final: { title: "Klaar om te starten?", text: "Kandidaat of werkgever, maak je account aan in enkele minuten.", cand: "Ik zoek een job", rec: "Ik werf aan" },
  signup: {
    title: "Account aanmaken", ask: "Je bent eerder…",
    candTitle: "Ik zoek een job", candText: "Maak je profiel aan en solliciteer eenvoudig.", candCta: "Mijn profiel maken",
    recTitle: "Ik werf aan", recText: "Plaats je vacatures en ontmoet je toekomstige collega's.", recCta: "Mijn omgeving maken",
    already: "Al een account?", login: "Inloggen",
  },
};

export type Lang = "fr" | "nl";
export const LANGS: Lang[] = ["fr", "nl"];
export const DICTS: Record<Lang, Dict> = { fr, nl };
