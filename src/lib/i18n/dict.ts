/** Textes des pages publiques en français et en néerlandais. Même structure obligatoire (typée). */
const fr = {
  tagline: "Le bon talent. La bonne entreprise.",
  nav: {
    jobs: "Trouver un emploi", recruit: "Recruter", pricing: "Nos tarifs", how: "Comment ça marche", about: "Qui sommes-nous",
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
    h1a: "Trouve un job près de chez toi.", h1b: "Postule en 1 minute, ", h1c: "sans compte.",
    sub: "Wolko est une plateforme d'offres d'emploi, pas une agence d'intérim : tu postules directement chez l'employeur.",
    candTitle: "Je cherche un emploi", candText: "Découvrez les opportunités près de chez vous et postulez facilement.", candCta: "Trouver un emploi",
    recTitle: "Je recrute", recText: "Publiez vos offres et rencontrez vos futurs collaborateurs.", recCta: "Je recrute",
    signature: "Gratuit · Sans compte · Réponse directe de l'employeur",
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
    medical: "Médical", security: "Sécurité", cleaning: "Nettoyage", commerce: "Commerce", horeca: "Horeca", office: "Administratif", tech: "Tech & IT",
  },
  recruiters: {
    label: "Entreprises & agences de recrutement", title1: "Vos prochains talents sont ", title2: "peut-être déjà ici.",
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
    candTitle: "Candidat", candText: "Je recherche un emploi.", candCta: "Créer mon profil",
    recTitle: "Je recrute", recText: "Publiez vos offres et rencontrez vos futurs collaborateurs.", recCta: "Créer mon espace",
    entTitle: "Entreprise / PME", entText: "Je recrute pour ma société.", entCta: "Créer mon espace entreprise",
    agTitle: "Agence", agText: "Je recrute pour plusieurs entreprises clientes.", agCta: "Créer mon espace agence",
    already: "Déjà inscrit ?", login: "Connexion",
  },
  about: {
    nav: "Qui sommes-nous",
    label: "Qui sommes-nous",
    title: ["Deux amis,", "une mission."],
    intro: "Wolko est né d'une amitié de 15 ans et d'une conviction : recruter et trouver un emploi doivent être plus simples et plus humains.",
    storyTitle: "Notre histoire",
    story: [
      "Nous nous connaissons depuis 15 ans. Depuis longtemps, nous parlons de la même chose : des entreprises qui ont du mal à trouver les bonnes personnes, et des travailleurs qui ne trouvent pas l'emploi qui leur correspond.",
      "Aujourd'hui, nous travaillons tous les deux dans l'intérim, chez Jobalto. Nous voyons ce problème de près, chaque jour, des deux côtés : celui des sociétés qui recrutent et celui des candidats qui cherchent.",
      "Nous avons donc créé Wolko : pour aider vraiment les sociétés à recruter, et les travailleurs à trouver l'emploi qu'il leur faut.",
    ],
    teamTitle: "Les fondateurs",
    role: "Co-CEO",
    expTitle: "Une expérience de terrain",
    exp: "Nous travaillons déjà dans l'intérim, chez Jobalto. Wolko est construit à partir de ce que nous vivons au quotidien avec les entreprises et les candidats.",
    ctaCand: "Trouver un emploi", ctaRec: "Je recrute",
  },
  recruiterChoice: {
    title: "Je recrute", ask: "Quel type de recruteur êtes-vous ?",
    entTitle: "Je recrute pour mon entreprise", entText: "Publiez vos offres, centralisez vos candidatures et gérez vos recrutements depuis un espace unique.", entCta: "Créer mon espace entreprise",
    agTitle: "Je recrute pour mes clients", agText: "Gérez vos candidats, vos entreprises clientes, vos missions et votre activité commerciale depuis un logiciel complet.", agCta: "Créer mon espace agence",
    learn: "En savoir plus sur l'espace recruteurs",
  },
};

export type Dict = typeof fr;

const nl: Dict = {
  tagline: "Het juiste talent. Het juiste bedrijf.",
  nav: {
    jobs: "Vind een job", recruit: "Werven", pricing: "Onze tarieven", how: "Hoe het werkt", about: "Wie zijn wij",
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
    h1a: "Vind een job dicht bij huis.", h1b: "Solliciteer in 1 minuut, ", h1c: "zonder account.",
    sub: "Wolko is een vacatureplatform, geen uitzendkantoor: je solliciteert rechtstreeks bij de werkgever.",
    candTitle: "Ik zoek een job", candText: "Ontdek de kansen in je buurt en solliciteer eenvoudig.", candCta: "Vind een job",
    recTitle: "Ik werf aan", recText: "Plaats je vacatures en ontmoet je toekomstige collega's.", recCta: "Ik werf aan",
    signature: "Gratis · Zonder account · Rechtstreeks antwoord van de werkgever",
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
    medical: "Medisch", security: "Beveiliging", cleaning: "Schoonmaak", commerce: "Handel", horeca: "Horeca", office: "Administratie", tech: "Tech & IT",
  },
  recruiters: {
    label: "Bedrijven & wervingskantoren", title1: "Je volgende talenten zijn ", title2: "misschien al hier.",
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
    candTitle: "Kandidaat", candText: "Ik zoek een job.", candCta: "Mijn profiel maken",
    recTitle: "Ik werf aan", recText: "Plaats je vacatures en ontmoet je toekomstige collega's.", recCta: "Mijn omgeving maken",
    entTitle: "Bedrijf / kmo", entText: "Ik werf aan voor mijn bedrijf.", entCta: "Mijn bedrijfsruimte maken",
    agTitle: "Kantoor", agText: "Ik werf aan voor meerdere klantbedrijven.", agCta: "Mijn kantoorruimte maken",
    already: "Al een account?", login: "Inloggen",
  },
  about: {
    nav: "Wie zijn wij",
    label: "Wie zijn wij",
    title: ["Twee vrienden,", "één missie."],
    intro: "Wolko is geboren uit een vriendschap van 15 jaar en een overtuiging: werven en een job vinden moeten eenvoudiger en menselijker.",
    storyTitle: "Ons verhaal",
    story: [
      "We kennen elkaar al 15 jaar. Al lang praten we over hetzelfde: bedrijven die moeite hebben om de juiste mensen te vinden, en werknemers die de job niet vinden die bij hen past.",
      "Vandaag werken we allebei in de interimsector, bij Jobalto. We zien dit probleem van dichtbij, elke dag, langs beide kanten: bedrijven die werven en kandidaten die zoeken.",
      "Daarom hebben we Wolko gemaakt: om bedrijven echt te helpen werven, en werknemers de job te laten vinden die ze nodig hebben.",
    ],
    teamTitle: "De oprichters",
    role: "Co-CEO",
    expTitle: "Ervaring uit het veld",
    exp: "We werken al in de interimsector, bij Jobalto. Wolko is gebouwd op wat we dagelijks meemaken met bedrijven en kandidaten.",
    ctaCand: "Vind een job", ctaRec: "Ik werf aan",
  },
  recruiterChoice: {
    title: "Ik werf aan", ask: "Wat voor werver ben je?",
    entTitle: "Ik werf aan voor mijn bedrijf", entText: "Plaats je vacatures, centraliseer je sollicitaties en beheer je aanwervingen vanuit één ruimte.", entCta: "Mijn bedrijfsruimte maken",
    agTitle: "Ik werf aan voor mijn klanten", agText: "Beheer je kandidaten, klantbedrijven, opdrachten en commerciële activiteit vanuit één volledige software.", agCta: "Mijn kantoorruimte maken",
    learn: "Meer over de werkgeversruimte",
  },
};

export type Lang = "fr" | "nl";
export const LANGS: Lang[] = ["fr", "nl"];
export const DICTS: Record<Lang, Dict> = { fr, nl };
