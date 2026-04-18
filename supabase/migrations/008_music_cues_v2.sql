-- ============================================================
-- 008_music_cues_v2.sql
-- Extends music_cues table for Phase 5: Epidemic Sound integration.
--
-- Adds:
--   - track_artist  (display in UI)
--   - duration_ms   (track length — for beat grid generation)
--   - preview_url   (30s preview for music selector UI)
--   - UNIQUE (render_payload_id) — enables upsert (one cue per payload)
--
-- Non-destructive: ADD COLUMN IF NOT EXISTS + ADD CONSTRAINT IF NOT EXISTS.
-- ============================================================

ALTER TABLE music_cues
  ADD COLUMN IF NOT EXISTS track_artist text,
  ADD COLUMN IF NOT EXISTS duration_ms  bigint,
  ADD COLUMN IF NOT EXISTS preview_url  text;

-- Unique constraint so we can UPSERT (one music cue per render payload).
-- Use DO block to skip if constraint already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'music_cues'::regclass
      AND contype   = 'u'
      AND conname   = 'music_cues_render_payload_id_key'
  ) THEN
    ALTER TABLE music_cues
      ADD CONSTRAINT music_cues_render_payload_id_key
      UNIQUE (render_payload_id);
  END IF;
END $$;

COMMENT ON COLUMN music_cues.track_artist  IS 'Artist name(s) from Epidemic Sound';
COMMENT ON COLUMN music_cues.duration_ms   IS 'Full track duration in milliseconds';
COMMENT ON COLUMN music_cues.preview_url   IS '30-second preview stream URL for selector UI';
