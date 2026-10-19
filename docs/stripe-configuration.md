# Paiement en ligne Stripe (WOLKO Flash) — configuration

Le code est livré **dormant** : sans les deux variables ci-dessous, rien ne change (parcours « facture » actuel).

## 1. Compte Stripe (à créer par le dirigeant)
1. stripe.com → créer le compte (pays : Belgique), renseigner l'activité et le compte bancaire.
2. Tableau de bord → **Paramètres → Moyens de paiement** : activer **Bancontact** et **Cartes**.
3. Tableau de bord → **Paramètres → Facturation → E-mails** : activer l'envoi automatique des factures / reçus aux clients.
4. Rester d'abord en **mode test** (interrupteur « Mode test ») : cartes de test 4242 4242 4242 4242.

## 2. Webhook
1. **Développeurs → Webhooks → Ajouter un endpoint**.
2. URL : `https://wolko.be/api/webhooks/stripe`
3. Événements : `checkout.session.completed` et `checkout.session.async_payment_succeeded`.
4. Copier la **clé de signature** (`whsec_...`).

## 3. Variables Vercel (Settings → Environment Variables → Production → puis Redeploy)
- `STRIPE_SECRET_KEY` = clé secrète (`sk_test_...` pour tester, `sk_live_...` ensuite)
- `STRIPE_WEBHOOK_SECRET` = clé de signature du webhook (`whsec_...`)

Les deux sont obligatoires : s'il en manque une, le bouton « Payer en ligne » n'apparaît pas.

## Fonctionnement
- Commande créée (prix gelés en base) → bouton **Payer en ligne** dans « Mes commandes » → page Stripe → paiement.
- Stripe appelle le webhook : signature vérifiée, montants comparés à la commande (HTVA exact, TVAC ±1 centime, EUR), commande confirmée, annonces rattachées publiées, facture Stripe enregistrée, e-mail « paiement confirmé » (envoyé une seule fois).
- Un événement répété ne fait rien de plus (idempotent). Un montant incohérent ne confirme rien : événement `online_payment_mismatch` dans l'historique de la commande, à traiter à la main.
- Le virement sur facture reste possible : le parcours manuel de l'admin est inchangé.

## Points à valider avec le comptable
- La facture Stripe (PDF) suffit-elle pour le B2B belge (e-facturation Peppol obligatoire depuis 2026) ?
- TVA 21 % fixe (réglage `flash_vat_rate`), pas d'autoliquidation ni de TVA étrangère gérées.
- Remboursement : à faire dans le tableau de bord Stripe puis « Annuler / rembourser » dans l'admin Wolko (non automatisé).
- Paiement reçu sur une commande déjà annulée : événement `online_payment_on_closed_order` à traiter à la main (remboursement).
