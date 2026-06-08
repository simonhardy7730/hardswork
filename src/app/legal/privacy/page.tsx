import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Politique de Confidentialité | HardSwork",
};

export default function PrivacyPage() {
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
          Politique de <span className="text-brand">[CONFIDENTIALITÉ].</span>
        </h1>
        <p className="text-ink-400 text-sm mb-10">Dernière mise à jour : juin 2025</p>

        <div className="space-y-8 text-ink-700 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">
              1. Responsable du traitement
            </h2>
            <p>
              HardSwork SRL (en cours de constitution), Belgique.
              Email : <a href="mailto:privacy@hardswork.be" className="text-brand hover:underline">privacy@hardswork.be</a>
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">
              2. Données collectées
            </h2>
            <ul className="list-disc list-inside space-y-1 text-ink-600">
              <li>Données d'identification (nom, email, téléphone)</li>
              <li>Données de profil professionnel (secteur, compétences, disponibilité)</li>
              <li>CV uploadés (stockés de façon sécurisée)</li>
              <li>Données de navigation (cookies techniques uniquement)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">
              3. Finalités du traitement
            </h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside space-y-1 text-ink-600 mt-2">
              <li>Vous mettre en relation avec des entreprises recruteuses</li>
              <li>Gérer votre compte et vos candidatures</li>
              <li>Améliorer la plateforme</li>
              <li>Vous envoyer des alertes emploi (avec votre consentement)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">
              4. Base légale
            </h2>
            <p>
              Le traitement est fondé sur votre consentement (art. 6.1.a RGPD) et sur l'exécution
              du contrat de service (art. 6.1.b RGPD).
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">
              5. Durée de conservation
            </h2>
            <p>
              Vos données sont conservées pendant la durée d'activité de votre compte + 3 ans
              après la dernière activité, ou jusqu'à suppression de votre compte.
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">
              6. Vos droits
            </h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
              d'effacement, de portabilité et d'opposition. Exercez-les à :{" "}
              <a href="mailto:privacy@hardswork.be" className="text-brand hover:underline">
                privacy@hardswork.be
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-display font-black text-ink uppercase text-xl mb-3">
              7. Sous-traitants
            </h2>
            <p>
              Nous utilisons Supabase (hébergement EU) pour le stockage des données. Ces
              sous-traitants sont conformes au RGPD.
            </p>
          </section>

          <p className="pt-4 border-t border-ink-100 text-ink-400 text-sm">
            Pour plus d'informations, consultez nos{" "}
            <Link href="/legal/cgu" className="text-brand hover:underline">
              Conditions Générales d'Utilisation
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
