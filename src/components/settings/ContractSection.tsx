"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useL, useLang } from "@/lib/i18n/context";
import { formatDay } from "@/lib/billing/contract";
import { requestCancellation, withdrawCancellation } from "@/app/(dashboard)/dashboard/settings/actions";
import type { BillingView } from "./SettingsPage";

const EVENT_LABELS: Record<string, { fr: string; nl: string }> = {
  subscribed: { fr: "Abonnement activé", nl: "Abonnement geactiveerd" },
  plan_changed: { fr: "Formule modifiée", nl: "Formule gewijzigd" },
  cancellation_requested: { fr: "Demande de résiliation enregistrée", nl: "Opzegging geregistreerd" },
  cancellation_withdrawn: { fr: "Demande de résiliation annulée", nl: "Opzegging geannuleerd" },
  ended: { fr: "Abonnement terminé", nl: "Abonnement beëindigd" },
  email_subscribed: { fr: "E-mail de confirmation envoyé", nl: "Bevestigingsmail verzonden" },
  email_renewal_reminder: { fr: "Rappel d'échéance envoyé", nl: "Herinnering vervaldatum verzonden" },
  email_cancel_confirmation: { fr: "E-mail de résiliation envoyé", nl: "Opzeggingsmail verzonden" },
  email_ended: { fr: "E-mail de fin envoyé", nl: "Eindemail verzonden" },
};

export default function ContractSection({ billing, plan, priceCents, isAdmin }: { billing: BillingView; plan: string; priceCents: number | null; isAdmin: boolean }) {
  const l = useL();
  const lang = useLang();
  const locale = lang === "nl" ? "nl-BE" : "fr-BE";
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const c = billing.contract;
  if (!c) return null;
  const day = (d: string) => formatDay(d, locale);
  const eur = (cents: number) => `${(cents / 100).toLocaleString(locale)} € ${l("HTVA/mois", "excl. btw/maand")}`;
  const row = "flex justify-between gap-4 py-2 border-b border-[#F1F5F9] last:border-0 text-sm";

  function cancel() {
    setMsg(null);
    start(async () => {
      const r = await requestCancellation();
      setConfirming(false);
      if (r.ok) {
        setMsg(r.noticeRespected
          ? l(`Demande enregistrée. Fin du contrat le ${day(r.lastDay)}. Un e-mail de confirmation vous a été envoyé.`, `Aanvraag geregistreerd. Einde van het contract op ${day(r.lastDay)}. Een bevestigingsmail is verzonden.`)
          : l(`Demande enregistrée, mais elle est intervenue moins de 30 jours avant l'échéance : fin du contrat le ${day(r.lastDay)}. Notre équipe l'examine et vous contactera si nécessaire.`, `Aanvraag geregistreerd, maar minder dan 30 dagen voor de vervaldatum: einde van het contract op ${day(r.lastDay)}. Ons team bekijkt dit en neemt zo nodig contact op.`));
        router.refresh();
      } else setMsg(r.error);
    });
  }
  function withdraw() {
    setMsg(null);
    start(async () => {
      const r = await withdrawCancellation();
      setMsg(r.ok ? l("Demande de résiliation annulée.", "Opzegging geannuleerd.") : r.error ?? "");
      if (r.ok) router.refresh();
    });
  }

  const cancel_ = c.cancel;
  return (
    <>
      <div className="bg-white rounded-xl border border-ink-100 p-6" data-testid="mon-abonnement">
        <h3 className="text-sm font-semibold text-ink mb-3">{l("Mon abonnement", "Mijn abonnement")}</h3>
        <div>
          <div className={row}><span className="text-ink-500">{l("Offre souscrite", "Gekozen formule")}</span><strong>{plan === "agency" ? l("Agence", "Kantoor") : "Pro"}</strong></div>
          {priceCents !== null && <div className={row}><span className="text-ink-500">{l("Prix mensuel", "Maandprijs")}</span><strong>{eur(priceCents)}</strong></div>}
          <div className={row}><span className="text-ink-500">{l("Début du contrat", "Start van het contract")}</span><strong>{day(c.startDay)}</strong></div>
          <div className={row}><span className="text-ink-500">{l("Fin de l'engagement initial (12 mois)", "Einde van de initiële verbintenis (12 maanden)")}</span><strong>{day(c.endDay)}</strong></div>
          <div className={row}><span className="text-ink-500">{l("Date limite de non-reconduction", "Uiterste datum niet-verlenging")}</span><strong>{day(c.noticeDeadlineDay)}</strong></div>
          {c.setupFee && (
            <div className={row}>
              <span className="text-ink-500">{l("Frais de mise en service (unique)", "Opstartkosten (eenmalig)")}</span>
              <strong>
                {(c.setupFee.cents / 100).toLocaleString(locale)} € {l("HTVA", "excl. btw")}
                {" — "}
                {c.setupFee.status === "paid" ? l("payés", "betaald") : c.setupFee.status === "invoiced" ? l("facturés", "gefactureerd") : c.setupFee.status === "waived" ? l("offerts", "kwijtgescholden") : l("à facturer", "te factureren")}
              </strong>
            </div>
          )}
          {c.nextBillingDay && <div className={row}><span className="text-ink-500">{l("Prochaine échéance de facturation", "Volgende factuurdatum")}</span><strong>{day(c.nextBillingDay)}</strong></div>}
          <div className={row}>
            <span className="text-ink-500">{l("Statut", "Status")}</span>
            <strong>
              {cancel_?.effective
                ? l(`Résiliation demandée — fin le ${day(cancel_.lastDay)}`, `Opzegging aangevraagd — einde op ${day(cancel_.lastDay)}`)
                : c.phase === "initial" ? l("Engagement initial en cours", "Initiële verbintenis loopt") : l("Durée indéterminée, facturation mensuelle", "Onbepaalde duur, maandelijkse facturatie")}
            </strong>
          </div>
        </div>
        {c.phase === "initial" && (
          <p className="text-sm text-ink mt-3 font-medium" data-testid="commitment-sentence">
            {l(`Votre engagement initial se termine le ${day(c.endDay)}. Pour résilier à cette échéance, votre demande doit nous parvenir au plus tard le ${day(c.noticeDeadlineDay)}.`,
               `Uw initiële verbintenis eindigt op ${day(c.endDay)}. Om op deze vervaldatum op te zeggen, moet uw aanvraag ons uiterlijk op ${day(c.noticeDeadlineDay)} bereiken.`)}
          </p>
        )}
        {c.phase === "initial" && !cancel_ && (
          <p className="text-xs text-ink-400 mt-3">
            {l(`À l'issue de l'engagement, l'abonnement continue à durée indéterminée (${eur(c.priceAfterCents)}), résiliable avec 30 jours de préavis. Pour ne pas poursuivre, demandez la non-reconduction avant le ${day(c.noticeDeadlineDay)}.`,
               `Na de verbintenis loopt het abonnement voor onbepaalde duur door (${eur(c.priceAfterCents)}), opzegbaar met 30 dagen opzegtermijn. Vraag de niet-verlenging aan vóór ${day(c.noticeDeadlineDay)}.`)}
          </p>
        )}
        {c.termsVersion && <p className="text-[11px] text-ink-300 mt-2">{l("Conditions acceptées : version", "Aanvaarde voorwaarden: versie")} {c.termsVersion}</p>}
      </div>

      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <h3 className="text-sm font-semibold text-ink mb-1">{l("Résiliation", "Opzegging")}</h3>
        <p className="text-sm text-ink-500 mb-3">
          {c.phase === "initial"
            ? l("Pendant l'engagement initial, vous pouvez demander la non-reconduction : le contrat prend fin à l'échéance si la demande est faite au moins 30 jours avant. Aucune nouvelle période annuelle n'est imposée.",
                "Tijdens de initiële verbintenis kunt u de niet-verlenging aanvragen: het contract eindigt op de vervaldatum als de aanvraag minstens 30 dagen vooraf gebeurt. Er wordt geen nieuwe jaarperiode opgelegd.")
            : l("Vous pouvez résilier avec un préavis de 30 jours. Aucune période postérieure à la date de fin n'est facturée.",
                "U kunt opzeggen met 30 dagen opzegtermijn. Geen enkele periode na de einddatum wordt gefactureerd.")}
        </p>
        {!isAdmin ? (
          <p className="text-xs text-ink-400">{l("Seul un administrateur peut demander la résiliation.", "Enkel een beheerder kan de opzegging aanvragen.")}</p>
        ) : cancel_?.effective ? (
          <button onClick={withdraw} disabled={pending} className="text-sm text-brand-dark font-semibold hover:underline disabled:opacity-60">
            {l("Annuler ma demande de résiliation", "Mijn opzegging annuleren")}
          </button>
        ) : confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink">{l("Confirmer la demande de résiliation ?", "Opzegging bevestigen?")}</span>
            <button onClick={cancel} disabled={pending} className="text-sm bg-red-600 text-white font-bold px-4 py-1.5 rounded-lg disabled:opacity-60">{pending ? "…" : l("Oui, résilier", "Ja, opzeggen")}</button>
            <button onClick={() => setConfirming(false)} className="text-sm text-ink-500 hover:underline">{l("Non", "Nee")}</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="text-sm text-red-500 hover:text-red-700 hover:underline transition">{l("Demander la résiliation", "Opzegging aanvragen")}</button>
        )}
        {msg && <p className="text-sm text-ink-500 mt-3" role="status">{msg}</p>}
        <p className="text-[11px] text-ink-300 mt-3">
          {l("Une résiliation anticipée (avant l'échéance, hors non-reconduction) ou une situation particulière : écrivez-nous à hello@wolko.be.", "Vroegtijdige opzegging (vóór de vervaldatum, buiten niet-verlenging) of een bijzondere situatie: schrijf ons op hello@wolko.be.")}
        </p>
      </div>

      {billing.history.length > 0 && (
        <div className="bg-white rounded-xl border border-ink-100 p-6">
          <h3 className="text-sm font-semibold text-ink mb-3">{l("Historique", "Historiek")}</h3>
          <ul className="space-y-1.5">
            {billing.history.map((h) => (
              <li key={h.id} className="flex justify-between gap-4 text-xs text-ink-500">
                <span>{EVENT_LABELS[h.type] ? l(EVENT_LABELS[h.type].fr, EVENT_LABELS[h.type].nl) : h.type}</span>
                <span className="text-ink-300 shrink-0">{new Date(h.at).toLocaleString(locale, { timeZone: "Europe/Brussels", dateStyle: "medium", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
