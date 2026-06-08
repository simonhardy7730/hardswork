import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";

export const metadata = {
  title: "Tarifs — HardSwork",
  description: "Recrutez les meilleurs profils du terrain en Belgique. Plans Starter, Pro et Agence.",
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Gratuit",
    period: "",
    description: "Pour tester la plateforme",
    cta: "Commencer gratuitement",
    href: "/recrute",
    featured: false,
    features: [
      "1 offre d'emploi active",
      "Accès à la liste des candidats",
      "Formulaire de candidature public",
      "Tableau de bord basique",
    ],
    locked: [
      "Contacts candidats masqués",
      "Candidathèque illimitée",
      "Pipeline Kanban",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "89",
    period: "/ mois",
    description: "Pour les PME qui recrutent en direct",
    cta: "Démarrer l'essai gratuit",
    href: "/recrute",
    featured: true,
    features: [
      "Offres illimitées",
      "Contacts candidats débloqués",
      "Candidathèque complète",
      "Pipeline Kanban B2B",
      "Export CSV des candidatures",
      "Support prioritaire",
    ],
    locked: [],
  },
  {
    id: "agency",
    name: "Agence",
    price: "249",
    period: "/ mois",
    description: "Pour les agences de recrutement",
    cta: "Nous contacter",
    href: "mailto:hello@hardswork.be",
    featured: false,
    features: [
      "Multi-sites illimités",
      "Utilisateurs illimités",
      "Gestion d'intérim",
      "Sourcing illimité",
      "API access",
      "Account manager dédié",
      "Onboarding personnalisé",
    ],
    locked: [],
  },
];

const FAQS = [
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans engagement ni frais de résiliation. Votre abonnement reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "Y a-t-il un essai gratuit ?",
    a: "Oui — 30 jours gratuits sur le plan Pro, sans carte bancaire. Vous passez au plan Starter automatiquement si vous ne souhaitez pas continuer.",
  },
  {
    q: "Comment fonctionne le déverrouillage des contacts ?",
    a: "Avec un plan Pro ou Agence, vous accédez aux coordonnées complètes (téléphone, email, CV) de tous les candidats de votre base.",
  },
  {
    q: "Les candidats paient-ils quelque chose ?",
    a: "Non — HardSwork est 100% gratuit pour les candidats. Ils créent leur profil, postulent aux offres, et vous les contactez directement.",
  },
];

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      <SiteNav />

      <div className="pt-[60px]">
        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="bg-[#0F0E0D] py-16 text-center">
          <span className="inline-block text-[11px] font-black text-brand bg-brand/15 px-3 py-1.5 rounded-full uppercase tracking-widest mb-5">
            30 jours gratuits · Sans carte bancaire
          </span>
          <h1
            className="font-display font-black text-white uppercase leading-none mb-4"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", letterSpacing: "-0.02em" }}
          >
            Des tarifs{" "}
            <span className="text-brand">[clairs].</span>
          </h1>
          <p className="text-white/45 text-base max-w-lg mx-auto">
            Recrutez les meilleurs profils du terrain en Belgique.
            Payez uniquement ce dont vous avez besoin.
          </p>
        </div>

        {/* ── PLANS ────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border overflow-hidden flex flex-col ${
                  plan.featured
                    ? "border-brand shadow-xl shadow-brand/10 relative"
                    : "border-ink-100 bg-white"
                }`}
              >
                {plan.featured && (
                  <>
                    <div className="bg-brand text-white text-[10px] font-black uppercase tracking-widest text-center py-2">
                      ⭐ Le plus populaire
                    </div>
                    <div className="bg-white flex-1 flex flex-col" />
                  </>
                )}
                <div className={`p-6 flex flex-col flex-1 ${plan.featured ? "bg-white absolute inset-0 top-8 rounded-b-2xl" : ""}`}>
                  {/* Nom + prix */}
                  <div className="mb-5">
                    <p className="font-display font-black text-ink uppercase text-sm tracking-widest mb-2">
                      {plan.name}
                    </p>
                    <div className="flex items-end gap-1 mb-1">
                      {plan.price === "Gratuit" ? (
                        <span className="font-display font-black text-ink text-3xl">Gratuit</span>
                      ) : (
                        <>
                          <span className="font-display font-black text-ink text-4xl">{plan.price}€</span>
                          <span className="text-ink-500 text-sm mb-1">{plan.period}</span>
                        </>
                      )}
                    </div>
                    <p className="text-ink-500 text-xs">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                        <Check size={14} className="text-brand shrink-0 mt-0.5" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                    {plan.locked.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-300 line-through">
                        <Check size={14} className="text-ink-100 shrink-0 mt-0.5" strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={`flex items-center justify-center gap-2 font-display font-black uppercase text-sm py-3 rounded-xl transition w-full ${
                      plan.featured
                        ? "bg-brand hover:bg-brand-dark text-white"
                        : "border border-ink-200 text-ink hover:border-brand hover:text-brand"
                    }`}
                    style={{ letterSpacing: "0.05em" }}
                  >
                    {plan.cta}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ── Garanties ────────────────────────────────── */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "✅", label: "Sans engagement" },
              { icon: "🔒", label: "Données sécurisées" },
              { icon: "🇧🇪", label: "100% belge" },
              { icon: "📞", label: "Support humain" },
            ].map(({ icon, label }) => (
              <div key={label} className="bg-white border border-ink-100 rounded-xl p-3 text-center">
                <span className="text-xl">{icon}</span>
                <p className="text-xs font-bold text-ink mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* ── FAQ ──────────────────────────────────────── */}
          <div className="mt-14">
            <h2
              className="font-display font-black text-ink uppercase text-center mb-8"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}
            >
              Questions fréquentes
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="bg-white border border-ink-100 rounded-2xl p-5">
                  <p className="font-bold text-ink text-sm mb-2">{q}</p>
                  <p className="text-ink-500 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA Final ────────────────────────────────── */}
          <div className="mt-14 bg-[#0F0E0D] rounded-2xl p-8 text-center">
            <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap size={20} className="text-brand" />
            </div>
            <h2
              className="font-display font-black text-white uppercase leading-none mb-3"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", letterSpacing: "-0.01em" }}
            >
              Prêt à recruter les{" "}
              <span className="text-brand">[meilleurs]</span> ?
            </h2>
            <p className="text-white/45 text-sm mb-6">
              30 jours gratuits · Sans carte bancaire · Annulation à tout moment
            </p>
            <Link
              href="/recrute"
              className="inline-flex items-center gap-2 font-display font-black uppercase text-white bg-brand hover:bg-brand-dark transition rounded-xl px-8 py-3.5 text-sm"
              style={{ letterSpacing: "0.05em" }}
            >
              Démarrer gratuitement
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
