ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS applications_deleted_count integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.count_deleted_application() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN UPDATE job_offers SET applications_deleted_count = applications_deleted_count + 1 WHERE id = OLD.job_offer_id; RETURN OLD; END; $$;
DROP TRIGGER IF EXISTS applications_count_deleted ON applications;
CREATE TRIGGER applications_count_deleted AFTER DELETE ON applications FOR EACH ROW EXECUTE FUNCTION public.count_deleted_application();
