-- ============================================================
-- 007_visual_strategy.sql
-- Product Video Lab: visual strategy column on story_directions.
--
-- PURPOSE
--   Before storyboard generation, a new "visual director" AI pass
--   produces a structured visual_strategy: pacing curve, music intent,
--   color palette, typography scale, and motion intensity per narrative role.
--   This is stored here so the storyboard generator can read it and
--   downstream renders can apply it.
--
-- Non-destructive: ADD COLUMN IF NOT EXISTS, nullable.
-- ============================================================

ALTER TABLE story_directions
  ADD COLUMN IF NOT EXISTS visual_strategy jsonb;

-- visual_strategy JSON schema (documented here for reference):
-- {
--   "pacing_curve": [
--     { "narrative_role": "hook",    "energy_level": 9, "target_duration_s": 3  },
--     { "narrative_role": "problem", "energy_level": 5, "target_duration_s": 6  },
--     { "narrative_role": "shift",   "energy_level": 7, "target_duration_s": 4  },
--     { "narrative_role": "proof",   "energy_level": 8, "target_duration_s": 10 },
--     { "narrative_role": "payoff",  "energy_level": 9, "target_duration_s": 4  },
--     { "narrative_role": "cta",     "energy_level": 6, "target_duration_s": 3  }
--   ],
--   "music_strategy": {
--     "genre": "dark_electronic",
--     "mood": "tense_then_triumphant",
--     "bpm_range": [120, 140],
--     "key_drop_at_narrative_role": "shift",
--     "silence_at_narrative_role": null
--   },
--   "color_palette": {
--     "primary": "#000000",
--     "secondary": "#FFFFFF",
--     "accent": "#5E6AD2",
--     "background": "#000000",
--     "grade": "high_contrast"
--   },
--   "typography": {
--     "weight": "800",
--     "letter_spacing": "tight",
--     "emphasis_style": "scale_pop_white_glow"
--   },
--   "motion_intensity": "dramatic",
--   "transition_style": "directional_wipe",
--   "caption_style": "centered_kinetic",
--   "exemplar_references": ["Linear — This is Linear", "Cursor — The AI Code Editor"],
--   "rationale": "..."
-- }

COMMENT ON COLUMN story_directions.visual_strategy IS
  'AI-generated visual director plan: pacing, music, color, typography, motion intensity. Generated before storyboard, consumed by storyboard generator and renderer.';
