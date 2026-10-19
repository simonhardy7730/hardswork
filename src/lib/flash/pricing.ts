// WOLKO Flash / Flash Duo — tarification en CENTIMES ENTIERS (aucun calcul flottant).
// Miroir de flash_create_order() en SQL (migration 024), qui reste la source de vérité côté serveur.
export const FLASH_UNIT_CENTS = 14_900;       // 149 € HTVA
export const FLASH_DAYS = 30;                 // durée de chaque annonce
export const FLASH_ACTIVATE_WITHIN_DAYS = 90; // validité pour activer chaque crédit (à valider juridiquement)
export const FLASH_VAT_PERCENT = 21;          // TVA indicative : à confirmer par le comptable (app_settings.flash_vat_rate)
export const FLASH_TERMS_VERSION = "2026-10-flash";
export const FLASH_MAX_QTY = 50;

export interface FlashQuote {
  quantity: number;
  unitCents: number;
  grossCents: number;      // quantité × prix unitaire
  discountCents: number;   // remise Duo : -50 % sur la 2e annonce, UNE SEULE FOIS par commande
  totalHtCents: number;
  vatPercent: number;
  vatCents: number;
  totalTtcCents: number;
}

export function flashQuote(quantity: number, unitCents = FLASH_UNIT_CENTS, vatPercent = FLASH_VAT_PERCENT): FlashQuote {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > FLASH_MAX_QTY) throw new Error("quantité invalide");
  const grossCents = unitCents * quantity;
  const discountCents = quantity >= 2 ? Math.floor(unitCents / 2) : 0;
  const totalHtCents = grossCents - discountCents;
  // TVA arrondie au centime (demi vers le haut), en entiers : ht × pourcent / 100
  const vatCents = Math.floor((totalHtCents * Math.round(vatPercent * 100) + 5_000) / 10_000);
  return { quantity, unitCents, grossCents, discountCents, totalHtCents, vatPercent, vatCents, totalTtcCents: totalHtCents + vatCents };
}

export function formatEuro(cents: number, locale = "fr-BE"): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const rest = abs % 100;
  const intPart = euros.toLocaleString(locale);
  return `${sign}${intPart},${String(rest).padStart(2, "0")} €`;
}

export type CreditStatus = "pending" | "available" | "active" | "suspended" | "expired" | "lapsed" | "void";
export type OrderStatus = "awaiting_payment" | "paid" | "authorized_deferred" | "cancelled" | "refunded";

export const CREDIT_LABEL: Record<CreditStatus, { fr: string; nl: string }> = {
  pending: { fr: "En attente de paiement", nl: "Wacht op betaling" },
  available: { fr: "À activer", nl: "Te activeren" },
  active: { fr: "Active", nl: "Actief" },
  suspended: { fr: "Suspendue", nl: "Opgeschort" },
  expired: { fr: "Expirée", nl: "Verlopen" },
  lapsed: { fr: "Non activée (délai dépassé)", nl: "Niet geactiveerd (termijn verstreken)" },
  void: { fr: "Annulée", nl: "Geannuleerd" },
};

export const ORDER_LABEL: Record<OrderStatus, { fr: string; nl: string }> = {
  awaiting_payment: { fr: "Paiement en attente", nl: "Betaling in afwachting" },
  paid: { fr: "Paiement confirmé", nl: "Betaling bevestigd" },
  authorized_deferred: { fr: "Publication autorisée, paiement différé", nl: "Publicatie toegestaan, uitgestelde betaling" },
  cancelled: { fr: "Annulée", nl: "Geannuleerd" },
  refunded: { fr: "Remboursée", nl: "Terugbetaald" },
};

/** Jours entiers restants (arrondi au supérieur), 0 si terminé. */
export function daysLeft(expiresAtIso: string | null, now: Date): number {
  if (!expiresAtIso) return 0;
  const ms = new Date(expiresAtIso).getTime() - now.getTime();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}
