/**
 * Métiers précis (candidathèque) : le candidat en choisit jusqu'à 3, l'employeur filtre dessus.
 * Clés stables (stockées en base, colonne candidates.trades) ; libellés FR/NL.
 */
export type Trade = { key: string; sector: string; fr: string; nl: string };

export const TRADES: Trade[] = [
  // Construction
  { key: "electricien_batiment", sector: "construction", fr: "Électricien bâtiment", nl: "Elektricien gebouwen" },
  { key: "electricien_industriel", sector: "construction", fr: "Électricien industriel", nl: "Industrieel elektricien" },
  { key: "macon", sector: "construction", fr: "Maçon", nl: "Metselaar" },
  { key: "menuisier", sector: "construction", fr: "Menuisier", nl: "Schrijnwerker" },
  { key: "charpentier", sector: "construction", fr: "Charpentier", nl: "Timmerman" },
  { key: "couvreur", sector: "construction", fr: "Couvreur", nl: "Dakdekker" },
  { key: "plombier_chauffagiste", sector: "construction", fr: "Plombier / chauffagiste", nl: "Loodgieter / verwarmingsinstallateur" },
  { key: "peintre", sector: "construction", fr: "Peintre en bâtiment", nl: "Schilder" },
  { key: "carreleur", sector: "construction", fr: "Carreleur", nl: "Tegelzetter" },
  { key: "plafonneur", sector: "construction", fr: "Plafonneur", nl: "Stukadoor" },
  { key: "conducteur_engins", sector: "construction", fr: "Conducteur d'engins / grutier", nl: "Machinist / kraanman" },
  { key: "ferrailleur_coffreur", sector: "construction", fr: "Ferrailleur / coffreur", nl: "IJzervlechter / bekister" },
  { key: "echafaudeur", sector: "construction", fr: "Monteur d'échafaudages", nl: "Steigerbouwer" },
  { key: "poseur_chassis", sector: "construction", fr: "Poseur de châssis / vitrier", nl: "Plaatser van ramen / glazenmaker" },
  { key: "installateur_energie", sector: "construction", fr: "Installateur photovoltaïque / pompe à chaleur", nl: "Installateur zonnepanelen / warmtepomp" },
  { key: "frigoriste", sector: "construction", fr: "Frigoriste / technicien HVAC", nl: "Koeltechnicus / HVAC-technicus" },
  { key: "ouvrier_voirie", sector: "construction", fr: "Ouvrier de voirie / paveur / terrassier", nl: "Wegenwerker / straatmaker / grondwerker" },
  { key: "chef_chantier", sector: "construction", fr: "Chef d'équipe / chef de chantier", nl: "Ploegbaas / werfleider" },
  { key: "manoeuvre", sector: "construction", fr: "Manœuvre / ouvrier polyvalent", nl: "Handlanger / polyvalent arbeider" },
  // Industrie
  { key: "operateur_production", sector: "industrie", fr: "Opérateur de production", nl: "Productieoperator" },
  { key: "soudeur", sector: "industrie", fr: "Soudeur", nl: "Lasser" },
  { key: "technicien_maintenance", sector: "industrie", fr: "Technicien de maintenance", nl: "Onderhoudstechnicus" },
  { key: "mecanicien", sector: "industrie", fr: "Mécanicien", nl: "Mecanicien" },
  { key: "tourneur_fraiseur", sector: "industrie", fr: "Tourneur / fraiseur / CNC", nl: "Draaier / frezer / CNC" },
  { key: "electromecanicien", sector: "industrie", fr: "Électromécanicien", nl: "Elektromecanicien" },
  { key: "tuyauteur_chaudronnier", sector: "industrie", fr: "Tuyauteur / chaudronnier", nl: "Pijpfitter / plaatwerker" },
  { key: "conducteur_ligne", sector: "industrie", fr: "Conducteur de ligne / régleur", nl: "Lijnbestuurder / insteller" },
  { key: "technicien_qualite", sector: "industrie", fr: "Contrôleur / technicien qualité", nl: "Kwaliteitscontroleur" },
  { key: "mecanicien_auto", sector: "industrie", fr: "Mécanicien auto / poids lourds", nl: "Automonteur / vrachtwagenmecanicien" },
  { key: "carrossier", sector: "industrie", fr: "Carrossier / peintre auto", nl: "Carrosseriehersteller / autospuiter" },
  // Logistique
  { key: "cariste", sector: "logistique", fr: "Cariste", nl: "Heftruckchauffeur" },
  { key: "preparateur_commandes", sector: "logistique", fr: "Préparateur de commandes", nl: "Orderpicker" },
  { key: "magasinier", sector: "logistique", fr: "Magasinier", nl: "Magazijnier" },
  { key: "emballeur", sector: "logistique", fr: "Emballeur / manutentionnaire", nl: "Inpakker / behandelaar" },
  { key: "gestionnaire_stock", sector: "logistique", fr: "Réceptionnaire / gestionnaire de stock", nl: "Ontvanger / voorraadbeheerder" },
  // Transport
  { key: "chauffeur_ce", sector: "transport", fr: "Chauffeur poids lourd (C/CE)", nl: "Vrachtwagenchauffeur (C/CE)" },
  { key: "chauffeur_livreur", sector: "transport", fr: "Chauffeur-livreur (B)", nl: "Chauffeur-koerier (B)" },
  { key: "chauffeur_bus", sector: "transport", fr: "Chauffeur de bus / car (D)", nl: "Buschauffeur (D)" },
  // Santé
  { key: "aide_soignant", sector: "medical", fr: "Aide-soignant", nl: "Zorgkundige" },
  { key: "infirmier", sector: "medical", fr: "Infirmier", nl: "Verpleegkundige" },
  { key: "aide_menager", sector: "medical", fr: "Aide familial / garde à domicile", nl: "Gezinshulp / thuisoppas" },
  { key: "educateur", sector: "medical", fr: "Éducateur", nl: "Opvoeder" },
  { key: "puericulteur", sector: "medical", fr: "Puériculteur / accueillant d'enfants", nl: "Kinderverzorger / onthaalouder" },
  { key: "assistant_pharma", sector: "medical", fr: "Assistant pharmaceutique", nl: "Farmaceutisch-technisch assistent" },
  { key: "aide_logistique_hopital", sector: "medical", fr: "Aide logistique en hôpital / brancardier", nl: "Logistiek medewerker ziekenhuis / brancardier" },
  // Sécurité
  { key: "agent_gardiennage", sector: "securite", fr: "Agent de gardiennage", nl: "Bewakingsagent" },
  { key: "steward", sector: "securite", fr: "Steward / agent de prévention", nl: "Steward / preventiemedewerker" },
  // Nettoyage
  { key: "agent_entretien", sector: "nettoyage", fr: "Agent d'entretien", nl: "Schoonmaker" },
  { key: "nettoyeur_industriel", sector: "nettoyage", fr: "Nettoyeur industriel", nl: "Industrieel schoonmaker" },
  { key: "aide_menagere_ts", sector: "nettoyage", fr: "Aide-ménager (titres-services)", nl: "Huishoudhulp (dienstencheques)" },
  { key: "laveur_vitres", sector: "nettoyage", fr: "Laveur de vitres / technicien de surface", nl: "Glazenwasser / oppervlaktetechnicus" },
  // Commerce, Horeca, bureau, autres
  { key: "vendeur", sector: "commerce", fr: "Vendeur / caissier", nl: "Verkoper / kassier" },
  { key: "serveur", sector: "horeca", fr: "Serveur / barman", nl: "Kelner / barman" },
  { key: "cuisinier", sector: "horeca", fr: "Cuisinier / commis de cuisine", nl: "Kok / keukenhulp" },
  { key: "employe_administratif", sector: "administratif", fr: "Employé administratif", nl: "Administratief bediende" },
  { key: "comptable", sector: "administratif", fr: "Comptable", nl: "Boekhouder" },
  { key: "jardinier", sector: "autre", fr: "Jardinier", nl: "Tuinman" },
  { key: "boulanger_boucher", sector: "commerce", fr: "Boulanger / boucher", nl: "Bakker / slager" },
  { key: "employe_rayon", sector: "commerce", fr: "Employé de rayon / réassort", nl: "Rekkenvuller" },
  { key: "plongeur", sector: "horeca", fr: "Plongeur / aide de cuisine", nl: "Afwasser / keukenhulp" },
  { key: "receptionniste", sector: "administratif", fr: "Réceptionniste / accueil", nl: "Receptionist / onthaal" },
  { key: "secretaire", sector: "administratif", fr: "Secrétaire / assistant de direction", nl: "Secretaresse / directieassistent" },
  { key: "commercial", sector: "commerce", fr: "Commercial / représentant", nl: "Vertegenwoordiger / verkoper buitendienst" },
  { key: "informaticien", sector: "administratif", fr: "Informaticien / helpdesk", nl: "Informaticus / helpdesk" },
  { key: "ouvrier_agricole", sector: "autre", fr: "Ouvrier agricole / horticole", nl: "Land- of tuinbouwarbeider" },
];

export const TRADE_KEYS = new Set(TRADES.map((t) => t.key));
export const MAX_TRADES = 3;

export function tradeLabel(key: string, lang: string = "fr"): string {
  const t = TRADES.find((x) => x.key === key);
  return t ? (lang === "nl" ? t.nl : t.fr) : key;
}

/** Métiers proposés pour les secteurs choisis (tous si aucun secteur). */
export function tradesFor(sectors: string[]): Trade[] {
  return sectors.length ? TRADES.filter((t) => sectors.includes(t.sector)) : TRADES;
}

/** Métier libre (absent de la liste) : texte court, sans caractères spéciaux. */
export function sanitizeTradeOther(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/[^\p{L}\p{N} '\-\/().,&]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return t || null;
}

const GUESS: [RegExp, string][] = [
  [/electricien|électricien/i, "electricien_batiment"], [/macon|maçon/i, "macon"], [/menuisier/i, "menuisier"],
  [/couvreur/i, "couvreur"], [/plombier|chauffagiste/i, "plombier_chauffagiste"], [/peintre/i, "peintre"],
  [/carreleur/i, "carreleur"], [/b[aâ]timent|manoeuvre|manœuvre|polyvalent/i, "manoeuvre"],
  [/production|opérateur|operateur/i, "operateur_production"], [/soudeur|soudure/i, "soudeur"],
  [/maintenance/i, "technicien_maintenance"], [/m[ée]canicien/i, "mecanicien_auto"], [/cariste/i, "cariste"],
  [/pr[ée]parateur|picking/i, "preparateur_commandes"], [/magasinier/i, "magasinier"], [/chauffeur.*(ce|c\b|poids)/i, "chauffeur_ce"],
  [/livreur/i, "chauffeur_livreur"], [/aide[- ]soignant/i, "aide_soignant"], [/infirmier/i, "infirmier"],
  [/gardiennage|s[ée]curit[ée]|agent de s/i, "agent_gardiennage"], [/nettoyeur.*industriel|nettoyage industriel/i, "nettoyeur_industriel"],
  [/nettoy|entretien|technicien de surface/i, "agent_entretien"], [/vendeu|caissi/i, "vendeur"], [/serveu|barman/i, "serveur"],
  [/cuisin|commis/i, "cuisinier"], [/administrati|secr[ée]taire/i, "employe_administratif"], [/comptab/i, "comptable"],
];
/** Métiers déduits du titre d'une offre (candidature rapide sans compte). */
export function guessTrades(title: string): string[] {
  const out: string[] = [];
  for (const [re, k] of GUESS) if (re.test(title) && !out.includes(k)) out.push(k);
  return out.slice(0, MAX_TRADES);
}

/** Ne garde que des clés connues, sans doublon, au plus MAX_TRADES. */
export function sanitizeTrades(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.filter((x): x is string => typeof x === "string" && TRADE_KEYS.has(x)))).slice(0, MAX_TRADES);
}
