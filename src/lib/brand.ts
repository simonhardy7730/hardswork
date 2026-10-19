/**
 * Identité de marque — SEUL endroit à modifier le jour où le nom change.
 * (Le logo/wordmark, le header, le footer et les métadonnées de la page d'accueil lisent ce fichier.)
 */
export const BRAND = {
  name: "Wolko",
  /** Wordmark en 3 morceaux : le 2e est mis en jaune. */
  wordmark: ["Wolk", "o", ""] as const,
  tagline: "Le bon talent. La bonne entreprise.",
  description:
    "La plateforme qui rapproche les candidats, les entreprises et les agences d'intérim. Trouvez un emploi ou recrutez plus simplement, près de chez vous.",
  contactEmail: "hello@hardswork.be",
  colors: {
    navy: "#101F43",
    navyDeep: "#0B1630",
    navy2: "#1C3058",
    sun: "#FFB900",
    sunHover: "#EAA600",
    cream: "#FFFBF2",
    white: "#FFFFFF",
    slateText: "#64748B",
    slateLight: "#F1F5F9",
  },
} as const;

/** Navigation principale (header + pied de page). */
export const NAV_LINKS = [
  { label: "Trouver un emploi", href: "/jobs" },
  { label: "Recruter", href: "/recrute" },
  { label: "Nos tarifs", href: "/tarifs" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
] as const;
