import { publicOrgName } from "@/lib/confidential";

export type ShareJob = {
  id: string; title: string; city: string | null; contract_type: string | null;
  hide_company: boolean | null; org_name: string | null;
};

/** Texte de partage Facebook : jamais le vrai nom si l'annonce est confidentielle. */
export function facebookPostText(j: ShareJob): string {
  const org = publicOrgName(j.hide_company, j.org_name, "fr");
  const lines = [
    `🚀 ${j.title}${j.city ? ` – ${j.city}` : ""}`,
    ...(j.contract_type ? [`📄 ${j.contract_type}`] : []),
    `🏢 ${org}`,
    "",
    `👉 Postule gratuitement en 2 minutes : https://wolko.be/jobs/${j.id}`,
    "",
    "#emploi #Tournai #WallonniePicarde #Hainaut #offredemploi #Wolko",
  ];
  return lines.join("\n");
}
