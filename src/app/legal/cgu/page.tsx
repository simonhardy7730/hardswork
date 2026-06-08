import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation | HardSwork",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-ink-400 hover:text-ink text-sm font-semibold mb-8 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>

        <h1
          className="font-display font-black text-ink uppercase mb-2"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)", letterSpacing: "-0.01em" }}
        >
          Conditions Générales <span className="text-brand">[D'UTILISATION].</span>
        </h1>
        <p className="text-ink-400 text-sm mb-10">Dernière mise à jour : juin 2025</p>

        <div className="space-y-8 text-ink-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et
              l'utilisation de la plateforme HardSwork, accessible à l'adresse{" "}
              <strong>hardswork.be</strong>, éditée par la société HardSwork SRL (en cours de
              constitution), Belgique.
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">2. Accès à la plateforme</h2>
            <p>
              HardSwork est une plateforme de mise en relation entre candidats blue-collar et
              entreprises recruteuses. L'accès candidat est gratuit. L'accès recruteur est soumis
              à un abonnement payant après une période d'essai.
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">3. Responsabilités</h2>
            <p>
              HardSwork agit en tant qu'intermédiaire technique. La plateforme ne saurait être
              tenue responsable du contenu des offres d'emploi publiées par les recruteurs, ni des
              candidatures soumises par les candidats.
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">4. Données personnelles</h2>
            <p>
              Le traitement de vos données personnelles est régi par notre{" "}
              <Link href="/legal/privacy" className="text-brand hover:underline font-semibold">
                Politique de Confidentialité
              </Link>
              . En utilisant HardSwork, vous acceptez cette politique.
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">5. Modifications</h2>
            <p>
              HardSwork se réserve le droit de modifier les présentes CGU à tout moment. Les
              utilisateurs seront informés par email en cas de modification substantielle.
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">6. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, contactez-nous à l'adresse :{" "}
              <a href="mailto:legal@hardswork.be" className="text-brand hover:underline">
                legal@hardswork.be
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
