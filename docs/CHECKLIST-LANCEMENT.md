# Checklist de lancement (dans l'ordre)

## À faire sur ton PC avant la pub
1. Supabase > SQL Editor : coller et exécuter `supabase/migrations/015_launch_offer_trial.sql`, puis `016_candidate_visibility.sql`.
   (`017_candidate_pool.sql` peut attendre : la candidathèque reste fermée.)
2. Cloudflare Turnstile : créer le site `wolko.be`, mettre `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY`
   dans Vercel (Production + Preview), puis redéployer. Sans ça, des robots peuvent épuiser les 100 mails/jour.
3. Supabase > Authentication > Rate Limits : vérifier que la limite d'envoi de mails n'est pas trop basse (pour 50 inscriptions/jour).
4. GitHub > Actions > « Keep-alive & uptime » > Run workflow : doit être vert.
5. Ouvrir `https://wolko.be/candidats?utm_source=test&utm_campaign=test&utm_content=T1` sur ton téléphone,
   s'inscrire avec un vrai mail, confirmer le mail, puis lancer `docs/SUIVI-PUB.sql` : la ligne « test / T1 » doit apparaître.
6. Dans « Mon compte » : vérifier que la date de naissance et la case de visibilité fonctionnent (majeur).
7. NE PAS mettre `CANDIDATE_POOL_ENABLED=true` tant que le juriste n'a pas relu CGU, confidentialité et texte de la case.

## Pendant la pub (chaque soir)
- Lancer `SUIVI-PUB.sql` : inscrits par annonce, par jour (plafond ~50/jour), profils avec CV.
- Resend > Emails : vérifier qu'on reste sous 100/jour. Vercel > Usage : rien d'anormal.
- GitHub > Actions : le ping « Keep-alive » est vert.

## Dans les semaines qui suivent
- Relecture juridique (CGU, confidentialité, case de consentement, âge) puis ouverture de la candidathèque.
- Test de restauration de la sauvegarde dans un projet Supabase vide.
- Passer à Resend payant avant d'atteindre le plafond ; Vercel Pro et Supabase Pro dès les premiers revenus.
