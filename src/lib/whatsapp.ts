/**
 * Lien WhatsApp (wa.me) : gratuit, sans API. Normalise un numéro belge/étranger en chiffres avec indicatif.
 * 0470 12 34 56 → 32470123456 ; +33 6 12 34 56 78 → 33612345678 ; 0032… → 32…
 * Renvoie null si le numéro n'est pas exploitable.
 */
export function whatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);
  else if (s.startsWith("0")) s = "32" + s.slice(1);
  else return null; // sans indicatif ni 0 initial : on ne devine pas
  return /^\d{9,15}$/.test(s) ? s : null;
}

export function whatsappLink(raw: string | null | undefined, text?: string): string | null {
  const n = whatsappNumber(raw);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
