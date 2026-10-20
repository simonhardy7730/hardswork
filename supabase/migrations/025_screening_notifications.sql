-- 025 : suivi de candidature (e-mails de statut) + questions de présélection par offre
alter table public.applications add column if not exists last_notified_status text;
alter table public.applications add column if not exists screening_answers jsonb;
alter table public.job_offers add column if not exists screening_ids text[] not null default '{}';
