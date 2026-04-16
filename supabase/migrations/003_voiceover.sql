-- ============================================================
-- 003_voiceover.sql
-- Product Video Lab: voiceover columns, storage bucket, and RLS policies.
-- Consistent with the authenticated_* auth model in 001_initial_schema.sql.
-- ============================================================

-- Script columns to hold the chosen voice and the generated audio URL.
ALTER TABLE scripts
  ADD COLUMN IF NOT EXISTS voice_id  text,
  ADD COLUMN IF NOT EXISTS audio_url text;


-- Storage bucket for generated voiceover MP3s (private; accessed via signed URLs).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voiceover',
  'voiceover',
  false,
  52428800, -- 50 MB, matches project-assets
  ARRAY['audio/mpeg','audio/mp3','audio/wav']
)
ON CONFLICT (id) DO NOTHING;


-- Storage RLS: authenticated users can read, write, and delete voiceover objects.
-- Matches the pattern used for project-assets in 001_initial_schema.sql.
CREATE POLICY "authenticated_read_voiceover"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voiceover' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_write_voiceover"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voiceover' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_voiceover"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'voiceover' AND auth.uid() IS NOT NULL);
