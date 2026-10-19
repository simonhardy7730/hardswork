"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmPayment, markInvoiceIssued, authorizeBeforePayment, cancelOrder, setSuspension } from "@/app/admin/flash/actions";

type Cap = { markInvoice: boolean; confirmPayment: boolean; authorize: boolean; cancel: boolean; suspend: boolean };
interface Props {
  orderId: string; status: string; invoiceIssued: boolean; paymentConfirmed: boolean;
  credits: { id: string; seq: number; status: string }[]; cap: Cap;
}
const btn = "text-xs font-bold px-3 py-2 rounded-lg border border-ink-100 hover:border-brand disabled:opacity-50";

export default function FlashAdminActions({ orderId, status, invoiceIssued, paymentConfirmed, credits, cap }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const open = status === "awaiting_payment" || status === "paid" || status === "authorized_deferred";

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setMsg(null);
    start(async () => { const r = await fn(); if (r.ok) router.refresh(); else setMsg(r.error ?? "Erreur"); });
  };

  return (
    <div className="space-y-4">
      {cap.markInvoice && !invoiceIssued && open && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="N° de facture (logiciel de facturation)" className="flex-1 px-3 py-2 text-sm border border-ink-100 rounded-lg" />
          <button className={btn} disabled={pending || !ref.trim()} onClick={() => run(() => markInvoiceIssued(orderId, ref))}>Marquer la facture émise</button>
        </div>
      )}
      {cap.confirmPayment && !paymentConfirmed && open && (
        <button className={`${btn} bg-emerald-600 text-white border-emerald-600`} disabled={pending}
          onClick={() => run(() => confirmPayment(orderId), "Confirmer que le PAIEMENT est bien reçu sur le compte bancaire ? Les annonces rattachées seront publiées.")}>
          Valider le paiement (rapprochement bancaire effectué)
        </button>
      )}
      {(cap.authorize || cap.cancel) && open && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (obligatoire pour ces actions)" className="flex-1 px-3 py-2 text-sm border border-ink-100 rounded-lg" />
          {cap.authorize && status === "awaiting_payment" && <button className={btn} disabled={pending || !reason.trim()} onClick={() => run(() => authorizeBeforePayment(orderId, reason), "Autoriser la publication AVANT paiement ?")}>Autoriser avant paiement</button>}
          {cap.cancel && <button className={`${btn} text-red-600`} disabled={pending || !reason.trim()} onClick={() => run(() => cancelOrder(orderId, reason, false), "Annuler cette commande ?")}>Annuler</button>}
          {cap.cancel && paymentConfirmed && <button className={`${btn} text-red-600`} disabled={pending || !reason.trim()} onClick={() => run(() => cancelOrder(orderId, reason, true), "Marquer la commande comme remboursée ? (le remboursement lui-même se fait hors plateforme)")}>Marquer remboursée</button>}
        </div>
      )}
      {cap.suspend && credits.filter((c) => c.status === "active" || c.status === "suspended").map((c) => (
        <div key={c.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <span className="text-sm">Annonce #{c.seq} ({c.status})</span>
          {c.status === "active"
            ? <button className={`${btn} text-red-600`} disabled={pending || !reason.trim()} onClick={() => run(() => setSuspension(c.id, true, reason), "Suspendre cette annonce ?")}>Suspendre (motif requis ci-dessus)</button>
            : <button className={btn} disabled={pending} onClick={() => run(() => setSuspension(c.id, false, ""))}>Lever la suspension</button>}
        </div>
      ))}
      {msg && <p role="alert" className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
