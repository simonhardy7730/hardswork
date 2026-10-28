import { publicOrgName } from "@/lib/confidential";

export type ShareJob = {
  id: string; title: string; city: string | null; contract_type: string | null;
  hide_company: boolean | null; org_name: string | null;
};

const CONTRACTS: Record<string, string> = { interim: "Intérim", interim_cdi: "Intérim / CDI", cdi: "CDI", cdd: "CDD", apprentissage: "Apprentissage", etudiant: "Job étudiant", flexi: "Flexi-job", stage: "Stage" };

const HASHTAGS = "#emploi #WallonniePicarde #Hainaut #offredemploi #Wolko";

export const jobLink = (id: string) => `https://wolko.be/jobs/${id}`;

/** Message + lien séparés (l'API Facebook affiche l'aperçu du lien toute seule). Jamais le vrai nom si l'annonce est confidentielle. */
export function facebookPostParts(j: ShareJob): { message: string; link: string } {
  const org = publicOrgName(j.hide_company, j.org_name, "fr");
  const lines = [
    `🚀 ${j.title}${j.city ? ` – ${j.city}` : ""}`,
    ...(j.contract_type ? [`📄 ${CONTRACTS[j.contract_type] ?? j.contract_type}`] : []),
    `🏢 ${org}`,
    "",
    "👉 Postule gratuitement en 2 minutes :",
    "",
    HASHTAGS,
  ];
  return { message: lines.join("\n"), link: jobLink(j.id) };
}

/** Texte complet à copier-coller à la main (lien inclus). */
export function facebookPostText(j: ShareJob): string {
  const { message, link } = facebookPostParts(j);
  return message.replace("2 minutes :\n", `2 minutes : ${link}\n`);
}
