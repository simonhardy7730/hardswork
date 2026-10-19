"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Check } from "lucide-react";
import { useL, useLang } from "@/lib/i18n/context";
import { flashQuote, formatEuro, FLASH_MAX_QTY, FLASH_DAYS, FLASH_ACTIVATE_WITHIN_DAYS } from "@/lib/flash/pricing";
import { createFlashOrder, type FlashBillingInput } from "@/app/(dashboard)/dashboard/flash/actions";

interface Props {
  drafts: { id: string; title: string; city: string }[];
  preselectOfferId?: string | null;
  initialQty?: number;
  defaults: Partial<FlashBillingInput>;
}

const inputCls = "w-full px-3 py-2.5 text-sm border border-ink-100 rounded-xl bg-white focus:outline-none focus:border-brand";

export default function FlashOrderForm({ drafts, preselectOfferId, initialQty = 1, defaults }: Props) {
  const l = useL();
  const lang = useLang();
  const locale = lang === "nl" ? "nl-BE" : "fr-BE";
  const router = useRouter();
  const [pending, start] = useTransition();
  const [qty, setQty] = useState(initialQty);
  const [offers, setOffers] = useState<string[]>(preselectOfferId && drafts.some((d) => d.id === preselectOfferId) ? [preselectOfferId] : []);
  const [b, setB] = useState<FlashBillingInput>({
    company_name: defaults.company_name ?? "", vat_number: defaults.vat_number ?? "", address: defaults.address ?? "",
    postal_code: defaults.postal_code ?? "", city: defaults.city ?? "", email: defaults.email ?? "", contact: defaults.contact ?? "", reference: "",
  });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = flashQuote(qty);
  const eur = (c: number) => formatEuro(c, locale);
  const set = (k: keyof FlashBillingInput) => (e: React.ChangeEvent<HTMLInputElement>) => setB((p) => ({ ...p, [k]: e.target.value }));
  const chosen = (slot: number) => offers[slot] ?? "";
  function pick(slot: number, id: string) {
    setOffers((prev) => { const n = [...prev]; n[slot] = id; return n.slice(0, qty).filter((_, i) => i < qty); });
  }
  function changeQty(n: number) {
    const v = Math.min(FLASH_MAX_QTY, Math.max(1, n));
    setQty(v);
    setOffers((prev) => prev.slice(0, v));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const ids = Array.from({ length: qty }, (_, i) => offers[i]).filter(Boolean) as string[];
      const r = await createFlashOrder({ quantity: qty, offerIds: ids, billing: b, acceptTerms: accept });
      if (r.ok) router.push("/dashboard/flash?commande=ok");
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* 1. Nombre d'annonces */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 sm:p-6">
        <h2 className="font-display font-black uppercase text-ink text-sm tracking-wide mb-1">{l("1. Nombre d'annonces", "1. Aantal advertenties")}</h2>
        <p className="text-xs text-ink-500 mb-4">{l(`Chaque annonce est visible ${FLASH_DAYS} jours à partir de sa publication.`, `Elke advertentie is ${FLASH_DAYS} dagen zichtbaar vanaf publicatie.`)}</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => changeQty(qty - 1)} disabled={qty <= 1} aria-label={l("Moins", "Minder")} className="w-11 h-11 rounded-xl border border-ink-100 flex items-center justify-center disabled:opacity-40"><Minus size={16} /></button>
          <span className="text-2xl font-black text-[#101F43] w-10 text-center" aria-live="polite">{qty}</span>
          <button type="button" onClick={() => changeQty(qty + 1)} disabled={qty >= FLASH_MAX_QTY} aria-label={l("Plus", "Meer")} className="w-11 h-11 rounded-xl border border-ink-100 flex items-center justify-center disabled:opacity-40"><Plus size={16} /></button>
        </div>

        {qty === 1 && (
          <div className="mt-4 rounded-xl bg-[#FFFBF2] border border-[#FFE29A] p-3 text-sm text-[#6B4A00]" data-testid="duo-upsell">
            <p>{l("Vous avez un deuxième poste à pourvoir ? Ajoutez une annonce à moitié prix : seulement 74,50 € supplémentaires.", "Heeft u nog een vacature? Voeg een tweede advertentie toe aan halve prijs: slechts 74,50 € extra.")}</p>
            <button type="button" onClick={() => changeQty(2)} className="mt-2 bg-brand hover:bg-brand-dark text-[#101F43] font-bold text-xs px-4 py-2 rounded-lg">{l("Ajouter une deuxième annonce", "Een tweede advertentie toevoegen")}</button>
          </div>
        )}
        {qty === 2 && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800" data-testid="duo-applied">
            <p className="font-semibold">{l(`Offre Flash Duo appliquée : vous économisez ${eur(q.discountCents)}.`, `Flash Duo-aanbod toegepast: u bespaart ${eur(q.discountCents)}.`)}</p>
            <button type="button" onClick={() => changeQty(1)} className="mt-1 underline text-xs">{l("Revenir à une seule annonce", "Terug naar één advertentie")}</button>
          </div>
        )}
        {qty >= 3 && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
            <p className="font-semibold">{l(`Offre Flash Duo appliquée : vous économisez ${eur(q.discountCents)} (une seule fois par commande).`, `Flash Duo-aanbod toegepast: u bespaart ${eur(q.discountCents)} (één keer per bestelling).`)}</p>
            <p className="text-xs mt-1">{l("Les annonces supplémentaires sont facturées au tarif normal de 149 € HTVA chacune.", "Bijkomende advertenties worden aan het normale tarief van 149 € excl. btw aangerekend.")}</p>
            <button type="button" onClick={() => changeQty(1)} className="mt-1 underline text-xs">{l("Revenir à une seule annonce", "Terug naar één advertentie")}</button>
          </div>
        )}
      </section>

      {/* 2. Annonces */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 sm:p-6">
        <h2 className="font-display font-black uppercase text-ink text-sm tracking-wide mb-1">{l("2. Vos annonces", "2. Uw advertenties")}</h2>
        <p className="text-xs text-ink-500 mb-4">
          {l(`Rattachez un brouillon maintenant, ou faites-le plus tard (vous avez ${FLASH_ACTIVATE_WITHIN_DAYS} jours après l'achat pour activer chaque annonce). Les ${FLASH_DAYS} jours démarrent à la publication.`,
             `Koppel nu een concept of later (u heeft ${FLASH_ACTIVATE_WITHIN_DAYS} dagen na aankoop om elke advertentie te activeren). De ${FLASH_DAYS} dagen starten bij publicatie.`)}
        </p>
        <div className="space-y-3">
          {Array.from({ length: qty }, (_, i) => (
            <div key={i}>
              <label className="block text-xs font-bold text-ink-500 mb-1">{l(`Annonce ${i + 1}`, `Advertentie ${i + 1}`)}</label>
              <select value={chosen(i)} onChange={(e) => pick(i, e.target.value)} className={inputCls}>
                <option value="">{l("Choisir plus tard", "Later kiezen")}</option>
                {drafts.filter((d) => d.id === chosen(i) || !offers.includes(d.id)).map((d) => <option key={d.id} value={d.id}>{d.title} — {d.city}</option>)}
              </select>
            </div>
          ))}
        </div>
        <Link href="/dashboard/offres/nouvelle" className="inline-block mt-3 text-xs text-brand-dark font-bold hover:underline">{l("+ Créer un nouveau brouillon d'annonce", "+ Een nieuw concept aanmaken")}</Link>
      </section>

      {/* 3. Facturation */}
      <section className="bg-white rounded-2xl border border-ink-100 p-5 sm:p-6">
        <h2 className="font-display font-black uppercase text-ink text-sm tracking-wide mb-4">{l("3. Informations de facturation", "3. Factuurgegevens")}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={l("Dénomination sociale", "Bedrijfsnaam")}><input required value={b.company_name} onChange={set("company_name")} className={inputCls} autoComplete="organization" /></Field>
          <Field label={l("N° d'entreprise / TVA", "Ondernemings-/btw-nr.")}><input required value={b.vat_number} onChange={set("vat_number")} placeholder="BE0123.456.789" className={inputCls} /></Field>
          <Field label={l("Adresse de facturation", "Factuuradres")}><input required value={b.address} onChange={set("address")} className={inputCls} autoComplete="street-address" /></Field>
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <Field label={l("Code postal", "Postcode")}><input required value={b.postal_code} onChange={set("postal_code")} className={inputCls} autoComplete="postal-code" inputMode="numeric" /></Field>
            <Field label={l("Ville", "Stad")}><input required value={b.city} onChange={set("city")} className={inputCls} autoComplete="address-level2" /></Field>
          </div>
          <Field label={l("E-mail de facturation", "Factuur-e-mail")}><input required type="email" value={b.email} onChange={set("email")} className={inputCls} autoComplete="email" /></Field>
          <Field label={l("Contact administratif", "Administratief contact")}><input required value={b.contact} onChange={set("contact")} className={inputCls} autoComplete="name" /></Field>
          <Field label={l("Référence bon de commande (facultatif)", "Referentie bestelbon (optioneel)")}><input value={b.reference ?? ""} onChange={set("reference")} className={inputCls} /></Field>
        </div>
      </section>

      {/* 4. Récapitulatif */}
      <section className="bg-white rounded-2xl border border-brand/40 p-5 sm:p-6" data-testid="recap">
        <h2 className="font-display font-black uppercase text-ink text-sm tracking-wide mb-3">{l("4. Récapitulatif de la commande", "4. Overzicht van de bestelling")}</h2>
        <dl className="text-sm space-y-1.5">
          {Array.from({ length: qty }, (_, i) => (
            <div key={i} className="flex justify-between gap-4"><dt className="text-ink-500">WOLKO Flash — {l("Annonce", "Advertentie")} {i + 1}</dt><dd className="font-semibold">{eur(q.unitCents)}</dd></div>
          ))}
          {q.discountCents > 0 && <div className="flex justify-between gap-4 text-emerald-700"><dt>{l("Remise Flash Duo (−50 % sur la 2e annonce)", "Flash Duo-korting (−50 % op de 2e)")}</dt><dd className="font-semibold">{eur(-q.discountCents)}</dd></div>}
          <div className="flex justify-between gap-4 border-t border-ink-100 pt-2"><dt className="font-bold">{l("Total HTVA", "Totaal excl. btw")}</dt><dd className="font-black text-lg text-[#101F43]">{eur(q.totalHtCents)}</dd></div>
          <div className="flex justify-between gap-4 text-ink-500"><dt>{l(`TVA (${q.vatPercent} %, selon le régime applicable)`, `Btw (${q.vatPercent} %, volgens toepasselijk stelsel)`)}</dt><dd>{eur(q.vatCents)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="font-semibold">{l("Total TVAC", "Totaal incl. btw")}</dt><dd className="font-bold">{eur(q.totalTtcCents)}</dd></div>
        </dl>
        {q.discountCents > 0 && <p className="text-xs text-ink-400 mt-2">{l(`Au lieu de ${eur(q.grossCents)} HTVA.`, `In plaats van ${eur(q.grossCents)} excl. btw.`)}</p>}
        <p className="text-[11px] text-ink-400 mt-2">{l("Montants calculés et confirmés par nos serveurs au moment de la commande.", "Bedragen berekend en bevestigd door onze servers bij de bestelling.")}</p>

        <ul className="mt-4 space-y-1.5 text-xs text-ink-500">
          {[
            l("Paiement unique sur facture, par virement bancaire. Aucune carte bancaire.", "Eenmalige betaling op factuur, per overschrijving. Geen bankkaart."),
            l("Vos annonces sont activées après confirmation de la réception du paiement (ou accord exprès de notre équipe). Une facture envoyée n'est pas un paiement.", "Uw advertenties worden geactiveerd na bevestiging van de betaling (of uitdrukkelijk akkoord van ons team). Een verstuurde factuur is geen betaling."),
            l(`${FLASH_DAYS} jours calendaires par annonce, à compter de sa publication ; une modification ne remet pas le compteur à zéro.`, `${FLASH_DAYS} kalenderdagen per advertentie vanaf publicatie; een wijziging zet de teller niet terug.`),
            l(`Chaque annonce doit être activée dans les ${FLASH_ACTIVATE_WITHIN_DAYS} jours suivant l'achat.`, `Elke advertentie moet binnen ${FLASH_ACTIVATE_WITHIN_DAYS} dagen na aankoop geactiveerd worden.`),
            l("Aucun abonnement, aucun engagement, aucun renouvellement automatique. Flash ne donne pas accès à la candidathèque.", "Geen abonnement, geen verbintenis, geen automatische verlenging. Flash geeft geen toegang tot de kandidatendatabank."),
          ].map((t) => <li key={t} className="flex gap-2"><Check size={13} className="text-brand shrink-0 mt-0.5" strokeWidth={3} />{t}</li>)}
        </ul>

        <label className="flex items-start gap-2.5 mt-5 text-sm cursor-pointer">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1 w-4 h-4" required />
          <span>{l("J'ai lu et j'accepte les conditions commerciales ci-dessus et les ", "Ik heb de bovenstaande commerciële voorwaarden gelezen en aanvaard, en de ")}<Link href="/legal/cgu" target="_blank" className="underline">{l("CGU", "AV")}</Link>.</span>
        </label>

        {error && <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={pending || !accept} className="mt-5 w-full sm:w-auto bg-brand hover:bg-brand-dark text-[#101F43] font-display font-black uppercase text-[13px] tracking-wide px-8 py-3.5 rounded-xl transition disabled:opacity-50">
          {pending ? "…" : l(`Confirmer ma commande — ${eur(q.totalHtCents)} HTVA`, `Mijn bestelling bevestigen — ${eur(q.totalHtCents)} excl. btw`)}
        </button>
      </section>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-bold text-ink-500 mb-1">{label}</label>{children}</div>;
}
