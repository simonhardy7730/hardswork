# Abonnements B2B — points à valider par un juriste belge avant mise en production

Les règles ci-dessous sont des choix de fonctionnement de WOLKO (migration 023, `src/lib/billing/contract.ts`), pas une validation juridique.
Aucune pénalité ni indemnité de rupture anticipée n'a été inventée.

1. **Engagement initial de 12 mois** : validité et information précontractuelle B2B (clients PME / agences), forme du consentement.
2. **Préavis de 30 jours et reconduction** : une demande tardive (moins de 30 jours avant l'échéance) met fin au contrat 30 jours après la demande, sans nouvelle année imposée. À confirmer, ainsi que le traitement d'une reconduction tacite en durée indéterminée.
3. **Résiliation anticipée** (avant l'échéance, hors non-reconduction) : non automatisée, traitée au cas par cas (hello@wolko.be). Situations légalement protégées à prévoir (faillite, force majeure, manquement de WOLKO…).
4. **Modification des tarifs** : tarif contractuel jamais modifié rétroactivement ; passage au tarif standard à l'issue des 12 mois avec notification (e-mail à 45 jours). Délai de notification à confirmer.
5. **Information précontractuelle** : mention affichée sous les offres, CGU (section 4), récapitulatif envoyé à la souscription. Version des conditions : `TERMS_VERSION`.
6. **Clients français** : droit applicable, règles de consommation/professionnel, TVA/autoliquidation à confirmer.
7. **Preuve du consentement** : la souscription se fait aujourd'hui avec l'équipe (devis/bon de commande signé). La référence est obligatoire dans `subscribe_organization`.
8. Pas de droit de rétractation commercial de 14 jours affiché ; les droits légaux impératifs ne sont pas exclus (CGU).

# WOLKO Flash / Flash Duo — points juridiques et comptables à valider

- **TVA** : taux 21 % indicatif (`app_settings.flash_vat_rate`), à confirmer par le comptable (régime applicable, clients français/intracommunautaires, autoliquidation).
- **Facturation électronique (Peppol)** : aucun système de facturation n'existe dans WOLKO. La facture est émise dans un logiciel externe compatible, puis son numéro est enregistré (back-office). Aucune facture PDF/e-mail n'est présentée comme suffisante.
- **Validité de 90 jours** pour activer chaque annonce : à valider (information précontractuelle, restitution/remboursement des crédits non activés — rien d'automatique n'est prévu).
- **Remboursement / annulation** : le statut « remboursée » est un marquage ; le remboursement se fait hors plateforme. Aucune règle de remboursement n'a été inventée.
- **« 30 jours calendaires »** : comptés à partir de l'instant de publication, jours civils à l'heure de Bruxelles (changement d'heure inclus).
- **Conservation des données** : les candidatures restent consultables après expiration. Aucune purge automatique n'est activée ; une durée de conservation (par ex. 6 à 12 mois) doit être décidée puis programmée (RGPD).
- **Promotion Flash → Pro** (crédit max 149 € HTVA, une fois par entreprise, Pro souscrit dans les 30 jours, paiement Flash confirmé) : implémentée mais DÉSACTIVÉE (`flash_pro_credit_enabled = false`). À activer uniquement après validation comptable (avoirs, TVA).
- **Conditions de vente ponctuelle B2B** (CGU section 4) : à faire relire.
