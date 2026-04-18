-- ============================================================
-- 004_exemplars.sql
-- Product Video Lab: reference video exemplar library.
--
-- PURPOSE
--   The AI pipeline needs grounded "taste" — it should reason from real
--   viral / YC-level product marketing videos instead of generic abstractions.
--   This table stores a hand-curated library of reference videos, each
--   deeply annotated (pacing, narrative, music strategy, visual language).
--
--   Prompts in src/lib/openai.ts inject 2–3 relevant exemplars as few-shot
--   context when generating briefs, scripts, storyboards, and captions.
--
-- Consistent with the authenticated_* RLS model in 001_initial_schema.sql.
-- ============================================================

-- ─── Product category enum (used for exemplar selection) ────────────────────
CREATE TYPE exemplar_category AS ENUM (
  'b2b_saas',
  'consumer',
  'devtools',
  'ai_app',
  'fintech',
  'productivity',
  'hardware',
  'creative_tool',
  'other'
);


-- ─── Main exemplars table ───────────────────────────────────────────────────
CREATE TABLE video_exemplars (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  title               text NOT NULL,                 -- "Linear 2025 Launch"
  brand               text,                          -- "Linear"
  url                 text NOT NULL,                 -- YouTube / Vimeo / source
  source_notes        text,                          -- any context about the video

  -- Shape
  product_category    exemplar_category NOT NULL DEFAULT 'other',
  duration_seconds    numeric(6,2) NOT NULL,
  aspect_ratio        text NOT NULL DEFAULT '16:9',  -- '9:16' | '16:9' | '1:1' | '4:5'

  -- The hook: what makes the first 2–3 seconds work
  hook_pattern        text,

  -- Deep structural annotations (JSONB so we can evolve schema without migrations)
  -- narrative_structure: array of scene-like objects
  --   [{ start_ms, end_ms, scene_type, narrative_role, motion, on_screen_text,
  --      voiceover_line, music_beat_alignment, key_technique }]
  narrative_structure jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- pacing_curve: energy level over time
  --   { curve: [{ time_ms, energy_0_10 }], notes: "slow-burn intro, build at 00:08, drop at 00:14" }
  pacing_curve        jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- music_strategy: how music drives the video
  --   { bpm, genre, mood, drop_points_ms: [...], build_points_ms: [...],
  --     silence_moments_ms: [...], sync_to_cuts: true }
  music_strategy      jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- visual_language: typography / color / motion principles observed
  --   { typography: { primary_family, weight_scale, emphasis_style },
  --     color: { palette: [...], grade },
  --     motion_principles: [...] }
  visual_language     jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- caption_style: how captions are used for rhythm + emphasis
  --   { positioning, emphasis_pattern, word_grouping, typography_hierarchy }
  caption_style       jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- key_techniques: short tags describing what's special about this video
  --   e.g. ['match_cut_reveal', 'kinetic_typography', 'beat_drop_zoom']
  key_techniques      text[] NOT NULL DEFAULT ARRAY[]::text[],

  -- Curator metadata
  curator_notes       text,         -- free-form director's commentary
  quality_score       smallint CHECK (quality_score BETWEEN 1 AND 10) DEFAULT 8,
  is_active           boolean NOT NULL DEFAULT true,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_exemplars_category ON video_exemplars(product_category) WHERE is_active;
CREATE INDEX idx_video_exemplars_active   ON video_exemplars(is_active);

-- updated_at trigger (follows the pattern from 001)
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: 001 already defines touch_updated_at; use CREATE OR REPLACE so this is idempotent.

CREATE TRIGGER trg_video_exemplars_updated
  BEFORE UPDATE ON video_exemplars
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE video_exemplars ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read exemplars (they drive AI generation for everyone).
CREATE POLICY "authenticated_read_exemplars"
  ON video_exemplars FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can insert / update / delete exemplars (curation is admin-only).
CREATE POLICY "admin_write_exemplars"
  ON video_exemplars FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "admin_update_exemplars"
  ON video_exemplars FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "admin_delete_exemplars"
  ON video_exemplars FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
