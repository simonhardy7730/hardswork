import Link from "next/link";
import { Check, ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getDict } from "@/lib/i18n/server";
import { CONTENT, type Bi } from "@/lib/billing/pricing-content";
import { flashQuote, formatEuro } from "@/lib/flash/pricing";
import { NETWORK_FROM_EUR, publicPrice, isLaunchOfferActive, type BillablePlan } from "@/lib/billing/pricing";

// Les prix dépendent de la date : jamais de page figée, toujours l'horloge du serveur.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { lang } = await getDict();
  return lang === "nl"
    ? { title: "Tarieven — Wolko", description: "Lanceringsaanbod tot 31 december 2026 en 7 dagen gratis proefperiode." }
    : { title: "Tarifs — Wolko", description: "Offre de lancement jusqu'au 31 décembre 2026 et 7 jours d'essai gratuit." };
}

const MAIL = "hello@wolko.be";
const mailto = (subject: string, body = "") =>
  `mailto:${MAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

export default async function TarifsPage() {
  const { lang } = await getDict();
  const now = new Date(); // horloge du serveur
  const launch = isLaunchOfferActive(now);
  const t = (x: Bi) => (lang === "nl" ? x.nl : x.fr);
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const C = CONTENT;
  const loc = lang === "nl" ? "nl-BE" : "fr-BE";
  const flash1 = flashQuote(1);
  const flash2 = flashQuote(2);

  const paid: { id: BillablePlan; featured: boolean }[] = [
    { id: "pro", featured: true },
    { id: "agency", featured: false },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />

      <div className="pt-[60px]">
        {/* ── BANDEAU OFFRE DE LANCEMENT (disparaît le 1er janvier 2027) ── */}
        {launch && (
          <div className="bg-brand text-[#101F43] text-center px-4 py-3" data-testid="launch-banner">
            <p className="font-display font-black uppercase text-[12px] sm:text-[13px] tracking-widest">{t(C.launchBanner.title)}</p>
            <p className="text-[12px] sm:text-[13px] font-medium mt-0.5">{t(C.launchBanner.text)}</p>
          </div>
        )}

        {/* ── HERO ── */}
        <div className="bg-[#101F43] pt-16 pb-24 text-center px-6">
          <h1
            className="font-display font-black text-white uppercase leading-[0.9] mb-5"
            style={{ fontSize: "clamp(2.3rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            {t(C.heroTitle)} <span className="text-brand">{t(C.heroTitleAccent)}</span>
            <br />{t(C.heroTitleEnd)}
          </h1>
          <p className="text-white/50 text-base max-w-lg mx-auto leading-relaxed">{t(C.heroText)}</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* ── ENCART ESSAI 7 JOURS ── */}
          <div
            className="-mt-14 mb-10 rounded-3xl bg-white border border-brand/40 shadow-xl shadow-[#101F43]/10 p-6 sm:p-8 grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center"
            data-testid="trial-card"
          >
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#101F43] bg-brand rounded-full px-3 py-1 mb-3">
                <Sparkles size={12} /> {l("Essai offert", "Gratis proef")}
              </p>
              <h2
                className="font-display font-black text-[#101F43] uppercase leading-[0.95] mb-3"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
              >
                {t(C.trial.title)}
              </h2>
              <p className="text-ink-500 text-sm leading-relaxed mb-4">{t(C.trial.text)}</p>
              <ul className="space-y-1.5">
                {C.trial.notes.map((n) => (
                  <li key={n.fr} className="flex items-start gap-2 text-[13px] text-ink-700">
                    <Check size={14} className="text-brand shrink-0 mt-0.5" strokeWidth={3} /> {t(n)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/recrute"
                className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-[#101F43] font-display font-black uppercase text-[13px] py-4 rounded-xl transition"
                style={{ letterSpacing: "0.05em" }}
              >
                {t(C.trial.primary)} <ArrowRight size={14} />
              </Link>
              <a
                href={mailto(l("Demande de démonstration WOLKO", "Aanvraag demo WOLKO"))}
                className="flex items-center justify-center gap-2 border border-[#101F43]/20 text-[#101F43] hover:border-brand font-display font-black uppercase text-[13px] py-4 rounded-xl transition"
                style={{ letterSpacing: "0.05em" }}
              >
                {t(C.trial.secondary)}
              </a>
            </div>
          </div>

          {/* ── WOLKO FLASH / FLASH DUO : recrutement ponctuel sans abonnement ── */}
          <div className="mb-10" data-testid="flash-section">
            <p className="font-display font-black text-[#101F43] uppercase text-[12px] tracking-widest mb-1">{l("Recrutement ponctuel — sans abonnement", "Eenmalige werving — zonder abonnement")}</p>
            <p className="text-ink-500 text-sm mb-5">{l("Un poste à pourvoir ? Publiez une annonce 30 jours, payez une seule fois sur facture.", "Een vacature? Publiceer 30 dagen, betaal eenmalig op factuur.")}</p>
            <div className="grid md:grid-cols-2 gap-5">
              <div data-testid="plan-flash" className="rounded-2xl bg-white border border-ink-100 p-6 flex flex-col">
                <p className="font-display font-black text-ink-500 uppercase text-[11px] tracking-widest mb-3 min-h-[28px]">WOLKO Flash</p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="font-display font-black text-[#101F43] leading-none whitespace-nowrap" style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>{formatEuro(flash1.totalHtCents, loc).replace(",00", "")}</span>
                  <span className="text-ink-500 text-sm mb-1.5">{l("HTVA · paiement unique", "excl. btw · eenmalig")}</span>
                </div>
                <p className="text-[12px] text-transparent select-none mb-1" aria-hidden>.</p>
                <ul className="space-y-2.5 mb-7 mt-3 flex-1">
                  {[l("1 annonce pendant 30 jours", "1 advertentie gedurende 30 dagen"), l("Gestion des candidatures", "Beheer van sollicitaties"), l("Sans abonnement", "Zonder abonnement"), l("Sans engagement", "Zonder verbintenis"), l("Sans renouvellement automatique", "Zonder automatische verlenging")].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-700"><Check size={14} className="text-brand shrink-0 mt-0.5" strokeWidth={3} /> {f}</li>
                  ))}
                </ul>
                <Link href="/login?next=/dashboard/flash/commander" className="flex items-center justify-center gap-2 bg-[#101F43] hover:bg-[#1C3058] text-white font-display font-black uppercase text-[13px] py-3.5 rounded-xl transition w-full text-center" style={{ letterSpacing: "0.05em" }}>
                  {l("Publier une annonce", "Een advertentie publiceren")} <ArrowRight size={13} />
                </Link>
              </div>

              <div data-testid="plan-flash-duo" className="rounded-2xl overflow-hidden flex flex-col bg-white border border-brand shadow-xl shadow-brand/15">
                <div className="bg-brand text-[#101F43] text-[10px] font-black uppercase tracking-widest text-center py-2.5">{l("Flash Duo — 2e annonce à −50 %", "Flash Duo — 2e advertentie aan −50 %")}</div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="font-display font-black text-ink-500 uppercase text-[11px] tracking-widest mb-3 min-h-[28px]">WOLKO Flash Duo</p>
                  <p className="text-ink-300 text-sm"><span className="line-through decoration-2" aria-label={l("Prix normal", "Normale prijs")}>{formatEuro(flash2.grossCents, loc).replace(",00", "")}</span></p>
                  <div className="flex items-end gap-1.5 mb-1">
                    <span className="font-display font-black text-[#101F43] leading-none whitespace-nowrap" style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>{formatEuro(flash2.totalHtCents, loc)}</span>
                    <span className="text-ink-500 text-sm mb-1.5">{l("HTVA · paiement unique", "excl. btw · eenmalig")}</span>
                  </div>
                  <p className="text-[12px] font-bold text-[#B87C2A] mb-1">{l(`Économie : ${formatEuro(flash2.discountCents, loc)}`, `Besparing: ${formatEuro(flash2.discountCents, loc)}`)}</p>
                  <ul className="space-y-2.5 mb-7 mt-3 flex-1">
                    {[l("2 annonces pendant 30 jours chacune", "2 advertenties gedurende elk 30 dagen"), l(`1re annonce ${formatEuro(flash2.unitCents, loc).replace(",00", "")} · 2e annonce ${formatEuro(flash2.unitCents - flash2.discountCents, loc)} (−50 %)`, `1e advertentie ${formatEuro(flash2.unitCents, loc).replace(",00", "")} · 2e advertentie ${formatEuro(flash2.unitCents - flash2.discountCents, loc)} (−50 %)`), l("Sans abonnement, sans engagement annuel", "Zonder abonnement, zonder jaarverbintenis"), l("Sans renouvellement automatique", "Zonder automatische verlenging")].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-700"><Check size={14} className="text-brand shrink-0 mt-0.5" strokeWidth={3} /> {f}</li>
                    ))}
                  </ul>
                  <Link href="/login?next=/dashboard/flash/commander%3Fqty%3D2" className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-[#101F43] font-display font-black uppercase text-[13px] py-3.5 rounded-xl transition w-full text-center" style={{ letterSpacing: "0.05em" }}>
                    {l("Publier deux annonces", "Twee advertenties publiceren")} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
            <p className="text-[12.5px] text-ink-500 leading-relaxed mt-4" data-testid="flash-note">
              {l("Trois annonces ou plus : la réduction de 50 % s'applique uniquement à la deuxième annonce de la même commande ; les annonces supplémentaires sont facturées 149 € HTVA chacune. Paiement par virement sur facture, sans carte bancaire. Flash ne donne pas accès à la candidathèque. Tarifs HTVA.",
                 "Drie of meer advertenties: de korting van 50 % geldt enkel voor de tweede advertentie van dezelfde bestelling; bijkomende advertenties kosten 149 € excl. btw per stuk. Betaling per overschrijving op factuur, zonder bankkaart. Flash geeft geen toegang tot de kandidatendatabank. Prijzen excl. btw.")}
            </p>
          </div>

          {/* ── PLANS ── */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
            {paid.map(({ id, featured }) => {
              const P = C.plans[id];
              const price = publicPrice(id, now);
              return (
                <div
                  key={id}
                  data-testid={`plan-${id}`}
                  className={`rounded-2xl overflow-hidden flex flex-col bg-white border ${
                    featured ? "border-brand shadow-xl shadow-brand/15 lg:-translate-y-2" : "border-ink-100"
                  }`}
                >
                  {featured && (
                    <div className="bg-brand text-[#101F43] text-[10px] font-black uppercase tracking-widest text-center py-2.5">
                      ⭐ {t(C.labels.popular)}
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3 min-h-[42px]">
                      <p className="font-display font-black text-ink-500 uppercase text-[11px] tracking-widest">{t(P.name)}</p>
                      {price.discount !== null && (
                        <span className="shrink-0 bg-[#101F43] text-brand text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 text-center">
                          {t(C.labels.launchBadge(price.discount))}
                        </span>
                      )}
                    </div>

                    {price.strikethrough !== null && (
                      <p className="text-ink-300 text-sm" aria-label={t(C.labels.refPrice)}>
                        <span className="line-through decoration-2">{price.strikethrough} €</span>
                        <span className="text-[11px]"> {t(C.labels.perMonthHt)}</span>
                      </p>
                    )}
                    <div className="flex items-end gap-1.5 mb-1">
                      <span className="font-display font-black text-[#101F43] leading-none whitespace-nowrap" style={{ fontSize: "clamp(2.6rem, 5vw, 3.6rem)" }}>
                        {price.price} €
                      </span>
                      <span className="text-ink-500 text-sm mb-1.5">{t(C.labels.perMonthHt)}</span>
                    </div>
                    {price.launch ? (
                      <p className="text-[12px] font-bold text-[#B87C2A] mb-1">{t(C.labels.launchValid)}</p>
                    ) : (
                      <p className="text-[12px] text-transparent select-none mb-1" aria-hidden>.</p>
                    )}
                    <p className="text-ink-400 text-xs mb-5">{t(P.description)}</p>

                    <ul className="space-y-2.5 mb-7 flex-1">
                      {P.features.map((f) => (
                        <li key={f.fr} className="flex items-start gap-2 text-sm text-ink-700">
                          <Check size={14} className="text-brand shrink-0 mt-0.5" strokeWidth={3} /> {t(f)}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/recrute"
                      className={`flex items-center justify-center gap-2 font-display font-black uppercase text-[13px] py-3.5 rounded-xl transition w-full text-center ${
                        featured
                          ? "bg-brand hover:bg-brand-dark text-[#101F43]"
                          : "bg-[#101F43] hover:bg-[#1C3058] text-white"
                      }`}
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {t(P.cta)} <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Agence Réseau */}
            <div data-testid="plan-network" className="rounded-2xl overflow-hidden flex flex-col bg-[#101F43] border border-[#1C3058] md:col-span-2 lg:col-span-1">
              <div className="p-6 flex flex-col flex-1">
                <p className="font-display font-black text-brand uppercase text-[11px] tracking-widest mb-3 min-h-[42px]">
                  {t(C.plans.network.name)}
                </p>
                <p className="text-white/50 text-sm">{t(C.plans.network.priceLabel)}</p>
                <div className="mb-1">
                  <span className="font-display font-black text-white leading-none whitespace-nowrap" style={{ fontSize: "clamp(2.6rem, 5vw, 3.6rem)" }}>
                    {NETWORK_FROM_EUR} €
                  </span>
                </div>
                <p className="text-white/50 text-[12px] font-bold mb-1">{t(C.plans.network.priceNote)}</p>
                <p className="text-white/45 text-xs mb-5">{t(C.plans.network.description)}</p>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {C.plans.network.features.map((f) => (
                    <li key={f.fr} className="flex items-start gap-2 text-sm text-white/80">
                      <Check size={14} className="text-brand shrink-0 mt-0.5" strokeWidth={3} /> {t(f)}
                    </li>
                  ))}
                </ul>
                <a
                  href={mailto(l("Demande de devis — Agence Réseau WOLKO", "Offerteaanvraag — Netwerkkantoor WOLKO"))}
                  className="flex items-center justify-center gap-2 border border-white/25 hover:border-brand hover:text-brand text-white font-display font-black uppercase text-[13px] py-3.5 rounded-xl transition w-full"
                  style={{ letterSpacing: "0.05em" }}
                >
                  {t(C.plans.network.cta)} <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[13px] text-ink-500 leading-relaxed max-w-3xl mx-auto" data-testid="contract-note">{t(C.contractNote)}</p>

          {/* ── CONDITIONS ── */}
          <div className="mt-6 mb-14 rounded-2xl bg-white border border-ink-100 p-5 sm:p-6" data-testid="conditions">
            <p className="font-display font-black text-[#101F43] uppercase text-[12px] tracking-widest mb-3">{t(C.conditions.title)}</p>
            <ul className="space-y-1.5 text-[12.5px] text-ink-500 leading-relaxed list-disc pl-4">
              {(launch ? [...C.conditions.launch, ...C.conditions.common] : C.conditions.common).map((c) => (
                <li key={c.fr}>{t(c)}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="border-t border-ink-100 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="font-display font-black text-ink uppercase leading-none mb-10" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}>
              FAQ.
            </h2>
            <div className="divide-y divide-ink-100">
              {C.faqs.map(({ q, a }) => (
                <details key={q.fr} className="group">
                  <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none">
                    <span className="font-display font-black text-ink uppercase text-[13px] tracking-wide">{t(q)}</span>
                    <ChevronDown size={16} className="text-ink-300 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="pb-6 text-ink-500 text-sm leading-relaxed">{t(a)}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA FINAL ── */}
        <div className="bg-[#101F43] py-20 text-center px-6">
          <h2 className="font-display font-black text-white uppercase leading-[0.9] mb-7" style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}>
            {l("Prêt à renforcer", "Klaar om")} <span className="text-brand">{l("[vos équipes]", "[je teams]")}</span>{l("", " te versterken")}&nbsp;?
          </h2>
          <Link
            href="/recrute"
            className="inline-flex items-center gap-3 bg-brand hover:bg-brand-dark text-[#101F43] font-display font-black uppercase px-8 sm:px-10 py-4 rounded-xl transition text-[13px]"
            style={{ letterSpacing: "0.08em" }}
          >
            {t(C.trial.primary)}
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
