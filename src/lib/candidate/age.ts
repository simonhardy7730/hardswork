export const MIN_AGE = 15;   // âge minimum pour s'inscrire
export const ADULT_AGE = 18; // âge minimum pour la candidathèque

/** Âge en années entières au jour `now`, ou null si la date n'est pas une date valide AAAA-MM-JJ. */
export function ageFromBirthDate(value: string, now: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) age--;
  return age >= 0 && age <= 100 ? age : null;
}
