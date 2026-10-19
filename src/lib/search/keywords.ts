import { safeIlikeValue } from "@/lib/geo/distance";

/** Mots saisis → secteur / contrat (FR, NL, variantes sans accent). */
const SECTOR_WORDS: Record<string, string[]> = {
  logistique: ["logistique", "logistiek"],
  industrie: ["industrie", "industry"],
  construction: ["construction", "bouw", "batiment", "chantier"],
  transport: ["transport"],
  nettoyage: ["nettoyage", "schoonmaak"],
  securite: ["securite", "beveiliging", "gardiennage"],
  medical: ["medical", "medisch", "sante"],
  autre: ["horeca", "autre"],
};
const CONTRACT_WORDS: Record<string, string[]> = {
  cdi: ["cdi"],
  cdd: ["cdd"],
  interim: ["interim", "interimaire", "uitzend"],
  etudiant: ["etudiant", "student", "studentenjob", "jobetudiant"],
  flexi: ["flexi", "flexijob", "flexi-job"],
  stage: ["stage", "stagiaire"],
  apprentissage: ["apprentissage", "alternance", "leercontract"],
};

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Recherche « intelligente » : chaque mot saisi doit correspondre au titre, à la ville, à la description,
 * au secteur ou au type de contrat. « Tournai », « électricien Tournai » ou « cdi logistique » trouvent donc les bonnes offres.
 * Renvoie un tableau de groupes `or=(…)` PostgREST (un groupe par mot, les groupes sont combinés en ET).
 */
export function keywordGroups(q: string): string[] {
  const words = q.split(/\s+/).map(safeIlikeValue).filter((w) => w.length >= 2).slice(0, 5);
  return words.map((w) => {
    const variants = Array.from(new Set([w, strip(w)]));
    const parts: string[] = [];
    for (const v of variants) {
      parts.push(`title.ilike.*${v}*`, `city.ilike.*${v}*`, `description.ilike.*${v}*`);
    }
    const key = strip(w).toLowerCase();
    for (const [sector, ws] of Object.entries(SECTOR_WORDS)) if (ws.includes(key)) parts.push(`sector.eq.${sector}`);
    for (const [contract, ws] of Object.entries(CONTRACT_WORDS)) if (ws.includes(key)) parts.push(`contract_type.eq.${contract}`);
    return parts.join(",");
  });
}
