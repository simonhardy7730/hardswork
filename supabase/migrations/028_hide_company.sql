-- 028 : annonce confidentielle — le recruteur peut masquer le nom (et le logo) de l'entreprise sur l'annonce publique.
alter table public.job_offers add column if not exists hide_company boolean not null default false;
