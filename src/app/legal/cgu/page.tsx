import Link from "next/link";
import { SiteNav } from "@/components/layout/SiteNav";

export const metadata = {
  title: "Conditions Générales d'Utilisation — HardSwork",
  description: "Conditions générales d'utilisation de la plateforme de recrutement HardSwork.",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      <SiteNav />

      <div className="pt-[60px]">
        {/* Hero */}
        <div className="bg-[#0F0E0D] py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-black text-brand/70 uppercase tracking-widest mb-3">Légal</p>
            <h1
              className="font-display font-black text-white uppercase leading-[0.9]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}
            >
              Conditions <span className="text-brand">[générales]</span>
              <br />d&apos;utilisation.
            </h1>
            <p className="text-white/35 mt-4 text-sm">Dernière mise à jour : 1er juin 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="space-y-10">

            <LegalSection title="1. Objet">
              <p>
                Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et
                l&apos;utilisation de la plateforme HardSwork, accessible à l&apos;adresse{" "}
                <strong>hardswork.be</strong>, éditée par la société HardSwork SRL (en cours de
                constitution), Belgique.
              </p>
              <p>
                HardSwork est une plateforme de mise en relation entre recruteurs (entreprises et agences)
                et candidats à la recherche d&apos;un emploi dans les secteurs techniques et manuels en Belgique.
                L&apos;utilisation de la Plateforme implique l&apos;acceptation pleine et entière des présentes CGU.
              </p>
            </LegalSection>

            <LegalSection title="2. Accès et inscription">
              <p>
                L&apos;accès candidat est gratuit. L&apos;accès recruteur est soumis à un abonnement payant après
                une période d&apos;essai. Vous vous engagez à fournir des informations exactes et complètes
                lors de votre inscription, et à les mettre à jour en cas de modification.
              </p>
              <p>
                Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes
                les activités réalisées sous votre compte. Toute utilisation non autorisée doit être
                signalée immédiatement à{" "}
                <a href="mailto:hello@hardswork.be">hello@hardswork.be</a>.
              </p>
            </LegalSection>

            <LegalSection title="3. Offres d'emploi">
              <p>
                Les recruteurs s&apos;engagent à publier uniquement des offres d&apos;emploi réelles, légales et
                conformes au droit du travail belge. Toute offre discriminatoire, mensongère ou ne
                correspondant pas à un poste réel sera supprimée sans préavis.
              </p>
              <p>
                HardSwork agit en tant qu&apos;intermédiaire technique et n&apos;est pas partie aux contrats
                conclus entre recruteurs et candidats.
              </p>
            </LegalSection>

            <LegalSection title="4. Abonnements et paiement">
              <p>
                HardSwork propose des plans d&apos;abonnement payants (Pro et Agence) dont les tarifs sont
                indiqués en euros TTC sur la page{" "}
                <Link href="/tarifs">/tarifs</Link>.
                Les abonnements sont mensuels et renouvelables automatiquement.
              </p>
              <p>
                Vous pouvez résilier à tout moment depuis votre tableau de bord. La résiliation prend
                effet à la fin de la période de facturation en cours, sans remboursement au prorata.
              </p>
            </LegalSection>

            <LegalSection title="5. Données personnelles">
              <p>
                Le traitement de vos données personnelles est régi par notre{" "}
                <Link href="/legal/privacy">Politique de Confidentialité</Link>.
                En utilisant HardSwork, vous acceptez cette politique. Vos données sont hébergées
                en Union Européenne (Supabase EU) et traitées conformément au RGPD.
              </p>
            </LegalSection>

            <LegalSection title="6. Propriété intellectuelle">
              <p>
                L&apos;ensemble des éléments de la Plateforme (textes, images, logos, code source) est
                protégé par le droit de la propriété intellectuelle belge et européen. Toute
                reproduction sans autorisation écrite préalable est interdite.
              </p>
            </LegalSection>

            <LegalSection title="7. Responsabilité">
              <p>
                La Plateforme est fournie « en l&apos;état ». HardSwork ne saurait être tenu responsable
                des dommages indirects ou pertes résultant de l&apos;utilisation de la Plateforme, du
                contenu des offres publiées par les recruteurs, ni des candidatures soumises.
              </p>
            </LegalSection>

            <LegalSection title="8. Modifications des CGU">
              <p>
                HardSwork se réserve le droit de modifier les présentes CGU à tout moment. Les
                utilisateurs seront notifiés par email au moins 30 jours avant l&apos;entrée en vigueur
                de toute modification substantielle.
              </p>
            </LegalSection>

            <LegalSection title="9. Droit applicable">
              <p>
                Les présentes CGU sont soumises au droit belge. Tout litige sera soumis aux
                tribunaux compétents de l&apos;arrondissement judiciaire de Bruxelles, Belgique.
                Contact légal :{" "}
                <a href="mailto:legal@hardswork.be">legal@hardswork.be</a>
              </p>
            </LegalSection>

          </div>

          <div className="mt-12 pt-8 border-t border-ink-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link href="/" className="text-sm text-ink-400 hover:text-ink transition-colors">
              ← Retour à l&apos;accueil
            </Link>
            <Link href="/legal/privacy" className="text-sm text-brand hover:underline font-semibold">
              Politique de confidentialité →
            </Link>
          </div>
        </div>

        <footer className="border-t border-ink-100 bg-white py-8 px-6">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-ink-300 text-xs">© 2026 HardSwork · Belgique · Tous droits réservés</p>
            <div className="flex gap-6 text-xs">
              <Link href="/legal/cgu" className="text-brand font-semibold">CGU</Link>
              <Link href="/legal/privacy" className="text-ink-300 hover:text-ink transition">Confidentialité</Link>
              <a href="mailto:hello@hardswork.be" className="text-ink-300 hover:text-ink transition">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="font-display font-black text-ink uppercase mb-4"
        style={{ fontSize: "1.05rem", letterSpacing: "-0.005em" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-ink-500 text-[15px] leading-relaxed [&_a]:text-brand [&_a:hover]:underline [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
