import Link from "next/link";
import { SiteNav } from "@/components/layout/SiteNav";

export const metadata = {
  title: "Politique de Confidentialité — HardSwork",
  description: "Politique de confidentialité et protection des données de la plateforme HardSwork.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body">
      <SiteNav />

      <div className="pt-[60px]">
        {/* Hero */}
        <div className="bg-[#0F0E0D] py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] font-black text-brand/70 uppercase tracking-widest mb-3">Légal · RGPD</p>
            <h1
              className="font-display font-black text-white uppercase leading-[0.9]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.02em" }}
            >
              Politique de <span className="text-brand">[confidentialité].</span>
            </h1>
            <p className="text-white/35 mt-4 text-sm">Dernière mise à jour : 1er juin 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="space-y-10">

            <LegalSection title="1. Responsable du traitement">
              <p>
                HardSwork SRL (en cours de constitution), Belgique.
                <br />
                Email de contact RGPD :{" "}
                <a href="mailto:privacy@hardswork.be">privacy@hardswork.be</a>
              </p>
            </LegalSection>

            <LegalSection title="2. Données collectées">
              <p>Nous collectons les catégories de données suivantes :</p>
              <ul>
                <li><strong>Données d&apos;identification</strong> : nom, prénom, adresse email, numéro de téléphone</li>
                <li><strong>Données professionnelles</strong> : secteur d&apos;activité, compétences, permis, langues, disponibilité</li>
                <li><strong>CV et documents</strong> : stockés de façon sécurisée dans nos infrastructures EU</li>
                <li><strong>Données de navigation</strong> : cookies techniques strictement nécessaires au fonctionnement</li>
                <li><strong>Données de paiement</strong> : gérées par notre prestataire Stripe (nous ne stockons pas vos données bancaires)</li>
              </ul>
            </LegalSection>

            <LegalSection title="3. Finalités du traitement">
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul>
                <li>Vous mettre en relation avec des entreprises recruteuses ou des candidats</li>
                <li>Gérer votre compte, vos offres ou vos candidatures</li>
                <li>Améliorer la qualité et la pertinence de la plateforme</li>
                <li>Vous envoyer des alertes emploi ou notifications recruteur (avec votre consentement)</li>
                <li>Respecter nos obligations légales et comptables</li>
              </ul>
            </LegalSection>

            <LegalSection title="4. Base légale du traitement">
              <p>
                Selon les cas, le traitement est fondé sur :
              </p>
              <ul>
                <li><strong>Votre consentement</strong> (art. 6.1.a RGPD) — pour les emails marketing et alertes emploi</li>
                <li><strong>L&apos;exécution du contrat</strong> (art. 6.1.b RGPD) — pour la gestion de votre compte</li>
                <li><strong>L&apos;intérêt légitime</strong> (art. 6.1.f RGPD) — pour l&apos;amélioration du service</li>
                <li><strong>L&apos;obligation légale</strong> (art. 6.1.c RGPD) — pour la comptabilité et obligations fiscales</li>
              </ul>
            </LegalSection>

            <LegalSection title="5. Durée de conservation">
              <p>
                Vos données sont conservées pendant la durée d&apos;activité de votre compte, augmentée
                de 3 ans après la dernière activité constatée, ou jusqu&apos;à suppression volontaire de
                votre compte. Les données de facturation sont conservées 10 ans conformément à la
                législation fiscale belge.
              </p>
            </LegalSection>

            <LegalSection title="6. Sous-traitants et transferts">
              <p>Vos données peuvent être partagées avec les sous-traitants suivants :</p>
              <ul>
                <li><strong>Supabase</strong> (hébergement base de données) — serveurs en Union Européenne</li>
                <li><strong>Vercel</strong> (hébergement application) — serveurs EU disponibles</li>
                <li><strong>Stripe</strong> (paiement) — conforme PCI-DSS et RGPD</li>
              </ul>
              <p>
                Aucun transfert de données vers des pays tiers hors UE n&apos;est effectué sans garanties
                appropriées (clauses contractuelles types ou décision d&apos;adéquation).
              </p>
            </LegalSection>

            <LegalSection title="7. Vos droits">
              <p>
                Conformément au RGPD et à la loi belge du 30 juillet 2018, vous disposez des droits suivants :
              </p>
              <ul>
                <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
                <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                <li><strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements</li>
                <li><strong>Droit de limitation</strong> : limiter le traitement dans certains cas</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez :{" "}
                <a href="mailto:privacy@hardswork.be">privacy@hardswork.be</a>
                <br />
                Vous pouvez également introduire une réclamation auprès de l&apos;
                <a href="https://www.dataprotectionauthority.be" target="_blank" rel="noopener noreferrer">
                  Autorité de Protection des Données (APD)
                </a>.
              </p>
            </LegalSection>

            <LegalSection title="8. Cookies">
              <p>
                HardSwork utilise uniquement des cookies strictement nécessaires au fonctionnement
                du service (session, authentification). Nous n&apos;utilisons pas de cookies tiers à des
                fins publicitaires ou analytiques sans votre consentement explicite.
              </p>
            </LegalSection>

            <LegalSection title="9. Sécurité">
              <p>
                Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées pour
                protéger vos données contre tout accès non autorisé, perte ou destruction : chiffrement
                SSL/TLS, authentification sécurisée, accès restreint aux données sensibles.
              </p>
            </LegalSection>

          </div>

          <div className="mt-12 pt-8 border-t border-ink-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link href="/" className="text-sm text-ink-400 hover:text-ink transition-colors">
              ← Retour à l&apos;accueil
            </Link>
            <Link href="/legal/cgu" className="text-sm text-brand hover:underline font-semibold">
              Voir les CGU →
            </Link>
          </div>
        </div>

        <footer className="border-t border-ink-100 bg-white py-8 px-6">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-ink-300 text-xs">© 2026 HardSwork · Belgique · Tous droits réservés</p>
            <div className="flex gap-6 text-xs">
              <Link href="/legal/cgu" className="text-ink-300 hover:text-ink transition">CGU</Link>
              <Link href="/legal/privacy" className="text-brand font-semibold">Confidentialité</Link>
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
      <div className="space-y-3 text-ink-500 text-[15px] leading-relaxed [&_a]:text-brand [&_a:hover]:underline [&_strong]:text-ink [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
