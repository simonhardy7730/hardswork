-- À coller dans Supabase > SQL Editor. Inscriptions candidats par campagne et par annonce (7 derniers jours).
select
  coalesce(raw_user_meta_data->>'utm_source','(direct)')   as source,
  coalesce(raw_user_meta_data->>'utm_campaign','(aucune)') as campagne,
  coalesce(raw_user_meta_data->>'utm_content','-')         as annonce,
  count(*)                                                 as inscrits,
  count(*) filter (where email_confirmed_at is not null)   as emails_confirmes
from auth.users
where raw_user_meta_data->>'user_type' = 'candidate'
  and created_at > now() - interval '7 days'
group by 1,2,3
order by inscrits desc;

-- Inscriptions par jour (pour surveiller le plafond d'environ 50/jour imposé par l'envoi de mails gratuit).
select date_trunc('day', created_at at time zone 'Europe/Brussels')::date as jour, count(*) as inscrits
from auth.users
where raw_user_meta_data->>'user_type' = 'candidate' and created_at > now() - interval '14 days'
group by 1 order by 1 desc;

-- Profils candidats avec au moins un document (CV) déposé.
select count(distinct c.id) as profils, count(distinct d.auth_user_id) as avec_cv
from candidates c left join candidate_documents d on d.auth_user_id = c.auth_user_id
where c.created_at > now() - interval '7 days';
