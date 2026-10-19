/** Données structurées « JobPosting » (schema.org) : permettent l'affichage dans Google Emplois. */
export interface OfferForSeo {
  id: string; title: string; description: string | null; contract_type: string; city: string; postal_code?: string | null; created_at: string;
  salary_min: number | null; salary_max: number | null; salary_period: string | null; show_salary: boolean | null;
}

const EMPLOYMENT: Record<string, string> = { cdi: "FULL_TIME", cdd: "TEMPORARY", interim: "TEMPORARY" };

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
      address: { "@type": "PostalAddress", addressLocality: o.city, ...(o.postal_code ? { postalCode: o.postal_code } : {}), addressCountry: "BE" },
    },
    directApply: true,
    url: `${baseUrl}/jobs/${o.id}`,
  };
  if (o.show_salary && o.salary_min) {
    posting.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: {
        "@type": "QuantitativeValue",
        minValue: o.salary_min,
        ...(o.salary_max ? { maxValue: o.salary_max } : {}),
        unitText: o.salary_period === "heure" ? "HOUR" : "MONTH",
      },
    };
  }
  return posting;
}

/** Sérialisation sûre à l'intérieur d'une balise <script>. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
