/** Libellé de contrat : les annonces « (Intérim / CDI) » affichent les deux types (le champ de contrat n'en accepte qu'un). */
export function contractLabel(labels: Record<string, string>, offer: { contract_type?: string | null; title?: string | null }): string {
  if (/\(int[ée]rim\s*\/\s*cdi\)/i.test(offer.title ?? "")) return "Intérim / CDI";
  const c = offer.contract_type ?? "";
  return labels[c] ?? c;
}
