import Link from "next/link";
import { adminClient } from "@/lib/billing/lifecycle";
import { formatEuro, ORDER_LABEL, type OrderStatus } from "@/lib/flash/pricing";
import { formatDay, brusselsDay } from "@/lib/billing/contract";

export const dynamic = "force-dynamic";

const eur = (c: number) => formatEuro(c);
const NR = (n: number) => `FL-${String(n).padStart(5, "0")}`;

export default async function AdminFlashPage() {
  const db = adminClient();
  const [{ data: orders, error }, { data: credits }] = await Promise.all([
    db.from("flash_orders").select("*, organizations(name)").order("ordered_at", { ascending: false }).limit(500),
    db.from("flash_credits").select("order_id, status, job_offer_id"),
  ]);
  if (error) return <p className="text-sm text-ink-500">Module Flash non activé (migration 024 à exécuter).</p>;

  const live = (orders ?? []).filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const paid = live.filter((o) => o.payment_status === "confirmed");
  const sum = (rows: { [k: string]: unknown }[], k: string) => rows.reduce((a, r) => a + (r[k] as number), 0);
  const unused = (credits ?? []).filter((c) => c.status === "available").length;
  const stats: [string, string][] = [
    ["Commandes Flash (1 annonce)", String(live.filter((o) => o.quantity === 1).length)],
    ["Commandes Flash Duo (2+ annonces)", String(live.filter((o) => o.quantity >= 2).length)],
    ["Annonces vendues", String(sum(live, "quantity"))],
    ["CA HTVA facturé", eur(sum(live, "total_ht_cents"))],
    ["Remises Duo accordées", eur(sum(live, "discount_cents"))],
    ["Factures en attente de paiement", String(live.filter((o) => o.payment_status === "pending").length)],
    ["Paiements reçus", `${paid.length} · ${eur(sum(paid, "total_ht_cents"))}`],
    ["Crédits d'annonce inutilisés", String(unused)],
    ["Conversions vers Pro", String(live.filter((o) => o.converted_at).length)],
  ];

  const nbApps = new Map<string, number>();
  const offerIds = (credits ?? []).map((c) => c.job_offer_id as string | null).filter(Boolean) as string[];
  if (offerIds.length) {
    const { data: apps } = await db.from("applications").select("job_offer_id").in("job_offer_id", offerIds);
    const byOffer = new Map<string, number>();
    for (const a of apps ?? []) byOffer.set(a.job_offer_id as string, (byOffer.get(a.job_offer_id as string) ?? 0) + 1);
    for (const c of credits ?? []) if (c.job_offer_id) nbApps.set(c.order_id as string, (nbApps.get(c.order_id as string) ?? 0) + (byOffer.get(c.job_offer_id as string) ?? 0));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#101F43]">Achats WOLKO Flash</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" data-testid="admin-stats">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl border border-ink-100 p-4"><p className="text-xl font-black text-[#101F43]">{v}</p><p className="text-xs text-ink-500">{k}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-ink-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="text-xs text-ink-400 text-left"><tr>
            {["Commande", "Entreprise", "Annonces", "Montant HTVA", "Facturation", "Paiement", "Statut", "Candidatures", "Pro"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-ink-100">
            {(orders ?? []).map((o) => {
              const org = o.organizations as { name?: string } | { name?: string }[] | null;
              const name = (Array.isArray(org) ? org[0]?.name : org?.name) ?? "—";
              return (
                <tr key={o.id} className="hover:bg-[#FFFBF2]">
                  <td className="px-4 py-3 font-bold"><Link href={`/admin/flash/${o.id}`} className="text-brand-dark underline">{NR(o.order_number)}</Link><div className="text-[11px] font-normal text-ink-400">{formatDay(brusselsDay(new Date(o.ordered_at)))}</div></td>
                  <td className="px-4 py-3">{name}</td>
                  <td className="px-4 py-3">{o.quantity}{o.quantity >= 2 ? " (Duo)" : ""}</td>
                  <td className="px-4 py-3">{eur(o.total_ht_cents)}</td>
                  <td className="px-4 py-3">{o.invoice_status === "issued" ? `Émise ${o.invoice_ref ?? ""}` : "À émettre"}</td>
                  <td className="px-4 py-3">{o.payment_status === "confirmed" ? "Confirmé" : "En attente"}</td>
                  <td className="px-4 py-3">{ORDER_LABEL[o.status as OrderStatus]?.fr ?? o.status}</td>
                  <td className="px-4 py-3">{nbApps.get(o.id) ?? 0}</td>
                  <td className="px-4 py-3">{o.converted_at ? "Oui" : "—"}</td>
                </tr>
              );
            })}
            {(orders ?? []).length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-ink-400">Aucune commande.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
