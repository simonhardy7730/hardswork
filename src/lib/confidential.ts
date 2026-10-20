export const CONFIDENTIAL_FR = "Entreprise confidentielle";
export const CONFIDENTIAL_NL = "Vertrouwelijk bedrijf";

type OrgLike = { name?: string | null; logo_url?: string | null; primary_color?: string | null; [k: string]: unknown };

/** Nom affiché publiquement pour une offre (jamais le vrai nom si l'annonce est confidentielle). */
export function publicOrgName(hide: boolean | null | undefined, name: string | null | undefined, lang: "fr" | "nl" | string = "fr"): string {
  if (hide) return lang === "nl" ? CONFIDENTIAL_NL : CONFIDENTIAL_FR;
  return name ?? "Wolko";
}

/**
 * À appliquer juste après une requête publique : remplace l'entreprise par « Entreprise confidentielle »
 * (sans logo, sans couleur) pour les offres marquées hide_company. Gère jointure objet ou tableau.
 */
export function maskOrgs<T extends { hide_company?: boolean | null; organizations?: unknown }>(rows: T[] | null | undefined, lang: string = "fr"): T[] {
  return (rows ?? []).map((r) => {
    if (!r.hide_company) return r;
    const masked: OrgLike = { name: lang === "nl" ? CONFIDENTIAL_NL : CONFIDENTIAL_FR, logo_url: null, primary_color: null };
    return { ...r, organizations: Array.isArray(r.organizations) ? [masked] : masked };
  });
}
