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
  { key: "manoeuvre", sector: "construction", fr: "Manœuvre / ouvrier polyvalent", nl: "Handlanger / polyvalent arbeider" },
  // Industrie
  { key: "operateur_production", sector: "industrie", fr: "Opérateur de production", nl: "Productieoperator" },
  { key: "soudeur", sector: "industrie", fr: "Soudeur", nl: "Lasser" },
  { key: "technicien_maintenance", sector: "industrie", fr: "Technicien de maintenance", nl: "Onderhoudstechnicus" },
  { key: "mecanicien", sector: "industrie", fr: "Mécanicien", nl: "Mecanicien" },
  { key: "tourneur_fraiseur", sector: "industrie", fr: "Tourneur / fraiseur / CNC", nl: "Draaier / frezer / CNC" },
  { key: "electromecanicien", sector: "industrie", fr: "Électromécanicien", nl: "Elektromecanicien" },
  // Logistique
  { key: "cariste", sector: "logistique", fr: "Cariste", nl: "Heftruckchauffeur" },
  { key: "preparateur_commandes", sector: "logistique", fr: "Préparateur de commandes", nl: "Orderpicker" },
  { key: "magasinier", sector: "logistique", fr: "Magasinier", nl: "Magazijnier" },
  // Transport
  { key: "chauffeur_ce", sector: "transport", fr: "Chauffeur poids lourd (C/CE)", nl: "Vrachtwagenchauffeur (C/CE)" },
  { key: "chauffeur_livreur", sector: "transport", fr: "Chauffeur-livreur (B)", nl: "Chauffeur-koerier (B)" },
  { key: "chauffeur_bus", sector: "transport", fr: "Chauffeur de bus / car (D)", nl: "Buschauffeur (D)" },
  // Santé
  { key: "aide_soignant", sector: "medical", fr: "Aide-soignant", nl: "Zorgkundige" },
  { key: "infirmier", sector: "medical", fr: "Infirmier", nl: "Verpleegkundige" },
  { key: "aide_menager", sector: "medical", fr: "Aide-ménager / aide familial", nl: "Huishoudhulp / gezinshulp" },
  // Sécurité
  { key: "agent_gardiennage", sector: "securite", fr: "Agent de gardiennage", nl: "Bewakingsagent" },
  // Nettoyage
  { key: "agent_entretien", sector: "nettoyage", fr: "Agent d'entretien", nl: "Schoonmaker" },
  { key: "nettoyeur_industriel", sector: "nettoyage", fr: "Nettoyeur industriel", nl: "Industrieel schoonmaker" },
  // Commerce, Horeca, bureau, autres
  { key: "vendeur", sector: "autre", fr: "Vendeur / caissier", nl: "Verkoper / kassier" },
  { key: "serveur", sector: "autre", fr: "Serveur / barman", nl: "Kelner / barman" },
  { key: "cuisinier", sector: "autre", fr: "Cuisinier / commis de cuisine", nl: "Kok / keukenhulp" },
  { key: "employe_administratif", sector: "autre", fr: "Employé administratif", nl: "Administratief bediende" },
  { key: "comptable", sector: "autre", fr: "Comptable", nl: "Boekhouder" },
  { key: "jardinier", sector: "autre", fr: "Jardinier", nl: "Tuinman" },
  { key: "boulanger_boucher", sector: "autre", fr: "Boulanger / boucher", nl: "Bakker / slager" },
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

/** Ne garde que des clés connues, sans doublon, au plus MAX_TRADES. */
export function sanitizeTrades(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.filter((x): x is string => typeof x === "string" && TRADE_KEYS.has(x)))).slice(0, MAX_TRADES);
}
