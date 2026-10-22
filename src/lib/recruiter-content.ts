// Textes FR/NL de la page recruteurs et de la page « déjà équipé d'un logiciel RH ».
// Règle : uniquement des fonctionnalités RÉELLEMENT disponibles. Aucune intégration avec un logiciel tiers, aucun chiffre d'audience,
// aucune promesse de candidatures ou d'embauches.
export type Bi = { fr: string; nl: string };
const b = (fr: string, nl: string): Bi => ({ fr, nl });

export const RC = {
  hero: {
    l1: b("Vos recrutements locaux.", "Je lokale aanwervingen."),
    l2: b("[Vos candidats.]", "[Je kandidaten.]"),
    l3: b("Un seul outil.", "Eén tool."),
    sub: b(
      "Publiez vos offres, découvrez des candidats de votre région et suivez vos recrutements simplement. Avec ou sans logiciel RH existant.",
      "Plaats je vacatures, ontdek kandidaten uit je regio en volg je aanwervingen eenvoudig op. Met of zonder bestaande HR-software."
    ),
    cta: b("Essayer gratuitement pendant 7 jours", "7 dagen gratis proberen"),
    ctaPrice: b("Découvrir les tarifs", "Ontdek de tarieven"),
  },
  benefits: {
    label: b("Ce que WOLKO vous apporte", "Wat WOLKO je biedt"),
    title: b("Un canal local, des outils simples.", "Een lokaal kanaal, eenvoudige tools."),
    items: [
      { t: b("Un canal supplémentaire", "Een extra kanaal"), d: b("Un canal de visibilité de plus pour vos offres, en complément de vos canaux habituels.", "Een extra kanaal voor je vacatures, naast je gebruikelijke kanalen.") },
      { t: b("Une approche locale", "Een lokale aanpak"), d: b("Un recrutement centré sur votre région : les candidats cherchent près de chez eux.", "Werving gericht op je regio: kandidaten zoeken dicht bij huis.") },
      { t: b("Une candidature simple", "Een eenvoudige sollicitatie"), d: b("Le candidat postule en quelques minutes, sans obligation de créer un compte.", "De kandidaat solliciteert in enkele minuten, zonder verplicht account.") },
      { t: b("Candidatures centralisées", "Gecentraliseerde sollicitaties"), d: b("Toutes les candidatures reçues sur WOLKO au même endroit, avec un suivi par étape.", "Alle sollicitaties via WOLKO op één plek, met opvolging per fase.") },
      { t: b("Une candidathèque qui grandit", "Een groeiende kandidatenbank"), d: b("Les candidats qui l'acceptent rejoignent la candidathèque, réservée aux abonnés. Elle se développe progressivement.", "Kandidaten die akkoord gaan, komen in de kandidatenbank, voorbehouden aan abonnees. Ze groeit geleidelijk.") },
      { t: b("Pensé pour les PME", "Gemaakt voor kmo's"), d: b("Des outils accessibles sans service RH dédié.", "Toegankelijke tools zonder eigen HR-dienst.") },
    ],
  },
  equipped: {
    label: b("Avec ou sans ATS", "Met of zonder ATS"),
    title: b("Vous utilisez déjà un logiciel de recrutement ?", "Gebruik je al recruitmentsoftware?"),
    text: [
      b("Vous utilisez déjà un ATS pour gérer vos candidatures ? Pas besoin de tout changer pour découvrir WOLKO.", "Gebruik je al een ATS om je sollicitaties te beheren? Je hoeft niet alles te veranderen om WOLKO te ontdekken."),
      b("Notre plateforme peut compléter vos outils existants en vous offrant un canal supplémentaire pour diffuser vos offres et toucher des candidats de votre région.", "Ons platform kan je bestaande tools aanvullen met een extra kanaal om je vacatures te verspreiden en kandidaten uit je regio te bereiken."),
      b("Vous conservez vos habitudes de recrutement tout en développant votre visibilité auprès de nouveaux profils.", "Je behoudt je wervingsgewoonten en vergroot tegelijk je zichtbaarheid bij nieuwe profielen."),
    ],
    advantages: [
      { t: b("Gardez vos outils", "Behoud je tools"), d: b("Vous pouvez continuer à utiliser votre logiciel de recrutement habituel.", "Je kunt je gebruikelijke recruitmentsoftware blijven gebruiken.") },
      { t: b("Touchez d'autres candidats", "Bereik andere kandidaten"), d: b("Publiez vos offres sur WOLKO pour développer votre visibilité locale.", "Publiceer je vacatures op WOLKO om je lokale zichtbaarheid te vergroten.") },
      { t: b("Testez sans engagement", "Test vrijblijvend"), d: b("Découvrez la plateforme gratuitement pendant 7 jours, sans carte bancaire.", "Ontdek het platform 7 dagen gratis, zonder bankkaart.") },
    ],
    note: b(
      "À ce jour, WOLKO ne se synchronise pas avec les logiciels RH tiers : les candidatures reçues sur WOLKO se gèrent dans WOLKO.",
      "Op dit moment synchroniseert WOLKO niet met HR-software van derden: sollicitaties via WOLKO beheer je in WOLKO."
    ),
    faqLink: b("En savoir plus dans notre FAQ", "Meer weten in onze FAQ"),
    more: b("Comment ça fonctionne en complément d'un ATS", "Hoe het werkt naast een ATS"),
  },
  space: {
    label: b("Votre espace professionnel", "Je professionele ruimte"),
    title: b("Ce que vous trouvez dans WOLKO", "Wat je vindt in WOLKO"),
    note: b(
      "Fonctionnalités disponibles aujourd'hui. Vous voulez les voir en action ? Demandez une démonstration : nous vous présentons l'espace sur des données de démonstration.",
      "Functies die vandaag beschikbaar zijn. Wil je ze in actie zien? Vraag een demo aan: we tonen je de ruimte met demogegevens."
    ),
    company: {
      title: b("Entreprises", "Bedrijven"),
      items: [
        b("Tableau de bord", "Dashboard"),
        b("Publication d'offres d'emploi", "Vacatures publiceren"),
        b("Candidatures organisées par étape", "Sollicitaties per fase georganiseerd"),
        b("Fiche candidat et CV", "Kandidaatfiche en cv"),
        b("Candidathèque (abonnés)", "Kandidatenbank (abonnees)"),
      ],
    },
    agency: {
      title: b("Agences de recrutement", "Wervingskantoren"),
      items: [
        b("Offres et candidatures", "Vacatures en sollicitaties"),
        b("Gestion des candidats (ATS)", "Kandidatenbeheer (ATS)"),
        b("Clients et suivi commercial (CRM)", "Klanten en commerciële opvolging (CRM)"),
        b("Suivi des missions de recrutement", "Opvolging van wervingsopdrachten"),
        b("Équipe et rôles", "Team en rollen"),
      ],
    },
    cta: b("Demander une démonstration", "Een demo aanvragen"),
  },
  trust: {
    label: b("Une plateforme en développement, déjà utilisable", "Een platform in ontwikkeling, vandaag al bruikbaar"),
    items: [
      { t: b("Plateforme belge", "Belgisch platform"), d: b("Conçue en Belgique, pour le marché belge.", "Ontworpen in België, voor de Belgische markt.") },
      { t: b("Fondateurs du métier", "Oprichters uit het vak"), d: b("Deux fondateurs qui travaillent au quotidien dans le recrutement.", "Twee oprichters die dagelijks in de rekrutering werken.") },
      { t: b("Approche locale", "Lokale aanpak"), d: b("Nous démarrons en Wallonie picarde et dans le Hainaut.", "We starten in Wallonie picarde en Henegouwen.") },
      { t: b("Gratuit pour les candidats", "Gratis voor kandidaten"), d: b("Les candidats postulent sans payer.", "Kandidaten solliciteren zonder te betalen.") },
      { t: b("Transparence", "Transparantie"), d: b("Tarifs et conditions affichés clairement.", "Tarieven en voorwaarden duidelijk getoond.") },
      { t: b("Accompagnement humain", "Menselijke begeleiding"), d: b("Une équipe joignable pour démarrer.", "Een bereikbaar team om te starten.") },
    ],
    note: b(
      "WOLKO ne garantit ni un nombre de candidatures ni une embauche : c'est un canal de plus, dans une plateforme que nous construisons avec nos premiers utilisateurs.",
      "WOLKO garandeert geen aantal sollicitaties of aanwervingen: het is een extra kanaal, op een platform dat we samen met onze eerste gebruikers bouwen."
    ),
  },
  finalCta: b("Testez WOLKO gratuitement pendant 7 jours", "Test WOLKO 7 dagen gratis"),
  trialLine: b(
    "7 jours gratuits, sans carte bancaire, sans frais de mise en service et sans engagement.",
    "7 dagen gratis, zonder bankkaart, zonder opstartkosten en zonder verbintenis."
  ),
} as const;

/** Page /recrute/deja-equipe */
export const DE = {
  meta: {
    title: b("Déjà équipé d'un ATS ? Un canal de recrutement local en plus — WOLKO", "Al een ATS? Een extra lokaal wervingskanaal — WOLKO"),
    description: b(
      "Vous avez déjà un logiciel de recrutement ? WOLKO est un canal supplémentaire pour publier vos offres et toucher des candidats de votre région. 7 jours d'essai gratuits.",
      "Heb je al recruitmentsoftware? WOLKO is een extra kanaal om je vacatures te publiceren en kandidaten uit je regio te bereiken. 7 dagen gratis proefperiode."
    ),
  },
  h1: b("Déjà équipé d'un logiciel de recrutement ? WOLKO peut aussi vous être utile.", "Al uitgerust met recruitmentsoftware? WOLKO kan ook nuttig zijn."),
  intro: b(
    "WOLKO n'a pas vocation à remplacer votre logiciel. C'est une plateforme d'emploi belge qui vous donne un canal supplémentaire pour publier vos offres et toucher des candidats de votre région.",
    "WOLKO is niet bedoeld om je software te vervangen. Het is een Belgisch jobplatform dat je een extra kanaal biedt om je vacatures te publiceren en kandidaten uit je regio te bereiken."
  ),
  complement: {
    title: b("Une complémentarité, pas un remplacement", "Een aanvulling, geen vervanging"),
    text: b(
      "Votre ATS organise vos recrutements en interne. WOLKO, lui, est un lieu où des candidats cherchent un emploi près de chez eux. Les deux répondent à des besoins différents : vous gardez votre outil habituel et vous ajoutez un canal.",
      "Je ATS organiseert je aanwervingen intern. WOLKO is een plek waar kandidaten een job zoeken dicht bij huis. Beide beantwoorden aan een andere behoefte: je behoudt je gewoonlijke tool en voegt een kanaal toe."
    ),
  },
  local: {
    title: b("Les bénéfices du recrutement local", "De voordelen van lokale werving"),
    items: [
      b("Des candidats qui cherchent près de chez eux, dans votre région.", "Kandidaten die dicht bij huis zoeken, in je regio."),
      b("Une candidature en quelques minutes, sans obligation de créer un compte.", "Een sollicitatie in enkele minuten, zonder verplicht account."),
      b("Une visibilité pour vos offres en complément de vos canaux actuels.", "Zichtbaarheid voor je vacatures naast je huidige kanalen."),
      b("Une candidathèque qui se développe progressivement, pour les abonnés.", "Een geleidelijk groeiende kandidatenbank, voor abonnees."),
    ],
  },
  how: {
    title: b("Comment ça fonctionne concrètement", "Hoe het concreet werkt"),
    steps: [
      { t: b("Vous publiez l'offre sur WOLKO", "Je publiceert de vacature op WOLKO"), d: b("Vous créez l'offre dans votre espace WOLKO, en quelques minutes. Vos offres dans votre ATS restent gérées dans votre ATS.", "Je maakt de vacature aan in je WOLKO-ruimte, in enkele minuten. Je vacatures in je ATS blijven in je ATS beheerd.") },
      { t: b("Les candidats postulent sur WOLKO", "Kandidaten solliciteren op WOLKO"), d: b("Les candidatures arrivent dans votre espace WOLKO.", "De sollicitaties komen binnen in je WOLKO-ruimte.") },
      { t: b("Vous les gérez dans WOLKO", "Je beheert ze in WOLKO"), d: b("Vous consultez les candidats, les CV et faites avancer les candidatures par étape.", "Je raadpleegt kandidaten en cv's en laat de sollicitaties per fase vorderen.") },
    ],
  },
  limits: {
    title: b("Ce qu'il faut savoir", "Goed om te weten"),
    items: [
      b("Il n'existe pas, à ce jour, de synchronisation automatique entre WOLKO et un logiciel RH tiers.", "Er bestaat vandaag geen automatische synchronisatie tussen WOLKO en HR-software van derden."),
      b("Les candidatures reçues sur WOLKO ne sont pas transmises automatiquement à un autre logiciel : elles se gèrent dans WOLKO.", "Sollicitaties via WOLKO worden niet automatisch naar andere software doorgestuurd: ze worden in WOLKO beheerd."),
      b("Si vous souhaitez les retrouver dans votre ATS, c'est à vous de les y reporter.", "Wil je ze ook in je ATS terugvinden, dan neem je ze zelf over."),
      b("WOLKO ne garantit pas un nombre de candidatures : l'essai gratuit sert justement à voir si ce canal vous convient.", "WOLKO garandeert geen aantal sollicitaties: de gratis proefperiode dient net om te zien of dit kanaal bij je past."),
    ],
  },
  trial: {
    title: b("Essayez avant de vous décider", "Probeer voor je beslist"),
    text: b(
      "L'essai de 7 jours est entièrement gratuit : sans carte bancaire, sans frais de mise en service et sans engagement. Aucun abonnement ne démarre automatiquement. Si vous décidez ensuite de souscrire, l'abonnement payant comporte des frais de mise en service uniques et un engagement initial de 12 mois, avec un préavis de 30 jours avant l'échéance annuelle.",
      "De proefperiode van 7 dagen is volledig gratis: zonder bankkaart, zonder opstartkosten en zonder verbintenis. Er start niet automatisch een abonnement. Beslis je nadien om te onderschrijven, dan omvat het betalende abonnement eenmalige opstartkosten en een initiële verbintenis van 12 maanden, met een opzegtermijn van 30 dagen vóór de jaarlijkse vervaldatum."
    ),
    primary: b("Essayer gratuitement pendant 7 jours", "7 dagen gratis proberen"),
    demo: b("Demander une démonstration", "Een demo aanvragen"),
    prices: b("Voir les tarifs", "Bekijk de tarieven"),
  },
} as const;
