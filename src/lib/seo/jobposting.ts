/** Données structurées « JobPosting » (schema.org) : permettent l'affichage dans Google Emplois. */
export interface OfferForSeo {
  id: string; title: string; description: string | null; contract_type: string; city: string; postal_code?: string | null; created_at: string;
  salary_min: number | null; salary_max: number | null; salary_period: string | null; show_salary: boolean | null;
  /** Fin réelle de l'annonce (Flash : 30 jours). Absente : on garde 60 jours après la publication. */
  expires_at?: string | null;
}

const EMPLOYMENT: Record<string, string | string[]> = { cdi: "FULL_TIME", cdd: "TEMPORARY", interim: "TEMPORARY", interim_cdi: ["FULL_TIME", "TEMPORARY"], etudiant: "PART_TIME", flexi: "PART_TIME", stage: "INTERN", apprentissage: "OTHER" };

/** Province / région belge à partir du code postal (sinon de la ville) : Google la demande dans l'adresse. */
export function regionOf(postal: string | null | undefined, city: string): string | null {
  const n = parseInt(String(postal ?? "").slice(0, 4), 10);
  if (n >= 1000 && n <= 9999) {
    if (n < 1300) return "Bruxelles-Capitale";
    if (n < 1500) return "Brabant wallon";
    if (n < 2000) return "Brabant flamand";
    if (n < 3000) return "Anvers";
    if (n < 3500) return "Brabant flamand";
    if (n < 4000) return "Limbourg";
    if (n < 5000) return "Liège";
    if (n < 6000) return "Namur";
    if (n < 6600) return "Hainaut";
    if (n < 7000) return "Luxembourg";
    if (n < 8000) return "Hainaut";
    if (n < 9000) return "Flandre occidentale";
    return "Flandre orientale";
  }
  const c = city.toLowerCase();
  if (/tournai|doornik|mouscron|moeskroen|mons|bergen|charleroi|ath|leuze|péruwelz|peruwelz|comines|la louvière|binche|soignies|antoing|templeuve|frasnes/.test(c)) return "Hainaut";
  if (/bruxelles|brussel|ixelles|schaerbeek|anderlecht/.test(c)) return "Bruxelles-Capitale";
  if (/namur|dinant|andenne/.test(c)) return "Namur";
  if (/liège|liege|verviers|huy/.test(c)) return "Liège";
  if (/wavre|nivelles|waterloo|louvain-la-neuve/.test(c)) return "Brabant wallon";
  if (/kortrijk|courtrai|bruges|brugge|ostende|oostende|ypres|ieper/.test(c)) return "Flandre occidentale";
  if (/gand|gent|alost|aalst/.test(c)) return "Flandre orientale";
  return null;
}

export function buildJobPosting(o: OfferForSeo, orgName: string, baseUrl = "https://wolko.be") {
  const plain = (o.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const posting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: o.title,
    description: plain || o.title,
    identifier: { "@type": "PropertyValue", name: "Wolko", value: o.id },
    datePosted: o.created_at.slice(0, 10),
    employmentType: EMPLOYMENT[o.contract_type] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: orgName },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: o.city, ...(regionOf(o.postal_code, o.city) ? { addressRegion: regionOf(o.postal_code, o.city) } : {}), ...(o.postal_code ? { postalCode: o.postal_code } : {}), addressCountry: "BE" },
    },
    validThrough: (o.expires_at && !Number.isNaN(Date.parse(o.expires_at))
      ? new Date(o.expires_at) : new Date(new Date(o.created_at).getTime() + 60 * 86400000)).toISOString(),
    directApply: true,
    url: `${baseUrl}/jobs/${o.id}`,
  };
  if (o.show_salary && o.salary_min) {
    posting.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: {
        "@type": "QuantitativeValue",
        // Fourchette complète si on a les deux bornes, sinon montant fixe (Google signale un « maxValue » manquant sinon).
        ...(o.salary_max && o.salary_max > o.salary_min ? { minValue: o.salary_min, maxValue: o.salary_max } : { value: o.salary_min }),
        unitText: o.salary_period === "heure" ? "HOUR" : o.salary_period === "jour" ? "DAY" : "MONTH",
      },
    };
  }
  return posting;
}

/** Sérialisation sûre à l'intérieur d'une balise <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Titre et description de page : propres à chaque offre, sans jamais nommer un client confidentiel. */
export function jobSeo(o: { title: string; city: string; contract_type?: string | null; description?: string | null }, lang: "fr" | "nl", contractLabel?: string) {
  const plain = (o.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const title = lang === "nl" ? `${o.title} in ${o.city} — Vacature | Wolko` : `${o.title} à ${o.city} — Emploi | Wolko`;
  const lead = lang === "nl"
    ? `${o.title} in ${o.city}${contractLabel ? ` (${contractLabel})` : ""}. `
    : `${o.title} à ${o.city}${contractLabel ? ` (${contractLabel})` : ""}. `;
  const tail = lang === "nl" ? "Solliciteer snel op Wolko, zonder account." : "Postulez en 1 minute sur Wolko, sans compte.";
  const body = plain ? `${plain.slice(0, 110).replace(/\s+\S*$/, "")}… ` : "";
  const description = (lead + body + tail).slice(0, 300);
  return { title, description };
}
