// Familles de métiers : « cariste » = « conducteur de chariot élévateur » = « heftruckchauffeur ».
// Table écrite à la main pour les métiers de Wolko (FR + NL), sans IA, sans coût, sans appel externe.
// Sert à comparer le titre d'une offre au texte d'un CV : même famille = même métier, même groupe = métier voisin.
//
// Écriture des termes : minuscules, SANS accents, apostrophes et tirets = espace.
// - un terme est cherché en DÉBUT de mot (« soudeu » trouve soudeur, soudeuse, soudeurs) ;
// - un terme finissant par « ! » doit être un mot entier (« cnc! » ne trouve pas « cncx »).
// « a & b » : les deux doivent être présents, dans n'importe quel ordre (« nettoyeur / nettoyeuse industriel(le) »).
// `not` : si l'un de ces termes est aussi présent dans le texte, la famille est écartée
// (ex. « nettoyeur industriel » ne doit pas compter comme simple « agent d'entretien »).

export type Family = { id: string; group: string; label: string; terms: string[]; not?: string[]; trades?: string[] };

export const FAMILIES: Family[] = [
  // ── Logistique
  { id: "cariste", group: "logistique", label: "cariste", trades: ["cariste"],
    terms: ["cariste", "chariot elevateur", "chariot frontal", "chariot a mat", "chariots elevateurs", "reach truck", "reachtruck", "heftruck", "conducteur de chariot", "conductrice de chariot", "caces r489", "caces r 489", "caces 1!", "caces 3!", "caces 5!", "transpalette electrique", "gerbeur"] },
  { id: "preparateur_commandes", group: "logistique", label: "préparateur de commandes", trades: ["preparateur_commandes"],
    terms: ["preparateur de commande", "preparatrice de commande", "preparation de commande", "preparateur logistique", "picking", "picker!", "pickeur", "orderpicker", "order picker", "order picking"] },
  { id: "magasinier", group: "logistique", label: "magasinier", trades: ["magasinier"],
    terms: ["magasinier", "magasiniere", "magazijnier", "magazijnmedewerker", "operateur logistique", "operatrice logistique", "agent logistique", "employe logistique", "employee logistique", "logistiek medewerker", "medewerker logistiek"] },
  { id: "emballeur", group: "logistique", label: "emballeur / manutentionnaire", trades: ["emballeur"],
    terms: ["emballeur", "emballeuse", "emballage", "manutentionnaire", "manutention", "conditionnement", "conditionneur", "inpakker", "inpakster", "inpakwerk"] },
  { id: "gestionnaire_stock", group: "logistique", label: "gestionnaire de stock", trades: ["gestionnaire_stock"],
    terms: ["gestionnaire de stock", "gestion de stock", "gestion des stocks", "receptionnaire", "reception de marchandises", "voorraadbeheer", "stockbeheer"] },

  // ── Transport
  { id: "chauffeur_ce", group: "transport", label: "chauffeur poids lourd", trades: ["chauffeur_ce"],
    terms: ["poids lourd", "chauffeur routier", "conducteur routier", "chauffeur super lourd", "vrachtwagenchauffeur", "chauffeur vrachtwagen", "chauffeur ce!", "chauffeur c!", "permis ce!", "transport international"] },
  { id: "chauffeur_livreur", group: "transport", label: "chauffeur-livreur", trades: ["chauffeur_livreur"],
    terms: ["livreur", "livreuse", "chauffeur livreur", "chauffeur de livraison", "tournee de livraison", "koerier", "bestelwagenchauffeur", "leveringschauffeur"] },
  { id: "chauffeur_bus", group: "transport", label: "chauffeur de bus", trades: ["chauffeur_bus"],
    terms: ["chauffeur de bus", "chauffeur de car", "conducteur de bus", "conducteur d autocar", "autocariste", "buschauffeur", "autocarchauffeur"] },

  // ── Construction : gros œuvre
  { id: "macon", group: "gros_oeuvre", label: "maçon", trades: ["macon"], terms: ["macon", "maconnerie", "metselaar", "briqueteur", "bricklayer"] },
  { id: "ferrailleur_coffreur", group: "gros_oeuvre", label: "ferrailleur / coffreur", trades: ["ferrailleur_coffreur"], terms: ["ferrailleur", "coffreur", "ijzervlechter", "bekister", "ferraillage", "coffrage"] },
  { id: "couvreur", group: "gros_oeuvre", label: "couvreur", trades: ["couvreur"], terms: ["couvreur", "couverture toiture", "zingueur", "zinguerie", "dakdekker", "dakwerker"] },
  { id: "conducteur_engins", group: "gros_oeuvre", label: "conducteur d'engins", trades: ["conducteur_engins"],
    terms: ["conducteur d engins", "conductrice d engins", "engins de chantier", "pelleteuse", "tractopelle", "grutier", "grue a tour", "caces r482", "caces r 482", "machinist", "kraanman", "graafmachine", "bulldozer", "chargeuse"] },
  { id: "echafaudeur", group: "gros_oeuvre", label: "monteur d'échafaudages", trades: ["echafaudeur"], terms: ["echafaud", "steigerbouwer", "steigerbouw"] },
  { id: "voirie", group: "gros_oeuvre", label: "ouvrier de voirie", trades: ["ouvrier_voirie"], terms: ["paveur", "terrassier", "terrassement", "voirie", "straatmaker", "wegenwerker", "wegenbouw", "grondwerker", "asphalt"] },
  { id: "chef_chantier", group: "gros_oeuvre", label: "chef d'équipe / de chantier", trades: ["chef_chantier"], terms: ["chef de chantier", "chef d equipe", "cheffe d equipe", "conducteur de travaux", "contremaitre", "ploegbaas", "werfleider", "uitvoerder"] },
  { id: "manoeuvre", group: "gros_oeuvre", label: "manœuvre / ouvrier polyvalent", trades: ["manoeuvre"], terms: ["manoeuvre", "ouvrier polyvalent", "ouvriere polyvalente", "ouvrier du batiment", "ouvrier de chantier", "handlanger", "polyvalent bouw"] },

  // ── Construction : bois
  { id: "charpentier", group: "bois", label: "charpentier", trades: ["charpentier"], terms: ["charpentier", "charpente", "timmerman", "ossature bois", "timmerwerk"] },
  { id: "menuisier", group: "bois", label: "menuisier", trades: ["menuisier"], terms: ["menuisier", "menuiserie", "ebeniste", "schrijnwerker", "schrijnwerk", "poseur de cuisines", "carpenter"] },

  // ── Construction : finitions
  { id: "peintre", group: "finition", label: "peintre en bâtiment", trades: ["peintre"], not: ["auto!", "automobile", "carrosserie", "carrossier", "voiture", "autospuit"], terms: ["peintre", "peinture en batiment", "schilder", "schilderwerk", "decorateur", "tapissier"] },
  { id: "carreleur", group: "finition", label: "carreleur", trades: ["carreleur"], terms: ["carreleur", "carrelage", "tegelzetter", "tegelwerk"] },
  { id: "plafonneur", group: "finition", label: "plafonneur", trades: ["plafonneur"], terms: ["plafonneur", "platrier", "placo", "cloisons seches", "gyproc", "stukadoor", "stucwerk", "enduiseur"] },
  { id: "poseur_chassis", group: "finition", label: "poseur de châssis / vitrier", trades: ["poseur_chassis"], terms: ["poseur de chassis", "pose de chassis", "chassis pvc", "vitrier", "vitrerie", "glazenmaker", "ramen plaatsen"] },

  // ── Construction : techniques du bâtiment
  { id: "electricien", group: "technique_bat", label: "électricien", trades: ["electricien_batiment", "electricien_industriel"],
    terms: ["electricien", "electricienne", "electricite batiment", "installation electrique", "tableau electrique", "elektricien", "elektriciteit", "cablage"] },
  { id: "plombier", group: "technique_bat", label: "plombier / chauffagiste", trades: ["plombier_chauffagiste"],
    terms: ["plombier", "plomberie", "chauffagiste", "installateur sanitaire", "sanitair", "loodgieter", "verwarmingsinstallateur", "centrale verwarming"] },
  { id: "frigoriste", group: "technique_bat", label: "frigoriste / HVAC", trades: ["frigoriste"], terms: ["frigoriste", "hvac!", "climatisation", "airco", "koeltechnicus", "koeltechniek", "technicien froid"] },
  { id: "installateur_energie", group: "technique_bat", label: "installateur photovoltaïque / pompe à chaleur", trades: ["installateur_energie"], terms: ["photovoltaique", "panneaux solaires", "installateur solaire", "pompe a chaleur", "zonnepanelen", "warmtepomp"] },

  // ── Industrie : production
  { id: "operateur_production", group: "industrie_prod", label: "opérateur de production", trades: ["operateur_production"],
    terms: ["operateur de production", "operatrice de production", "operateur production", "ouvrier de production", "ouvriere de production", "agent de production", "operateur sur ligne", "operateur sur machine", "ouvrier d usine", "ouvriere d usine", "productieoperator", "productiemedewerker", "productie medewerker", "machine operator", "machineoperator", "conducteur de machine", "operator!"] },
  { id: "conducteur_ligne", group: "industrie_prod", label: "conducteur de ligne / régleur", trades: ["conducteur_ligne"], terms: ["conducteur de ligne", "conductrice de ligne", "regleur", "reglage de machine", "conducteur d installation", "lijnbestuurder", "insteller", "lijnoperator"] },
  { id: "technicien_qualite", group: "industrie_prod", label: "contrôleur qualité", trades: ["technicien_qualite"], terms: ["controleur qualite", "controle qualite", "technicien qualite", "qualiticien", "kwaliteitscontroleur", "kwaliteitsmedewerker"] },

  // ── Industrie : métal
  { id: "soudeur", group: "metal", label: "soudeur", trades: ["soudeur"], terms: ["soudeu", "soudure", "soudage", "lasser", "lassen", "laswerk", "welder", "welding"] },
  { id: "tuyauteur_chaudronnier", group: "metal", label: "tuyauteur / chaudronnier", trades: ["tuyauteur_chaudronnier"], terms: ["tuyauteur", "tuyauterie", "chaudronnier", "chaudronnerie", "tolier", "tolerie", "serrurier", "constructeur metallique", "pijpfitter", "plaatwerker", "plaatbewerker", "metaalbewerker", "metaalconstructeur"] },
  { id: "tourneur_fraiseur", group: "metal", label: "tourneur / fraiseur / CNC", trades: ["tourneur_fraiseur"], terms: ["tourneur", "fraiseur", "cnc!", "usinage", "usineur", "draaier", "frezer", "cnc operator", "cnc bediener"] },

  // ── Industrie : maintenance
  { id: "technicien_maintenance", group: "maintenance", label: "technicien de maintenance", trades: ["technicien_maintenance"], terms: ["technicien de maintenance", "technicienne de maintenance", "agent de maintenance", "maintenance industrielle", "technicien de depannage", "onderhoudstechnicus", "onderhoudsmecanicien", "onderhoudsmedewerker"] },
  { id: "electromecanicien", group: "maintenance", label: "électromécanicien", trades: ["electromecanicien"], terms: ["electromecanicien", "electromecanique", "automaticien", "automatisme", "elektromecanicien", "elektromechanisch"] },
  { id: "mecanicien", group: "maintenance", label: "mécanicien", trades: ["mecanicien"], not: ["auto!", "automobile", "poids lourd", "moto!", "garage", "vrachtwagen", "voiture"], terms: ["mecanicien"] },

  // ── Automobile
  { id: "mecanicien_auto", group: "auto", label: "mécanicien auto / poids lourds", trades: ["mecanicien_auto"], terms: ["mecanicien auto", "mecanicien automobile", "mecanicien poids lourd", "mecanicien moto", "technicien automobile", "technicien auto", "garagiste", "reparation automobile", "automonteur", "vrachtwagenmecanicien", "autotechnicus", "pneus"] },
  { id: "carrossier", group: "auto", label: "carrossier / peintre auto", trades: ["carrossier"], terms: ["carrossier", "carrosserie", "peintre auto", "peintre automobile", "autospuiter", "carrosseriehersteller", "carrosseriebouwer"] },

  // ── Santé et social
  { id: "aide_soignant", group: "soin", label: "aide-soignant", trades: ["aide_soignant"], terms: ["aide soignant", "aide soignante", "zorgkundige", "soins de base", "maison de repos", "mrs!", "woonzorgcentrum", "rusthuis"] },
  { id: "infirmier", group: "soin", label: "infirmier", trades: ["infirmier"], terms: ["infirmier", "infirmiere", "verpleegkundige", "verpleger", "verpleegster"] },
  { id: "aide_familial", group: "soin", label: "aide familial", trades: ["aide_menager"], terms: ["aide familial", "aide familiale", "garde a domicile", "garde malade", "aide a domicile", "gezinshulp", "gezinszorg", "thuisoppas", "oppas!", "thuiszorg"] },
  { id: "assistant_pharma", group: "soin", label: "assistant pharmaceutique", trades: ["assistant_pharma"], terms: ["assistant pharmaceutique", "assistante pharmaceutique", "pharmacie", "apotheek", "farmaceutisch"] },
  { id: "brancardier", group: "soin", label: "brancardier / aide logistique hospitalier", trades: ["aide_logistique_hopital"], terms: ["brancardier", "brancardiere", "aide logistique hospital", "logistique hospitaliere", "logistiek medewerker ziekenhuis", "zaalhulp"] },
  { id: "educateur", group: "social", label: "éducateur", trades: ["educateur"], terms: ["educateur", "educatrice", "opvoeder", "opvoedster", "begeleider", "accompagnant educatif"] },
  { id: "puericulteur", group: "social", label: "puériculteur / accueillant d'enfants", trades: ["puericulteur"], terms: ["puericulteur", "puericultrice", "accueillant d enfants", "accueillante d enfants", "accueillante", "creche", "kinderverzorger", "onthaalouder", "kinderbegeleider", "kinderopvang"] },

  // ── Sécurité
  { id: "gardiennage", group: "securite", label: "agent de gardiennage", trades: ["agent_gardiennage"], terms: ["gardiennage", "gardien de", "agent de securite", "agent de surveillance", "securite privee", "vigile", "bewakingsagent", "bewaker", "bewaking"] },
  { id: "steward", group: "securite", label: "steward / agent de prévention", trades: ["steward"], terms: ["steward", "agent de prevention", "hotesse de securite", "controle d acces", "portier", "preventiemedewerker", "toegangscontrole"] },

  // ── Nettoyage
  { id: "nettoyeur_industriel", group: "nettoyage", label: "nettoyeur industriel", trades: ["nettoyeur_industriel"], terms: ["nettoyeu & industri", "nettoyage & industri", "agent de proprete & industri", "schoonmak & industri"] },
  { id: "agent_entretien", group: "nettoyage", label: "agent d'entretien", trades: ["agent_entretien"], not: ["industriel", "industrie!", "industrieel", "industriele"],
    terms: ["agent d entretien", "agent entretien", "agente d entretien", "agent de nettoyage", "agent de proprete", "technicien de surface", "technicienne de surface", "nettoyeur", "nettoyeuse", "nettoyage", "homme d entretien", "femme d entretien", "femme de menage", "schoonmaker", "schoonmaakster", "schoonmaak", "poetsvrouw"] },
  { id: "aide_menagere", group: "nettoyage", label: "aide-ménager (titres-services)", trades: ["aide_menagere_ts"], terms: ["aide menager", "aide menagere", "titres services", "dienstencheque", "huishoudhulp", "poetshulp", "repassage", "repasseuse", "strijk"] },
  { id: "laveur_vitres", group: "nettoyage", label: "laveur de vitres", trades: ["laveur_vitres"], terms: ["laveur de vitre", "laveuse de vitre", "lavage de vitre", "nettoyage de vitre", "glazenwasser", "ramenwasser"] },

  // ── Commerce
  { id: "vendeur", group: "commerce", label: "vendeur / caissier", trades: ["vendeur"], terms: ["vendeu", "vente en magasin", "vente au detail", "conseiller de vente", "conseillere de vente", "assistant de vente", "caissier", "caissiere", "hotesse de caisse", "verkoper", "verkoopster", "kassier", "kassamedewerker", "winkelmedewerker", "retail"] },
  { id: "employe_rayon", group: "commerce", label: "employé de rayon", trades: ["employe_rayon"], terms: ["employe de rayon", "employee de rayon", "mise en rayon", "reassort", "chef de rayon", "libre service", "rekkenvuller", "rayonmedewerker"] },
  { id: "commercial", group: "commerce_b2b", label: "commercial / représentant", trades: ["commercial"], terms: ["representant", "commercial", "delegue commercial", "technico commercial", "attache commercial", "vertegenwoordiger", "account manager", "buitendienst", "business developer", "prospection"] },
  { id: "boulanger_boucher", group: "alimentaire", label: "boulanger / boucher", trades: ["boulanger_boucher"], terms: ["boulanger", "boulangerie", "patissier", "patisserie", "boucher", "boucherie", "charcutier", "bakker", "slager", "banketbakker", "beenhouwer"] },

  // ── Horeca
  { id: "serveur", group: "horeca_salle", label: "serveur / barman", trades: ["serveur"], terms: ["serveur", "serveuse", "barman", "barmaid", "bartender", "chef de rang", "service en salle", "kelner", "bediening", "horeca bediende"] },
  { id: "cuisinier", group: "horeca_cuisine", label: "cuisinier", trades: ["cuisinier"], terms: ["cuisinier", "cuisiniere", "commis de cuisine", "chef de partie", "second de cuisine", "cuisine collective", "pizzaiolo", "kok!", "keukenmedewerker", "keukenchef"] },
  { id: "plongeur", group: "horeca_cuisine", label: "plongeur / aide de cuisine", trades: ["plongeur"], terms: ["plongeur", "plongeuse", "aide de cuisine", "aide cuisinier", "afwasser", "afwas", "keukenhulp"] },

  // ── Bureau
  { id: "employe_administratif", group: "bureau", label: "employé administratif", trades: ["employe_administratif"], terms: ["employe administratif", "employee administrative", "assistant administratif", "assistante administrative", "gestionnaire administratif", "encodage", "encodeur", "back office", "backoffice", "administratief bediende", "administratief medewerker", "administratieve"] },
  { id: "comptable", group: "bureau", label: "comptable", trades: ["comptable"], terms: ["comptable", "comptabilite", "aide comptable", "assistant comptable", "boekhouder", "boekhouding", "gestionnaire de paie", "secretariat social", "payroll"] },
  { id: "receptionniste", group: "bureau", label: "réceptionniste / accueil", trades: ["receptionniste"], terms: ["receptionniste", "receptionist", "hote d accueil", "hotesse d accueil", "agent d accueil", "agente d accueil", "standardiste", "standard telephonique", "onthaalmedewerker", "onthaal!"] },
  { id: "secretaire", group: "bureau", label: "secrétaire / assistant de direction", trades: ["secretaire"], terms: ["secretaire", "secretariat", "assistant de direction", "assistante de direction", "office manager", "secretaresse", "directieassistent", "directiesecretaresse"] },
  { id: "informaticien", group: "bureau_it", label: "informaticien / helpdesk", trades: ["informaticien"], terms: ["informaticien", "informaticienne", "developpeur", "developpeuse", "helpdesk", "help desk", "support informatique", "technicien informatique", "administrateur systeme", "ict!", "informaticus", "software engineer"] },
  { id: "centre_appel", group: "relation_client", label: "centre d'appels / service client", terms: ["call center", "callcenter", "centre d appel", "teleconseiller", "teleconseillere", "telephoniste", "teleoperateur", "teleoperatrice", "service client", "customer service", "klantendienst", "contact center", "telemarketing"] },

  // ── Espaces verts / agriculture
  { id: "jardinier", group: "vert", label: "jardinier / paysagiste", trades: ["jardinier"], terms: ["jardinier", "jardinage", "paysagiste", "espaces verts", "elagueur", "tuinman", "hovenier", "tuinaanleg", "tuinonderhoud"] },
  { id: "ouvrier_agricole", group: "vert", label: "ouvrier agricole / horticole", trades: ["ouvrier_agricole"], terms: ["ouvrier agricole", "ouvriere agricole", "ouvrier horticole", "agriculteur", "horticole", "maraicher", "landbouwer", "landbouwarbeider", "tuinbouw"] },
];

const FAMILY_BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

/** minuscules, sans accents, ponctuation → espaces (même logique que le reste du matching). */
export const normText = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function termRe(term: string): RegExp {
  const exact = term.endsWith("!");
  const t = normText(exact ? term.slice(0, -1) : term);
  return new RegExp(`(?:^| )${esc(t)}${exact ? "(?: |$)" : ""}`);
}

type Compiled = { f: Family; terms: { term: string; re: RegExp[] }[]; not: RegExp[] };
const COMPILED: Compiled[] = FAMILIES.map((f) => ({
  f,
  terms: f.terms.map((t) => ({ term: t.replace(/!$/, ""), re: t.split("&").map((x) => termRe(x.trim())) })), // « a & b » : les deux mots, dans n'importe quel ordre
  not: (f.not ?? []).map(termRe),
}));

export type FamilyHit = { id: string; group: string; label: string; term: string };

/** Familles de métiers reconnues dans un texte (titre d'offre, poste d'un CV, extrait de CV). */
export function familyHits(text: string): FamilyHit[] {
  const t = normText(text);
  if (!t) return [];
  const out: FamilyHit[] = [];
  for (const c of COMPILED) {
    if (c.not.some((re) => re.test(t))) continue;
    const hit = c.terms.find((x) => x.re.every((re) => re.test(t)));
    if (hit) out.push({ id: c.f.id, group: c.f.group, label: c.f.label, term: hit.term });
  }
  return out;
}
export const familiesIn = (text: string): string[] => familyHits(text).map((h) => h.id);

/** Relation entre les métiers de l'offre et ceux repérés dans un texte : même métier, métier voisin (même groupe) ou aucun lien. */
export function relationBetween(offerFams: string[], textFams: string[]): "same" | "domain" | "none" {
  if (!offerFams.length || !textFams.length) return "none";
  if (textFams.some((f) => offerFams.includes(f))) return "same";
  const groups = new Set(offerFams.map((f) => FAMILY_BY_ID.get(f)?.group).filter(Boolean));
  return textFams.some((f) => groups.has(FAMILY_BY_ID.get(f)?.group)) ? "domain" : "none";
}

/** Familles liées aux métiers cochés par le candidat (clés de candidates.trades). */
export function familiesForTrades(keys: string[]): string[] {
  const out = new Set<string>();
  for (const f of FAMILIES) if (f.trades?.some((k) => keys.includes(k))) out.add(f.id);
  return [...out];
}

/** Libellé d'une famille (pour l'affichage au recruteur). */
export const familyLabel = (id: string): string => FAMILY_BY_ID.get(id)?.label ?? id;
export const familyGroup = (id: string): string | null => FAMILY_BY_ID.get(id)?.group ?? null;
