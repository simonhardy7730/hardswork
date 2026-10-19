import Link from "next/link";
import { SiteNav } from "@/components/layout/SiteNav";

export const metadata = {
  title: "Politique de Confidentialité — Wolko",
  description: "Politique de confidentialité et protection des données de la plateforme Wolko.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />

      <div className="pt-[60px]">
        {/* Hero */}
        <div className="bg-[#101F43] py-16 px-6">
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
                Wolko SRL (en cours de constitution), Belgique.
                <br />
                Email de contact RGPD :{" "}
                <a href="mailto:hello@wolko.be">hello@wolko.be</a>
              </p>
            </LegalSection>

            <LegalSection title="2. Données collectées">
              <p>Nous collectons les catégories de données suivantes :</p>
              <ul>
                <li><strong>Données d&apos;identification</strong> : nom, prénom, adresse email, numéro de téléphone, date de naissance (âge minimum d&apos;inscription : 15 ans)</li>
                <li><strong>Données professionnelles</strong> : secteur d&apos;activité, compétences, permis, langues, disponibilité</li>
                <li><strong>CV et documents</strong> : stockés de façon sécurisée dans nos infrastructures EU</li>
                <li><strong>Disponibilités et préférences d&apos;emploi</strong> : jours et plages horaires, type de job recherché (emploi classique, intérim, job étudiant, flexi-job, stage), situation déclarée (étudiant, flexi-job)</li>
                <li><strong>Données de navigation</strong> : cookies techniques strictement nécessaires au fonctionnement</li>
                <li><strong>Données de paiement</strong> : gérées par notre prestataire Stripe (nous ne stockons pas vos données bancaires)</li>
              </ul>
            </LegalSection>

            <LegalSection title="2 bis. Visibilité de votre profil">
              <p>
                Par défaut, votre profil, vos disponibilités et vos documents ne sont visibles que de vous. Un recruteur
                ne reçoit que les informations que vous lui transmettez en postulant à son offre.
              </p>
              <p>
                Si vous cochez, de façon facultative, la case « J&apos;accepte que mon profil soit consulté par des recruteurs
                abonnés à Wolko » (à l&apos;inscription ou dans Mon compte), les organisations disposant d&apos;un abonnement
                actif peuvent rechercher votre profil et vous contacter pour des offres. Cet accord est la base légale de
                ce traitement : il n&apos;est jamais pré-coché, la date et la version du texte sont conservées, et vous
                pouvez le retirer à tout moment dans Mon compte (le profil disparaît alors de la recherche). Une candidature
                ne vaut jamais accord de visibilité générale.
              </p>
            </LegalSection>

            <LegalSection title="2 ter. Jobs étudiants et flexi-jobs">
              <p>
                Les déclarations relatives au statut d&apos;étudiant ou au flexi-job sont indicatives. Wolko ne vérifie pas
                l&apos;éligibilité légale : celle-ci reste « à confirmer » avec l&apos;employeur. Nous ne collectons pas de
                justificatifs scolaires.
              </p>
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
                <li><strong>Resend</strong> (envoi des emails de confirmation, de candidature et de notification)</li>
                <li><strong>Cloudflare</strong> (protection anti-robot des formulaires, lorsqu&apos;elle est activée)</li>
                <li><strong>Stripe</strong> (paiement, lorsque les abonnements payants sont activés) — conforme PCI-DSS et RGPD</li>
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
                <li><strong>Droit d&apos;accès et portabilité</strong> : obtenir une copie de vos données (bouton « Télécharger mes données » dans Mon compte)</li>
                <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
                <li><strong>Droit à l&apos;effacement</strong> : supprimer votre compte vous-même dans Mon compte (candidats) ou sur demande</li>
                <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                <li><strong>Droit d&apos;opposition</strong> : vous opposer à certains traitements</li>
                <li><strong>Droit de limitation</strong> : limiter le traitement dans certains cas</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez :{" "}
                <a href="mailto:hello@wolko.be">hello@wolko.be</a>
                <br />
                Vous pouvez également introduire une réclamation auprès de l&apos;
                <a href="https://www.dataprotectionauthority.be" target="_blank" rel="noopener noreferrer">
                  Autorité de Protection des Données (APD)
                </a>.
              </p>
            </LegalSection>

            <LegalSection title="7 bis. Mineurs">
              <p>
                Wolko s&apos;adresse aux personnes en âge de travailler (inscription à partir de 15 ans, vérifiée par la date de naissance). La visibilité auprès des recruteurs abonnés est réservée aux personnes de 18 ans et plus. Si vous avez moins de 18 ans, vous ne pouvez
                postuler qu&apos;à des offres compatibles avec la réglementation sur le travail des jeunes, et un
                représentant légal peut exercer vos droits en notre nom en écrivant à{" "}
                <a href="mailto:hello@wolko.be">hello@wolko.be</a>. Nous ne réutilisons jamais le profil d&apos;un mineur
                pour du démarchage.
              </p>
            </LegalSection>

            <LegalSection title="8. Cookies">
              <p>
                Wolko utilise uniquement des cookies strictement nécessaires au fonctionnement
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
            <p className="text-ink-300 text-xs">© 2026 Wolko · Belgique · Tous droits réservés</p>
            <div className="flex gap-6 text-xs">
              <Link href="/legal/cgu" className="text-ink-300 hover:text-ink transition">CGU</Link>
              <Link href="/legal/privacy" className="text-brand font-semibold">Confidentialité</Link>
              <a href="mailto:hello@wolko.be" className="text-ink-300 hover:text-ink transition">Contact</a>
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
