/**
 * Mode « page d'accueil seule » : le site ne montre que le titre Wolko et le loup, toutes les autres pages
 * (offres, candidats, tarifs, légal, etc.) renvoient vers l'accueil, et les envois automatiques (alertes, Facebook, relances) sont suspendus.
 * AUCUNE donnée n'est supprimée (offres, candidatures, profils restent en base). Pour tout remettre en ligne : passer MAINTENANCE à false.
 */
export const MAINTENANCE = true;

/** Chemins qui restent accessibles en mode accueil seul (accueil, ressources techniques, connexion, administration, API internes). */
export function maintenanceAllows(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/postuler" || pathname.startsWith("/postuler/") || pathname.startsWith("/api/postuler")) return false;
  const open = ["/api/", "/_next/", "/images/", "/fonts/", "/login", "/auth", "/admin", "/alertes/desinscription"];
  if (open.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : p + "/") || pathname.startsWith(p))) return true;
  return ["/icon.svg", "/robots.txt", "/sitemap.xml", "/opengraph-image.png", "/twitter-image.png", "/favicon.ico"].includes(pathname) || /^\/google[0-9a-f]+\.html$/.test(pathname);
}
