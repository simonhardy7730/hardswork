import Link from "next/link";
import { Check, ArrowRight, ChevronDown } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";

export const metadata = {
  title: "Tarifs — HardSwork",
  description: "Des plans de recrutement clairs pour trouver les experts du terrain belge.",
};

const PLANS = [
  {
    id: "starter",
    name: "Gratuit",
    price: "0",
    description: "Pour tester la plateforme",
    cta: "S'inscrire",
    href: "/recrute",
    featured: false,
    features: [
      "1 offre d'emploi active",
      "Profils candidats illimités",
      "Formulaire de candidature public",
      "Tableau de bord basique",
    ],
    locked: ["Contacts candidats masqués", "Pas de données qualité"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "89",
    description: "Pour les PME qui recrutent en direct",
    cta: "Choisir Pro",
    href: "/recrute",
    featured: true,
    features: [
      "Offres d'emploi illimitées",
      "Candidats débloqués",
      "Candidathèque complète",
      "Support technique 24/7",
    ],
    locked: [],
  },
  {
    id: "agency",
    name: "Agence",
    price: "249",
    description: "Pour les agences de recrutement",
    cta: "Contacter la vente",
    href: "mailto:hello@hardswork.be",
    featured: false,
    features: [
      "Clients illimités",
      "API & intégrations ATS",
      "Account Manager Dédié",
      "Gestion d'intérim",
    ],
    locked: [],
  },
];

const FAQS = [
  {
    q: "Comment fonctionne la liste de qualité ?",
    a: "Notre algorithme classe les candidats selon leur profil, expérience et disponibilité pour ne vous présenter que les meilleurs correspondants.",
  },
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, sans engagement ni frais de résiliation. Votre abonnement reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "Quels secteurs couvrez-vous ?",
    a: "Construction, logistique, transport, industrie, médical, sécurité et nettoyage — tous les métiers du terrain belge.",
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

        {/* ── HERO sombre ──────────────────────────────── */}
        <div className="bg-[#0F0E0D] py-20 text-center px-6">
          <span className="inline-block text-[11px] font-black text-brand border border-brand/30 bg-brand/10 px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            30 jours gratuits · Sans carte bancaire
          </span>
          <h1
            className="font-display font-black text-white uppercase leading-[0.9] mb-5"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            Choisissez votre <span className="text-brand">[plan]</span>
            <br />de recrutement.
          </h1>
          <p className="text-white/45 text-base max-w-lg mx-auto leading-relaxed">
            Des outils de haute précision pour trouver les experts du terrain.
            Pas de fioritures, juste la performance brute.
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
                    ⭐ Le plus populaire
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
                    <span className="text-ink-400 text-sm mb-1.5">&nbsp;/mois</span>
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
              { icon: "✅", label: "Sans engagement" },
              { icon: "🔒", label: "Données sécurisées" },
              { icon: "🇧🇪", label: "100% belge" },
              { icon: "📞", label: "Support humain" },
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
        <div className="bg-[#0F0E0D] py-20 text-center px-6">
          <h2
            className="font-display font-black text-white uppercase leading-[0.9] mb-7"
            style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}
          >
            Prêt à renforcer <span className="text-brand">[vos équipes]</span>&nbsp;?
          </h2>
          <p className="text-white/40 text-sm mb-8">
            30 jours gratuits · Sans carte bancaire · Annulation à tout moment
          </p>
          <Link
            href="/recrute"
            className="inline-flex items-center gap-3 bg-brand hover:bg-brand-dark text-white font-display font-black uppercase px-10 py-4 rounded-xl transition text-[13px]"
            style={{ letterSpacing: "0.08em" }}
          >
            Lancer mon premier recrutement
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer className="border-t border-ink-100 bg-[#FAFAF8] py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-ink-300 text-xs">© 2026 HardSwork · Belgique · Tous droits réservés</p>
            <div className="flex gap-6 text-ink-300 text-xs">
              <Link href="/legal/cgu" className="hover:text-ink transition">CGU</Link>
              <Link href="/legal/privacy" className="hover:text-ink transition">Confidentialité</Link>
              <Link href="mailto:hello@hardswork.be" className="hover:text-ink transition">Contact</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
