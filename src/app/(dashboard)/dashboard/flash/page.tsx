import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getL, getLang } from "@/lib/i18n/server";
import { formatEuro, daysLeft, CREDIT_LABEL, ORDER_LABEL, FLASH_DAYS, type CreditStatus, type OrderStatus } from "@/lib/flash/pricing";
import { formatDay, brusselsDay } from "@/lib/billing/contract";
import PublishCreditForm from "@/components/flash/PublishCreditForm";

const STATUS_CLS: Record<CreditStatus, string> = {
  pending: "bg-amber-100 text-amber-700", available: "bg-blue-100 text-blue-700", active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-600", expired: "bg-gray-100 text-gray-600", lapsed: "bg-gray-100 text-gray-600", void: "bg-gray-100 text-gray-500",
};

export default async function FlashPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  const sp = await searchParams;
  const l = await getL();
  const lang = await getLang();
  const locale = lang === "nl" ? "nl-BE" : "fr-BE";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");
  const orgId = profile.organization_id as string;

  const [{ data: orders, error: oErr }, { data: credits }, { data: drafts }] = await Promise.all([
    supabase.from("flash_orders").select("*").eq("organization_id", orgId).order("ordered_at", { ascending: false }),
    supabase.from("flash_credits").select("*").eq("organization_id", orgId).order("seq", { ascending: true }),
    supabase.from("job_offers").select("id, title").eq("organization_id", orgId).eq("status", "draft").order("created_at", { ascending: false }),
  ]);

  const offerIds = (credits ?? []).map((c) => c.job_offer_id as string | null).filter(Boolean) as string[];
  const { data: offers } = offerIds.length ? await supabase.from("job_offers").select("id, title").in("id", offerIds) : { data: [] as { id: string; title: string }[] };
  const titles = new Map((offers ?? []).map((o) => [o.id as string, o.title as string]));
  const counts = new Map<string, number>();
  if (offerIds.length) {
    const { data: apps } = await supabase.from("applications").select("job_offer_id").in("job_offer_id", offerIds);
    for (const a of apps ?? []) counts.set(a.job_offer_id as string, (counts.get(a.job_offer_id as string) ?? 0) + 1);
  }
  const liveTaken = new Set((credits ?? []).filter((c) => ["pending", "available", "active", "suspended"].includes(c.status)).map((c) => c.job_offer_id as string));
  const freeDrafts = (drafts ?? []).filter((d) => !liveTaken.has(d.id as string)).map((d) => ({ id: d.id as string, title: d.title as string }));

  const now = new Date();
  const list = credits ?? [];
  const n = (s: CreditStatus[]) => list.filter((c) => s.includes(c.status as CreditStatus)).length;
  const day = (iso: string | null) => (iso ? formatDay(brusselsDay(new Date(iso)), locale) : "—");
  const eur = (c: number) => formatEuro(c, locale);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#101F43]">WOLKO Flash</h1>
          <p className="text-sm text-ink-500 mt-0.5">{l("Vos annonces ponctuelles, sans abonnement.", "Uw losse advertenties, zonder abonnement.")}</p>
        </div>
        <Link href="/dashboard/flash/commander" className="bg-brand hover:bg-brand-dark text-[#101F43] font-display font-black uppercase text-[12px] tracking-wide px-5 py-3 rounded-xl">
          {l("Publier une annonce", "Een advertentie publiceren")}
        </Link>
      </div>

      {sp.commande === "ok" && (
        <p className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3" role="status">
          {l("Commande enregistrée. Vous recevez un e-mail de confirmation ; la facture suit. Vos annonces sont activées après confirmation du paiement.", "Bestelling geregistreerd. U ontvangt een bevestigingsmail; de factuur volgt. Uw advertenties worden geactiveerd na bevestiging van de betaling.")}
        </p>
      )}
      {oErr && <p className="text-sm text-ink-500">{l("Le service Flash n'est pas encore activé sur ce compte.", "De Flash-dienst is nog niet geactiveerd op dit account.")}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="flash-tiles">
        {[
          [l("Annonces achetées", "Gekochte advertenties"), n(["pending", "available", "active", "suspended", "expired", "lapsed"])],
          [l("À activer", "Te activeren"), n(["available"])],
          [l("Actives", "Actief"), n(["active", "suspended"])],
          [l("Expirées", "Verlopen"), n(["expired", "lapsed"])],
        ].map(([label, v]) => (
          <div key={label as string} className="bg-white rounded-xl border border-ink-100 p-4">
            <p className="text-2xl font-black text-[#101F43]">{v as number}</p>
            <p className="text-xs text-ink-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {list.filter((c) => c.status !== "void").map((c) => {
          const st = c.status as CreditStatus;
          const title = c.job_offer_id ? titles.get(c.job_offer_id as string) : null;
          const left = daysLeft(c.expires_at as string | null, now);
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-ink-100 p-5" data-testid="flash-credit">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-ink-300">{l("Votre annonce WOLKO Flash", "Uw WOLKO Flash-advertentie")} · #{c.seq}</p>
                  <p className="font-bold text-[#101F43] text-lg truncate">{title ?? l("Annonce à rattacher", "Nog te koppelen advertentie")}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLS[st]}`}>{l(CREDIT_LABEL[st].fr, CREDIT_LABEL[st].nl)}</span>
              </div>

              {(st === "active" || st === "suspended" || st === "expired") && (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                  <div><dt className="text-xs text-ink-400">{l("Publiée le", "Gepubliceerd op")}</dt><dd className="font-semibold">{day(c.published_at as string | null)}</dd></div>
                  <div><dt className="text-xs text-ink-400">{l("Expire le", "Verloopt op")}</dt><dd className="font-semibold">{day(c.expires_at as string | null)}</dd></div>
                  <div><dt className="text-xs text-ink-400">{l("Jours restants", "Resterende dagen")}</dt><dd className="font-semibold">{st === "active" ? `${left} / ${FLASH_DAYS}` : "—"}</dd></div>
                  <div><dt className="text-xs text-ink-400">{l("Candidatures reçues", "Ontvangen sollicitaties")}</dt><dd className="font-semibold">{counts.get(c.job_offer_id as string) ?? 0}</dd></div>
                </dl>
              )}
              {st === "pending" && <p className="text-sm text-ink-500 mt-3">{l("Votre annonce sera activable dès la confirmation du paiement de la commande.", "Uw advertentie wordt activeerbaar zodra de betaling bevestigd is.")}</p>}
              {st === "suspended" && <p className="text-sm text-red-600 mt-3">{l("Cette annonce est suspendue. Écrivez-nous à hello@wolko.be.", "Deze advertentie is opgeschort. Schrijf ons op hello@wolko.be.")}</p>}
              {st === "available" && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-ink-500">{l(`À activer avant le ${day(c.activate_before as string)}. Les ${FLASH_DAYS} jours démarrent à la publication.`, `Te activeren vóór ${day(c.activate_before as string)}. De ${FLASH_DAYS} dagen starten bij publicatie.`)}</p>
                  <PublishCreditForm creditId={c.id as string} drafts={freeDrafts} />
                </div>
              )}
              {st === "lapsed" && <p className="text-sm text-ink-500 mt-3">{l("Le délai de 90 jours est dépassé : cette annonce n'a pas été activée.", "De termijn van 90 dagen is verstreken: deze advertentie werd niet geactiveerd.")}</p>}

              <div className="flex flex-wrap gap-2 mt-4">
                {c.job_offer_id && ["active", "suspended", "expired"].includes(st) && (
                  <Link href={`/dashboard/offres/${c.job_offer_id}/candidatures`} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#101F43] text-white">{l("Voir les candidatures", "Sollicitaties bekijken")}</Link>
                )}
                {st === "active" && c.job_offer_id && <Link href={`/jobs/${c.job_offer_id}`} className="text-xs font-bold px-3 py-2 rounded-lg border border-ink-100 text-ink-500">{l("Voir l'annonce en ligne", "Advertentie online bekijken")}</Link>}
                {(st === "active" || st === "expired") && <Link href={`/dashboard/flash/commander${c.job_offer_id ? `?offre=${c.job_offer_id}` : ""}`} className="text-xs font-bold px-3 py-2 rounded-lg border border-ink-100 text-ink-500">{l("Renouveler pour 30 jours", "Verlengen voor 30 dagen")}</Link>}
                {["active", "expired"].includes(st) && <Link href="/dashboard/settings?tab=abonnement" className="text-xs font-bold px-3 py-2 rounded-lg bg-brand text-[#101F43]">{l("Passer à WOLKO Pro", "Overstappen naar WOLKO Pro")}</Link>}
              </div>
              {st === "active" && <p className="text-[11px] text-ink-300 mt-2">{l("L'intitulé d'une annonce publiée ne peut plus être modifié (une annonce = un recrutement). Le compteur de 30 jours ne redémarre jamais.", "De titel van een gepubliceerde advertentie kan niet meer gewijzigd worden (één advertentie = één aanwerving). De teller van 30 dagen herstart nooit.")}</p>}
            </div>
          );
        })}
        {list.length === 0 && !oErr && (
          <div className="bg-white rounded-2xl border border-dashed border-ink-100 p-8 text-center text-sm text-ink-500">
            {l("Aucune annonce Flash pour l'instant.", "Nog geen Flash-advertenties.")} <Link href="/dashboard/flash/commander" className="text-brand-dark font-bold underline">{l("Publier une annonce", "Een advertentie publiceren")}</Link>
          </div>
        )}
      </div>

      {(orders ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          <h2 className="text-sm font-semibold text-ink px-5 py-3 border-b border-ink-100">{l("Mes commandes", "Mijn bestellingen")}</h2>
          <div className="divide-y divide-ink-100">
            {(orders ?? []).map((o) => (
              <div key={o.id} className="px-5 py-4 grid sm:grid-cols-[1fr_auto] gap-2 text-sm" data-testid="flash-order">
                <div>
                  <p className="font-bold text-[#101F43]">FL-{String(o.order_number).padStart(5, "0")} · {o.quantity} {l(o.quantity > 1 ? "annonces" : "annonce", o.quantity > 1 ? "advertenties" : "advertentie")}</p>
                  <p className="text-xs text-ink-500">{day(o.ordered_at as string)} · {l(ORDER_LABEL[o.status as OrderStatus].fr, ORDER_LABEL[o.status as OrderStatus].nl)}</p>
                  <p className="text-xs text-ink-400">
                    {o.invoice_status === "issued" ? l(`Facture ${o.invoice_ref} émise`, `Factuur ${o.invoice_ref} uitgegeven`) : l("Facture à émettre", "Factuur nog uit te geven")} · {o.payment_status === "confirmed" ? l("Paiement confirmé", "Betaling bevestigd") : l("Paiement en attente", "Betaling in afwachting")}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-bold">{eur(o.total_ht_cents as number)} <span className="text-xs font-normal text-ink-400">HTVA</span></p>
                  {(o.discount_cents as number) > 0 && <p className="text-xs text-emerald-700">{l("Remise Flash Duo", "Flash Duo-korting")} {eur(-(o.discount_cents as number))}</p>}
                  <p className="text-xs text-ink-400">{eur(o.total_ttc_cents as number)} TVAC</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
