import Link from "next/link";
import { Check, ArrowRight, ChevronDown } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getDict } from "@/lib/i18n/server";

export function generateMetadata() {
  const { lang } = getDict();
  return lang === "nl"
    ? { title: "Tarieven — Wolko", description: "Duidelijke wervingsplannen om de juiste profielen te vinden." }
    : { title: "Tarifs — Wolko", description: "Des plans de recrutement clairs pour trouver les bons profils." };
}

type L = (fr: string, nl: string) => string;

function makePlans(l: L) {
  return [
    {
      id: "starter",
      name: l("Gratuit", "Gratis"),
      price: "0",
      description: l("Pour tester la plateforme", "Om het platform uit te proberen"),
      cta: l("S'inscrire", "Registreren"),
      href: "/recrute",
      featured: false,
      features: [
        l("1 offre d'emploi active", "1 actieve vacature"),
        l("Profils candidats illimités", "Onbeperkt kandidaatprofielen"),
        l("Formulaire de candidature public", "Openbaar sollicitatieformulier"),
        l("Tableau de bord basique", "Basis-dashboard"),
      ],
      locked: [l("Contacts candidats masqués", "Contactgegevens van kandidaten verborgen")],
    },
    {
      id: "pro",
      name: "Pro",
      price: "89",
      description: l("Pour les PME qui recrutent en direct", "Voor kmo's die rechtstreeks werven"),
      cta: l("Choisir Pro", "Kies Pro"),
      href: "/recrute",
      featured: true,
      features: [
        l("Offres d'emploi illimitées", "Onbeperkt vacatures"),
        l("Coordonnées des candidats débloquées", "Contactgegevens van kandidaten ontgrendeld"),
        l("Candidathèque complète", "Volledige kandidatendatabank"),
      ],
      locked: [] as string[],
    },
    {
      id: "agency",
      name: l("Agence", "Kantoor"),
      price: "249",
      description: l("Pour les agences de recrutement", "Voor wervingskantoren"),
      cta: l("Nous contacter", "Neem contact op"),
      href: "mailto:hello@welko.be",
      featured: false,
      features: [
        l("Clients illimités", "Onbeperkt klanten"),
        l("Gestion d'intérim", "Interimbeheer"),
        l("Multi-sites", "Meerdere vestigingen"),
      ],
      locked: [] as string[],
    },
  ];
}

function makeFaqs(l: L) {
  return [
    {
      q: l("Puis-je changer de plan à tout moment ?", "Kan ik op elk moment van plan veranderen?"),
      a: l("Oui, sans engagement ni frais de résiliation. Votre abonnement reste actif jusqu'à la fin de la période payée.", "Ja, zonder verbintenis en zonder opzegkosten. Je abonnement blijft actief tot het einde van de betaalde periode."),
    },
    {
      q: l("Quels secteurs couvrez-vous ?", "Welke sectoren dekken jullie?"),
      a: l("Construction, logistique, transport, industrie, médical, sécurité, nettoyage, Horeca, Tech & IT — tous les métiers.", "Bouw, logistiek, transport, industrie, medisch, beveiliging, schoonmaak, horeca, tech & IT — alle beroepen."),
    },
    {
      q: l("Les candidats paient-ils quelque chose ?", "Betalen kandidaten iets?"),
      a: l("Non — Wolko est 100% gratuit pour les candidats. Ils créent leur profil et postulent aux offres.", "Nee — Wolko is 100% gratis voor kandidaten. Zij maken hun profiel aan en solliciteren op vacatures."),
    },
  ];
}

export default function TarifsPage() {
  const { lang } = getDict();
  const l: L = (fr, nl) => (lang === "nl" ? nl : fr);
  const PLANS = makePlans(l);
  const FAQS = makeFaqs(l);
  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />

      <div className="pt-[60px]">

        {/* ── HERO sombre ──────────────────────────────── */}
        <div className="bg-[#101F43] py-20 text-center px-6">
          <h1
            className="font-display font-black text-white uppercase leading-[0.9] mb-5"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            {l("Choisissez votre", "Kies je")} <span className="text-brand">{l("[plan]", "[plan]")}</span>
            <br />{l("de recrutement.", "voor werving.")}
          </h1>
          <p className="text-white/45 text-base max-w-lg mx-auto leading-relaxed">
            {l("Des outils simples et efficaces pour trouver les bons profils.", "Eenvoudige en efficiënte tools om de juiste profielen te vinden.")}
          </p>
        </div>

        {/* ── PLANS ────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border overflow-hidden flex flex-col ${
                  plan.featured
                    ? "border-brand shadow-xl shadow-brand/10"
                    : "border-ink-100 bg-white"
                }`}
              >
                {/* Badge featured */}
                {plan.featured && (
                  <div className="bg-brand text-white text-[10px] font-black uppercase tracking-widest text-center py-2.5">
                    ⭐ {l("Le plus populaire", "Meest gekozen")}
                  </div>
                )}

                <div className={`p-6 flex flex-col flex-1 ${plan.featured ? "bg-white" : ""}`}>
                  {/* Nom */}
                  <p className="font-display font-black text-ink-400 uppercase text-[11px] tracking-widest mb-3">
                    {plan.name}
                  </p>

                  {/* Prix */}
                  <div className="flex items-end gap-1 mb-1">
                    <span
                      className="font-display font-black text-ink leading-none"
                      style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)" }}
                    >
                      {plan.price}€
                    </span>
                    <span className="text-ink-400 text-sm mb-1.5">&nbsp;/{l("mois", "maand")}</span>
                  </div>
                  <p className="text-ink-400 text-xs mb-6">{plan.description}</p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                        <Check size={14} className="text-brand shrink-0 mt-0.5" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                    {plan.locked.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-300 line-through">
                        <Check size={14} className="text-ink-100 shrink-0 mt-0.5" strokeWidth={2} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={`flex items-center justify-center gap-2 font-display font-black uppercase text-[13px] py-3.5 rounded-xl transition w-full ${
                      plan.featured
                        ? "bg-brand hover:bg-brand-dark text-white"
                        : "border border-ink-200 text-ink hover:border-brand hover:text-brand"
                    }`}
                    style={{ letterSpacing: "0.05em" }}
                  >
                    {plan.cta}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Garanties */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "✅", label: l("Sans engagement", "Zonder verbintenis") },
              { icon: "🔒", label: l("Données protégées", "Beschermde gegevens") },
              { icon: "📞", label: l("Nous contacter", "Neem contact op") },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white border border-ink-100 rounded-xl p-3 text-center">
                <span className="text-xl">{icon}</span>
                <p className="text-xs font-bold text-ink mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ sur fond blanc ───────────────────────── */}
        <div className="border-t border-ink-100 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2
              className="font-display font-black text-ink uppercase leading-none mb-10"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}
            >
              FAQ.
            </h2>
            <div className="divide-y divide-ink-100">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex items-center justify-between gap-6 py-5 cursor-pointer list-none">
                    <span className="font-display font-black text-ink uppercase text-[13px] tracking-wide">
                      {q}
                    </span>
                    <ChevronDown
                      size={16}
                      className="text-ink-300 shrink-0 transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-6 text-ink-500 text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA FINAL sombre ─────────────────────────── */}
        <div className="bg-[#101F43] py-20 text-center px-6">
          <h2
            className="font-display font-black text-white uppercase leading-[0.9] mb-7"
            style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}
          >
            {l("Prêt à renforcer", "Klaar om")} <span className="text-brand">{l("[vos équipes]", "[je teams]")}</span>{l("", " te versterken")}&nbsp;?
          </h2>
          <Link
            href="/recrute"
            className="inline-flex items-center gap-3 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase px-10 py-4 rounded-xl transition text-[13px]"
            style={{ letterSpacing: "0.08em" }}
          >
            {l("Lancer mon premier recrutement", "Mijn eerste aanwerving starten")}
            <ArrowRight size={15} />
          </Link>
        </div>

      </div>
      <SiteFooter />
    </div>
  );
}
