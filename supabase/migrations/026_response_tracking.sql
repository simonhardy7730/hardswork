-- 026 : délai de réponse des recruteurs (badge public) + relance automatique
alter table public.applications add column if not exists first_response_at timestamptz;
alter table public.applications add column if not exists reminder_sent_at timestamptz;
