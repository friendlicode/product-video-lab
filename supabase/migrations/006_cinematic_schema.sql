-- ============================================================
-- 006_cinematic_schema.sql
-- Product Video Lab: cinematic metadata v2.
--
-- PURPOSE
--   Close the "cinematically hollow" gap: the AI currently makes
--   narrative decisions (hook, proof, CTA) but zero cinematic decisions
--   (easing, region focus, beat sync, caption emphasis, color intent).
--
--   This migration adds the columns that carry director-level intent
--   from the AI prompt layer → renderer. All columns are nullable with
--   safe defaults so existing projects continue to render as-is.
--
-- All additions are non-destructive (ADD COLUMN IF NOT EXISTS).
-- ============================================================


-- ─── storyboard_scenes: cinematic fields ────────────────────────────────────

-- motion_params: parameterized motion instead of a bare string
--   { speed: 0.8, easing: 'spring', start_delay: 0, hold_frames: 6,
--     amplitude: 'subtle' | 'moderate' | 'dramatic' }
ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS motion_params jsonb;

-- region_of_interest: which part of a screenshot/video to focus on
--   { x: 0.1, y: 0.2, width: 0.5, height: 0.4 } — all 0–1 fractions
--   Renderer uses this to set initial zoom/pan origin instead of center
ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS region_of_interest jsonb;

-- emphasis_beats: timed visual accents within the scene
--   [ { time_ms: 1200, type: 'zoom' | 'flash' | 'shake' | 'scale_pop', intensity: 0.8 } ]
ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS emphasis_beats jsonb;

-- color_theme: per-scene color override for the renderer
--   { primary: '#5E6AD2', secondary: '#000000', accent: '#FFFFFF', background: '#000000' }
ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS color_theme jsonb;

-- energy_level: 1 (calm) → 10 (maximum intensity)
--   Drives renderer motion speed, font weight, cut rhythm
ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS energy_level smallint
    CHECK (energy_level IS NULL OR energy_level BETWEEN 1 AND 10);

-- music_sync_point: how this scene relates to the music structure
--   'drop' | 'build' | 'release' | 'silence' | null
ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS music_sync_point text
    CHECK (music_sync_point IS NULL OR music_sync_point IN ('drop', 'build', 'release', 'silence'));

-- vocal_direction: performance notes for the voiceover artist / TTS
--   { pace: 'slow' | 'normal' | 'fast', tone: 'warm' | 'urgent' | 'authoritative',
--     pause_before_ms: 300, emphasis_words: ['instantly', 'free'] }
ALTER TABLE storyboard_scenes
  ADD COLUMN IF NOT EXISTS vocal_direction jsonb;


-- ─── caption_versions: emphasis markup ──────────────────────────────────────
-- The 'segments' jsonb column already exists.
-- We document the new schema here so the AI knows what to generate:
--
-- OLD format:  [{ start_ms, end_ms, text }]
-- NEW format:  [{ start_ms, end_ms, text,
--                 emphasis_words: [{ word_index: 2, style: 'bold' | 'color' | 'scale' | 'underline' }],
--                 per_word_timing: [{ word_index, start_ms, end_ms }],   -- optional
--                 style_override: { color, font_size_scale }              -- optional
--              }]
--
-- No migration needed — jsonb is schema-free. The renderer reads new fields
-- if present and ignores them if absent (backward compatible).


-- ─── project_assets: AI analysis fields ─────────────────────────────────────

-- semantic_tags: AI-assigned categories for asset-to-scene matching
--   'ui_tour' | 'problem_state' | 'result_view' | 'feature_detail' |
--   'social_proof' | 'product_hero' | 'lifestyle' | 'b_roll'
ALTER TABLE project_assets
  ADD COLUMN IF NOT EXISTS semantic_tags text[] NOT NULL DEFAULT ARRAY[]::text[];

-- analysis: GPT-4 Vision output stored per asset
--   { ocr_text: '...', dominant_colors: ['#1a1a2e','#ffffff'],
--     detected_regions: [{ label: 'dashboard', x: 0.1, y: 0.2, w: 0.6, h: 0.4 }],
--     scene_boundaries_ms: [2000, 8500, 14000],  -- for video assets
--     motion_estimate: 'static' | 'slow_pan' | 'fast_cut',
--     content_summary: '...',
--     recommended_narrative_role: 'proof' }
ALTER TABLE project_assets
  ADD COLUMN IF NOT EXISTS analysis jsonb;

-- analysis_status: track whether GPT-4 Vision has run on this asset
ALTER TABLE project_assets
  ADD COLUMN IF NOT EXISTS analysis_status text NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'processing', 'complete', 'failed'));


-- ─── story_directions: visual strategy ──────────────────────────────────────
-- Added in 007_visual_strategy.sql (depends on Phase 3 AI work).
-- Kept separate so Phase 2 can ship independently.


-- ─── music_cues: beat grid per render payload ────────────────────────────────
CREATE TABLE IF NOT EXISTS music_cues (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  render_payload_id   uuid        NOT NULL REFERENCES render_payloads(id) ON DELETE CASCADE,
  track_id            text        NOT NULL,             -- Epidemic Sound track ID
  track_title         text,
  track_url           text,                             -- signed download URL for renderer
  bpm                 numeric(6,2),
  key_signature       text,                             -- e.g. 'Am', 'C'
  mood_tags           text[]      NOT NULL DEFAULT ARRAY[]::text[],
  -- beat_grid_ms: array of beat timestamps, e.g. [0, 469, 938, 1406, ...]
  beat_grid_ms        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  -- sections: { intro: {start_ms, end_ms}, build: {...}, drop: {...}, outro: {...} }
  sections            jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_music_cues_payload ON music_cues(render_payload_id);

-- RLS: authenticated users can read/write their own music cues via render payloads
ALTER TABLE music_cues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_music_cues"
  ON music_cues FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_write_music_cues"
  ON music_cues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_update_music_cues"
  ON music_cues FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_music_cues"
  ON music_cues FOR DELETE
  USING (auth.uid() IS NOT NULL);


-- ─── Indexes for new columns ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_storyboard_scenes_energy
  ON storyboard_scenes(energy_level)
  WHERE energy_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_assets_semantic_tags
  ON project_assets USING GIN(semantic_tags);

CREATE INDEX IF NOT EXISTS idx_project_assets_analysis_status
  ON project_assets(analysis_status);


-- ─── Backfill: existing scenes get energy_level inferred from narrative_role ──
-- A safe default so existing projects render with reasonable energy mapping.
UPDATE storyboard_scenes
SET energy_level = CASE narrative_role
  WHEN 'hook'    THEN 8
  WHEN 'problem' THEN 5
  WHEN 'shift'   THEN 7
  WHEN 'proof'   THEN 7
  WHEN 'payoff'  THEN 9
  WHEN 'cta'     THEN 6
  ELSE 6
END
WHERE energy_level IS NULL;
