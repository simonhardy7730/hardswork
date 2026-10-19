import Link from "next/link";
import { SiteNav } from "@/components/layout/SiteNav";

export const metadata = {
  title: "Conditions Générales d'Utilisation — Wolko",
  description: "Conditions générales d'utilisation de la plateforme de recrutement Wolko.",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />

      <div className="pt-[60px]">
        {/* Hero */}
        <div className="bg-[#101F43] py-16 px-6">
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
                l&apos;utilisation de la plateforme Wolko, accessible à l&apos;adresse{" "}
                <strong>wolko.be</strong>, éditée par la société Wolko SRL (en cours de
                constitution), Belgique.
              </p>
              <p>
                Wolko est une plateforme de mise en relation entre recruteurs (entreprises et agences)
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
                <a href="mailto:hello@wolko.be">hello@wolko.be</a>.
              </p>
            </LegalSection>

            <LegalSection title="3. Offres d'emploi">
              <p>
                Les recruteurs s&apos;engagent à publier uniquement des offres d&apos;emploi réelles, légales et
                conformes au droit du travail belge. Toute offre discriminatoire, mensongère ou ne
                correspondant pas à un poste réel sera supprimée sans préavis.
              </p>
              <p>
                Wolko agit en tant qu&apos;intermédiaire technique et n&apos;est pas partie aux contrats
                conclus entre recruteurs et candidats.
              </p>
            </LegalSection>

            <LegalSection title="4. Abonnements, essai gratuit et paiement">
              <p>
                <strong>Essai gratuit.</strong> Tout compte entreprise ou agence bénéficie d&apos;un essai gratuit de
                7 jours calendaires, une seule fois par organisation, sans carte bancaire. Aucun prélèvement n&apos;est
                effectué sans votre accord explicite. À la fin de l&apos;essai, vos données sont conservées ; l&apos;accès
                à la publication d&apos;offres et aux coordonnées des candidats est suspendu jusqu&apos;à la souscription
                d&apos;un abonnement.
              </p>
              <p>
                <strong>Tarifs.</strong> Wolko propose des abonnements mensuels payants (Pro, Agence et Agence Réseau sur devis)
                dont les tarifs sont indiqués en euros hors TVA sur la page <Link href="/tarifs">/tarifs</Link>.
              </p>
              <p>
                <strong>Offre de lancement.</strong> Toute souscription conclue au plus tard le 31 décembre 2026 conserve
                son tarif de lancement pendant 12 mois à compter de la date de souscription, y compris lors des
                renouvellements. À partir du 1er janvier 2027, les nouvelles souscriptions sont facturées au tarif standard
                en vigueur à la date de souscription. Les conditions d&apos;un abonnement déjà souscrit ne sont pas modifiées
                rétroactivement.
              </p>
              <p>
                <strong>WOLKO Flash et Flash Duo (annonces ponctuelles).</strong> WOLKO Flash permet de publier une
                annonce pendant 30 jours calendaires à compter de sa publication, au prix de 149 € HTVA, payable en une
                fois sur facture par virement bancaire. WOLKO Flash Duo : deux annonces au prix de 223,50 € HTVA (remise de
                50 % sur la deuxième annonce, accordée une seule fois par commande ; les annonces supplémentaires sont
                facturées 149 € HTVA chacune). Chaque annonce doit être activée dans les 90 jours suivant l&apos;achat.
                Les annonces sont activées après confirmation de la réception du paiement ou après accord exprès de
                Wolko ; une facture envoyée ne vaut pas paiement. Aucun abonnement, aucun engagement et aucun
                renouvellement automatique ; le renouvellement est un nouvel achat volontaire. Flash donne accès aux
                candidatures reçues sur l&apos;annonce concernée, et non à la candidathèque générale. L&apos;intitulé d&apos;une
                annonce publiée ne peut plus être modifié : une annonce correspond à un seul recrutement.
              </p>
              <p>
                <strong>Engagement et résiliation (abonnements professionnels).</strong> L&apos;abonnement payant comporte
                un engagement initial de 12 mois à compter de son activation, facturé mensuellement. Pour ne pas
                poursuivre après cet engagement, le client demande la non-reconduction au moins 30 jours avant
                l&apos;échéance. À défaut, l&apos;abonnement se poursuit à durée indéterminée, facturé mensuellement, et peut
                être résilié avec un préavis de 30 jours. Aucune période postérieure à la date de fin effective n&apos;est
                facturée. Le tarif contractuel en vigueur à la souscription n&apos;est jamais modifié rétroactivement ; à
                l&apos;issue de l&apos;engagement initial, tout changement de tarif est notifié au préalable. Les droits légaux
                impératifs du client ne sont pas affectés.
              </p>
            </LegalSection>

            <LegalSection title="5. Données personnelles">
              <p>
                Le traitement de vos données personnelles est régi par notre{" "}
                <Link href="/legal/privacy">Politique de Confidentialité</Link>.
                En utilisant Wolko, vous acceptez cette politique. Vos données sont hébergées
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
                La Plateforme est fournie « en l&apos;état ». Wolko ne saurait être tenu responsable
                des dommages indirects ou pertes résultant de l&apos;utilisation de la Plateforme, du
                contenu des offres publiées par les recruteurs, ni des candidatures soumises.
              </p>
            </LegalSection>

            <LegalSection title="8. Modifications des CGU">
              <p>
                Wolko se réserve le droit de modifier les présentes CGU à tout moment. Les
                utilisateurs seront notifiés par email au moins 30 jours avant l&apos;entrée en vigueur
                de toute modification substantielle.
              </p>
            </LegalSection>

            <LegalSection title="9. Droit applicable">
              <p>
                Les présentes CGU sont soumises au droit belge. Tout litige sera soumis aux
                tribunaux compétents de l&apos;arrondissement judiciaire de Bruxelles, Belgique.
                Contact légal :{" "}
                <a href="mailto:hello@wolko.be">hello@wolko.be</a>
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
            <p className="text-ink-300 text-xs">© 2026 Wolko · Belgique · Tous droits réservés</p>
            <div className="flex gap-6 text-xs">
              <Link href="/legal/cgu" className="text-brand font-semibold">CGU</Link>
              <Link href="/legal/privacy" className="text-ink-300 hover:text-ink transition">Confidentialité</Link>
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
      <div className="space-y-3 text-ink-500 text-[15px] leading-relaxed [&_a]:text-brand [&_a:hover]:underline [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
