import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type LangCode = "fr" | "nl";
const LOCALE = (lang: LangCode) => (lang === "nl" ? "nl-BE" : "fr-BE");

export function formatCurrency(amount: number, period: string, lang: LangCode = "fr"): string {
  const formatted = new Intl.NumberFormat(LOCALE(lang), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);

  const periodLabel: Record<string, string> = {
    heure: "/h",
    jour: lang === "nl" ? "/dag" : "/j",
    mois: lang === "nl" ? "/maand" : "/mois",
  };

  return `${formatted}${periodLabel[period] ?? ""}`;
}

export function formatDate(dateStr: string, lang: LangCode = "fr"): string {
  return new Date(dateStr).toLocaleDateString(LOCALE(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelative(dateStr: string, lang: LangCode = "fr"): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (lang === "nl") {
    if (diffHours < 1) return "Minder dan een uur geleden";
    if (diffHours < 24) return `${diffHours} u geleden`;
    if (diffDays === 1) return "Gisteren";
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    return formatDate(dateStr, lang);
  }
  if (diffHours < 1) return "Il y a moins d'une heure";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return formatDate(dateStr);
}

export const CONTRACT_LABELS: Record<string, string> = {
  interim: "Contrat intérimaire",
  cdi: "CDI",
  cdd: "CDD",
  apprentissage: "Apprentissage",
};

export const SECTOR_LABELS: Record<string, string> = {
  logistique: "Logistique",
  industrie: "Industrie",
  construction: "Construction",
  transport: "Transport",
  nettoyage: "Nettoyage",
  securite: "Sécurité",
  medical: "Médical",
  autre: "Autre",
};

export const REGION_LABELS: Record<string, string> = {
  wallonie: "Wallonie",
  bruxelles: "Bruxelles",
  flandre: "Flandre",
};

export const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  entretien: "Entretien",
  place: "Placé",
  refuse: "Refusé",
  draft: "Brouillon",
  active: "Active",
  paused: "En pause",
  closed: "Clôturée",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: "Immédiatement",
  "1_semaine": "Dans 1 semaine",
  "1_mois": "Dans 1 mois",
};

/** Libellés néerlandais + accès par langue : labels("nl").sector[key] */
const NL = {
  contract: { interim: "Interimcontract", cdi: "Onbepaalde duur", cdd: "Bepaalde duur", apprentissage: "Leercontract" },
  sector: { logistique: "Logistiek", industrie: "Industrie", construction: "Bouw", transport: "Transport", nettoyage: "Schoonmaak", securite: "Beveiliging", medical: "Medisch", autre: "Andere" },
  region: { wallonie: "Wallonië", bruxelles: "Brussel", flandre: "Vlaanderen" },
  status: { nouveau: "Nieuw", contacte: "Gecontacteerd", entretien: "Gesprek", place: "Geplaatst", refuse: "Geweigerd", draft: "Concept", active: "Actief", paused: "Gepauzeerd", closed: "Afgesloten" },
  availability: { immediate: "Onmiddellijk", "1_semaine": "Binnen 1 week", "1_mois": "Binnen 1 maand" },
} as const;

export function labels(lang: LangCode = "fr") {
  if (lang === "nl") {
    return {
      contract: NL.contract as Record<string, string>,
      sector: NL.sector as Record<string, string>,
      region: NL.region as Record<string, string>,
      status: NL.status as Record<string, string>,
      availability: NL.availability as Record<string, string>,
    };
  }
  return { contract: CONTRACT_LABELS, sector: SECTOR_LABELS, region: REGION_LABELS, status: STATUS_LABELS, availability: AVAILABILITY_LABELS };
}

export const JOB_TITLE_SUGGESTIONS = [
  "Cariste",
  "Opérateur de production",
  "Chauffeur SPL",
  "Chauffeur PL",
  "Agent logistique",
  "Préparateur de commandes",
  "Manutentionnaire",
  "Agent de nettoyage",
  "Agent de sécurité",
  "Ouvrier polyvalent",
  "Technicien de maintenance",
  "Soudeur",
  "Électricien industriel",
  "Magasinier",
  "Chef d'équipe logistique",
];

export const SECTOR_TEMPLATES: Record<string, string> = {
  logistique: `Nous recherchons un(e) [titre du poste] pour intégrer notre équipe logistique.

Missions :
- Réception et contrôle des marchandises entrantes
- Rangement et gestion des stocks
- Préparation de commandes selon les bons de livraison
- Utilisation des engins de manutention (si CACES requis)

Profil recherché :
- Expérience en logistique souhaitée
- Rigoureux(se), organisé(e) et dynamique
- Disponible selon les horaires indiqués`,

  transport: `Nous recrutons un(e) [titre du poste] pour rejoindre notre flotte de transport.

Missions :
- Livraison de marchandises selon les tournées planifiées
- Chargement et déchargement du véhicule
- Respect du code de la route et des délais de livraison
- Tenue des documents de transport (CMR, bons de livraison)

Profil recherché :
- Permis de conduire valide (selon catégorie requise)
- Connaissance de la réglementation transport
- Autonome et ponctuel(le)`,

  industrie: `Poste à pourvoir immédiatement dans notre unité de production.

Missions :
- Surveillance et alimentation des lignes de production
- Contrôle qualité visuel des produits finis
- Respect des procédures de sécurité et des normes en vigueur
- Nettoyage et entretien du poste de travail

Profil recherché :
- Première expérience en milieu industriel appréciée
- Rigueur, concentration et sens des responsabilités
- Disponible pour les horaires en équipe`,

  construction: `Rejoignez notre équipe sur chantier pour un poste de [titre du poste].

Missions :
- Réalisation des travaux selon les plans et consignes
- Respect des normes de sécurité sur chantier
- Utilisation des outils et matériaux adaptés
- Collaboration avec l'équipe et le chef de chantier

Profil recherché :
- Formation ou expérience dans le secteur de la construction
- Permis B souhaité pour déplacements sur chantiers
- Rigoureux(se) et respectueux(se) des consignes de sécurité`,

  nettoyage: `Nous recherchons un(e) agent(e) de nettoyage pour nos sites clients.

Missions :
- Nettoyage et entretien des espaces selon le cahier des charges
- Utilisation des produits et matériels de nettoyage
- Respect des protocoles d'hygiène et de sécurité
- Signalement des anomalies au responsable

Profil recherché :
- Expérience en nettoyage professionnel appréciée
- Discrétion, sérieux et ponctualité
- Disponible selon les horaires du poste`,

  securite: `Nous recrutons un(e) agent(e) de sécurité pour la surveillance de sites.

Missions :
- Contrôle des accès et surveillance du périmètre
- Rondes de sécurité selon planning établi
- Intervention en cas d'incident et rédaction de rapports
- Accueil et orientation des visiteurs

Profil recherché :
- Carte professionnelle d'agent de gardiennage en cours de validité
- SSIAP apprécié
- Calme, réactif(ve) et sens des responsabilités`,

  autre: `Nous recrutons pour le poste de [titre du poste].

Missions :
- [Décrivez les missions principales]

Profil recherché :
- [Décrivez le profil souhaité]
- [Expérience, compétences, qualités attendues]`,
};
