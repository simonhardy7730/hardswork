import Link from "next/link";
import { notFound } from "next/navigation";
import { adminClient } from "@/lib/billing/lifecycle";
import { getPlatformAdmin, can } from "@/lib/admin/platform";
import { formatEuro, ORDER_LABEL, CREDIT_LABEL, type OrderStatus, type CreditStatus } from "@/lib/flash/pricing";
import { formatDay, brusselsDay } from "@/lib/billing/contract";
import FlashAdminActions from "@/components/admin/FlashAdminActions";

export const dynamic = "force-dynamic";
const d = (iso: string | null) => (iso ? `${formatDay(brusselsDay(new Date(iso)))} ${new Date(iso).toLocaleTimeString("fr-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" })}` : "—");

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin = await getPlatformAdmin();
  if (!admin) notFound();
  const db = adminClient();
  const { data: o } = await db.from("flash_orders").select("*, organizations(name, email)").eq("id", id).maybeSingle();
  if (!o) notFound();
  const [{ data: credits }, { data: events }] = await Promise.all([
    db.from("flash_credits").select("*").eq("order_id", id).order("seq"),
    db.from("flash_events").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(200),
  ]);
  const offerIds = (credits ?? []).map((c) => c.job_offer_id as string | null).filter(Boolean) as string[];
  const { data: offers } = offerIds.length ? await db.from("job_offers").select("id, title").in("id", offerIds) : { data: [] as { id: string; title: string }[] };
  const titles = new Map((offers ?? []).map((x) => [x.id as string, x.title as string]));
  const { data: apps } = offerIds.length ? await db.from("applications").select("job_offer_id").in("job_offer_id", offerIds) : { data: [] as { job_offer_id: string }[] };
  const nApps = (jid: string) => (apps ?? []).filter((a) => a.job_offer_id === jid).length;
  const org = o.organizations as { name?: string; email?: string } | null;
  const b = (o.billing ?? {}) as Record<string, string>;
  const row = "flex justify-between gap-4 py-1.5 text-sm border-b border-ink-100 last:border-0";

  return (
    <div className="space-y-5">
      <Link href="/admin/flash" className="text-xs text-brand-dark underline">← Toutes les commandes</Link>
      <h1 className="text-xl font-bold text-[#101F43]">FL-{String(o.order_number).padStart(5, "0")} · {org?.name}</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-ink-100 p-5">
          <h2 className="text-sm font-semibold mb-2">Commande</h2>
          <div className={row}><span>Statut</span><b>{ORDER_LABEL[o.status as OrderStatus]?.fr}</b></div>
          <div className={row}><span>Annonces</span><b>{o.quantity}</b></div>
          <div className={row}><span>Prix unitaire accepté</span><b>{formatEuro(o.unit_price_cents)}</b></div>
          <div className={row}><span>Remise Duo</span><b>{formatEuro(-o.discount_cents)}</b></div>
          <div className={row}><span>Total HTVA</span><b>{formatEuro(o.total_ht_cents)}</b></div>
          <div className={row}><span>TVA ({o.vat_rate} %)</span><b>{formatEuro(o.vat_cents)}</b></div>
          <div className={row}><span>Total TVAC</span><b>{formatEuro(o.total_ttc_cents)}</b></div>
          <div className={row}><span>Commandée le</span><b>{d(o.ordered_at)}</b></div>
          <div className={row}><span>Conditions acceptées</span><b>{o.terms_version} · {d(o.consent_at)}</b></div>
          <div className={row}><span>Facture</span><b>{o.invoice_status === "issued" ? `${o.invoice_ref} · ${d(o.invoice_issued_at)}` : "À émettre"}</b></div>
          <div className={row}><span>Paiement</span><b>{o.payment_status === "confirmed" ? `Confirmé · ${d(o.paid_at)}` : "En attente"}</b></div>
          {o.authorized_reason && <div className={row}><span>Publication avant paiement</span><b>{o.authorized_reason}</b></div>}
          <div className={row}><span>Conversion vers Pro</span><b>{o.converted_at ? d(o.converted_at) : "—"}</b></div>
        </section>
        <section className="bg-white rounded-xl border border-ink-100 p-5">
          <h2 className="text-sm font-semibold mb-2">Facturation (à saisir dans le logiciel de facturation / Peppol)</h2>
          {["company_name", "vat_number", "address", "postal_code", "city", "email", "contact", "reference"].map((k) => (
            <div key={k} className={row}><span>{k}</span><b className="text-right">{b[k] || "—"}</b></div>
          ))}
          <p className="text-[11px] text-ink-400 mt-3">Aucun système de facturation n&apos;est connecté : la facture est émise dans votre logiciel externe (facturation électronique structurée Peppol selon vos obligations), puis son numéro est enregistré ici.</p>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-ink-100 p-5">
        <h2 className="text-sm font-semibold mb-2">Annonces</h2>
        <div className="divide-y divide-ink-100 text-sm">
          {(credits ?? []).map((c) => (
            <div key={c.id} className="py-2 grid sm:grid-cols-5 gap-2">
              <span>#{c.seq} {c.job_offer_id ? titles.get(c.job_offer_id as string) ?? "" : "(non rattachée)"}</span>
              <span>{CREDIT_LABEL[c.status as CreditStatus]?.fr}</span>
              <span>Publiée : {d(c.published_at)}</span>
              <span>Expire : {d(c.expires_at)}</span>
              <span>{c.job_offer_id ? `${nApps(c.job_offer_id as string)} candidature(s)` : `À activer avant ${d(c.activate_before)}`}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-ink-100 p-5">
        <h2 className="text-sm font-semibold mb-3">Actions</h2>
        <FlashAdminActions
          orderId={o.id} status={o.status} invoiceIssued={o.invoice_status === "issued"} paymentConfirmed={o.payment_status === "confirmed"}
          credits={(credits ?? []).map((c) => ({ id: c.id, seq: c.seq, status: c.status }))}
          cap={{ markInvoice: can(admin.role, "mark_invoice"), confirmPayment: can(admin.role, "confirm_payment"), authorize: can(admin.role, "authorize_deferred"), cancel: can(admin.role, "cancel_order"), suspend: can(admin.role, "suspend") }}
        />
      </section>

      <section className="bg-white rounded-xl border border-ink-100 p-5">
        <h2 className="text-sm font-semibold mb-2">Historique (actions sensibles journalisées)</h2>
        <ul className="text-xs space-y-1.5">
          {(events ?? []).map((e) => (
            <li key={e.id} className="flex flex-wrap gap-x-3"><span className="text-ink-400 w-40 shrink-0">{d(e.created_at)}</span><b>{e.event_type}</b><span className="text-ink-500">{e.actor_kind}{e.actor_user_id ? ` · ${String(e.actor_user_id).slice(0, 8)}` : ""}</span><span className="text-ink-400 break-all">{JSON.stringify(e.details)}</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
