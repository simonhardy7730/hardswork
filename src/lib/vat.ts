/** Validation de numéros de TVA (format + clé de contrôle quand elle existe). Pas de vérification VIES. */

export function normalizeVat(raw: string): string {
  return raw.toUpperCase().replace(/[\s.\-]/g, "");
}

/** Belgique : BE + 10 chiffres (0 ou 1 en tête), clé = 97 - (8 premiers chiffres mod 97). */
function checkBE(n: string): boolean {
  const m = /^BE([01]\d{9})$/.exec(n);
  if (!m) return false;
  const d = m[1];
  return 97 - (parseInt(d.slice(0, 8), 10) % 97) === parseInt(d.slice(8), 10);
}

/** France : FR + 2 caractères de clé + SIREN (9 chiffres). */
function checkFR(n: string): boolean {
  const m = /^FR([0-9A-Z]{2})(\d{9})$/.exec(n);
  if (!m) return false;
  if (!/^\d{2}$/.test(m[1])) return true; // clés alphanumériques : format seul
  return (12 + 3 * (parseInt(m[2], 10) % 97)) % 97 === parseInt(m[1], 10);
}

const EU_FORMAT = /^(AT|BG|CY|CZ|DE|DK|EE|EL|ES|FI|HR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK)[0-9A-Z]{8,12}$/;

/** Pour l'instant : numéros belges uniquement (BE + clé de contrôle). */
const BELGIUM_ONLY = true;

export function isValidVat(raw: string): boolean {
  const n = normalizeVat(raw);
  if (n.startsWith("BE")) return checkBE(n);
  if (BELGIUM_ONLY) return false;
  if (n.startsWith("FR")) return checkFR(n);
  return EU_FORMAT.test(n);
}

/** Affichage lisible : BE 0123.456.749 */
export function formatVat(raw: string): string {
  const n = normalizeVat(raw);
  const m = /^BE(\d{4})(\d{3})(\d{3})$/.exec(n);
  return m ? `BE ${m[1]}.${m[2]}.${m[3]}` : n;
}
