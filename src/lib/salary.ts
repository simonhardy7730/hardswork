/** Affichage du salaire : gère un minimum seul, un maximum seul ou une fourchette (jamais « null »). */
export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  period: string | null | undefined,
  lang: "fr" | "nl" = "fr",
): string | null {
  const hasMin = typeof min === "number" && min > 0;
  const hasMax = typeof max === "number" && max > 0;
  if (!hasMin && !hasMax) return null;
  const locale = lang === "nl" ? "nl-BE" : "fr-BE";
  const num = (n: number) => (period === "heure" ? String(n) : n.toLocaleString(locale));
  const unit = period === "heure" ? "€/h" : period === "jour" ? (lang === "nl" ? "€/dag" : "€/j") : lang === "nl" ? "€/maand" : "€/mois";
  if (hasMin && hasMax && min !== max) return `${num(min!)}–${num(max!)}${unit}`;
  if (hasMin && hasMax) return `${num(min!)}${unit}`;
  if (hasMin) return `${lang === "nl" ? "vanaf" : "dès"} ${num(min!)}${unit}`;
  return `${lang === "nl" ? "tot" : "jusqu'à"} ${num(max!)}${unit}`;
}
