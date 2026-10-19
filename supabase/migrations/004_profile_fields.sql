-- 004 : code postal candidat, n° TVA entreprise, documents candidat (diplômes / permis)

ALTER TABLE candidates     ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE organizations  ADD COLUMN IF NOT EXISTS vat_number  TEXT;

CREATE TABLE IF NOT EXISTS candidate_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('diplome','permis','autre')),
  label        TEXT,
  file_path    TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs_select_own" ON candidate_documents;
DROP POLICY IF EXISTS "docs_insert_own" ON candidate_documents;
DROP POLICY IF EXISTS "docs_delete_own" ON candidate_documents;
CREATE POLICY "docs_select_own" ON candidate_documents FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "docs_insert_own" ON candidate_documents FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "docs_delete_own" ON candidate_documents FOR DELETE USING (auth.uid() = auth_user_id);

-- Bucket privé : documents sensibles, accessibles uniquement par leur propriétaire (URL signées)
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-documents', 'candidate-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "candoc_select_own" ON storage.objects;
DROP POLICY IF EXISTS "candoc_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "candoc_delete_own" ON storage.objects;
CREATE POLICY "candoc_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "candoc_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "candoc_delete_own" ON storage.objects FOR DELETE
  USING (bucket_id = 'candidate-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
