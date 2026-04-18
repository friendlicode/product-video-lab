// Exact database row types -- mirror the SQL schema in 001_initial_schema.sql.
// Use these in services and hooks. The types in index.ts are for the AI
// pipeline layer (generation inputs/outputs, rich domain models).

import type {
  ProjectStatus,
  AssetType,
  TonePreset,
  TargetPlatform,
  RenderStatus,
  SceneType,
  NarrativeRole,
  NarrativeType,
  HookType,
  ApprovalStatus,
  UserRole,
} from './index'

export type DbUser = {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type DbProject = {
  id: string
  internal_name: string
  product_name: string
  product_description: string | null
  target_audience: string | null
  target_platform: TargetPlatform | null
  desired_outcome: string | null
  tone_preset: TonePreset | null
  cta: string | null
  status: ProjectStatus
  created_by: string
  created_at: string
  updated_at: string
  archived_at: string | null
}

export type DbProjectWithCounts = DbProject & {
  asset_count: [{ count: number }]
  brief_count: [{ count: number }]
  direction_count: [{ count: number }]
  script_count: [{ count: number }]
  render_job_count: [{ count: number }]
}

// ─── Cinematic schema types (added in 006_cinematic_schema.sql) ─────────────

export type MotionParams = {
  speed?: number            // 0.5 = slow, 1 = normal, 2 = fast
  easing?: 'linear' | 'spring' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'elastic'
  start_delay?: number      // frames to wait before starting motion
  hold_frames?: number      // frames to hold at final position
  amplitude?: 'subtle' | 'moderate' | 'dramatic'
}

export type RegionOfInterest = {
  x: number       // 0–1 fraction from left
  y: number       // 0–1 fraction from top
  width: number   // 0–1 fraction
  height: number  // 0–1 fraction
}

export type EmphasisBeat = {
  time_ms: number
  type: 'zoom' | 'flash' | 'shake' | 'scale_pop'
  intensity: number   // 0–1
}

export type ColorTheme = {
  primary: string      // hex
  secondary: string
  accent: string
  background: string
}

export type VocalDirection = {
  pace?: 'slow' | 'normal' | 'fast'
  tone?: 'warm' | 'urgent' | 'authoritative' | 'excited' | 'calm'
  pause_before_ms?: number
  emphasis_words?: string[]
}

export type MusicSyncPoint = 'drop' | 'build' | 'release' | 'silence'

export type AssetAnalysisStatus = 'pending' | 'processing' | 'complete' | 'failed'

export type AssetAnalysis = {
  ocr_text?: string
  dominant_colors?: string[]
  detected_regions?: Array<{ label: string; x: number; y: number; w: number; h: number }>
  scene_boundaries_ms?: number[]   // for video assets
  motion_estimate?: 'static' | 'slow_pan' | 'fast_cut' | 'handheld'
  content_summary?: string
  recommended_narrative_role?: string
}

// Caption segment — extended format (006+)
export type CaptionEmphasisWord = {
  word_index: number
  style: 'bold' | 'color' | 'scale' | 'underline'
}

export type CaptionSegment = {
  start_ms: number
  end_ms: number
  text: string
  // new fields (006+):
  emphasis_words?: CaptionEmphasisWord[]
  per_word_timing?: Array<{ word_index: number; start_ms: number; end_ms: number }>
  style_override?: { color?: string; font_size_scale?: number }
}

export type DbMusicCue = {
  id: string
  render_payload_id: string
  track_id: string
  track_title: string | null
  track_artist: string | null  // added in migration 008
  track_url: string | null
  preview_url: string | null   // added in migration 008
  duration_ms: number | null   // added in migration 008
  bpm: number | null
  key_signature: string | null
  mood_tags: string[]
  beat_grid_ms: number[]
  sections: {
    intro_end_ms?: number
    build_end_ms?: number
    drop_end_ms?: number
    outro_start_ms?: number
    // legacy flat format
    intro?: { start_ms: number; end_ms: number }
    build?: { start_ms: number; end_ms: number }
    drop?: { start_ms: number; end_ms: number }
    outro?: { start_ms: number; end_ms: number }
  }
  created_at: string
}

// ─── Updated asset type with analysis fields ──────────────────────────────────

export type DbProjectAsset = {
  id: string
  project_id: string
  asset_type: AssetType
  file_path: string
  file_url: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  width: number | null
  height: number | null
  duration_ms: number | null
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  sort_order: number
  created_by: string
  created_at: string
  // 006+ fields:
  semantic_tags: string[]
  analysis: AssetAnalysis | null
  analysis_status: AssetAnalysisStatus
}

export type DbProductBrief = {
  id: string
  project_id: string
  version_number: number
  audience_summary: string | null
  problem_summary: string | null
  promise_summary: string | null
  benefits: unknown[]
  objections: unknown[]
  proof_points: unknown[]
  visual_highlights: unknown[]
  positioning_notes: Record<string, unknown>
  raw_json: Record<string, unknown>
  generated_by: string
  created_at: string
}

export type DbStoryDirection = {
  id: string
  project_id: string
  version_number: number
  title: string
  angle: string | null
  target_emotion: string | null
  narrative_type: NarrativeType
  story_summary: string | null
  hook_setup: string | null
  tension: string | null
  resolution: string | null
  payoff: string | null
  cta_angle: string | null
  selected: boolean
  raw_json: Record<string, unknown>
  generated_by: string
  created_at: string
}

export type DbHook = {
  id: string
  project_id: string
  story_direction_id: string
  version_number: number
  hook_text: string
  hook_type: HookType
  score: number | null
  rationale: string | null
  selected: boolean
  raw_json: Record<string, unknown>
  generated_by: string
  created_at: string
}

export type DbScript = {
  id: string
  project_id: string
  story_direction_id: string
  selected_hook_id: string | null
  version_number: number
  title: string
  duration_target_seconds: number | null
  full_script: string | null
  voiceover_script: string | null
  cta_script: string | null
  narrative_structure: Record<string, string>
  raw_json: Record<string, unknown>
  selected: boolean
  generated_by: string
  created_at: string
  voice_id: string | null
  audio_url: string | null
}

export type DbStoryboardVersion = {
  id: string
  project_id: string
  script_id: string
  version_number: number
  title: string
  selected: boolean
  raw_json: Record<string, unknown>
  generated_by: string
  created_at: string
}

export type DbStoryboardScene = {
  id: string
  storyboard_version_id: string
  scene_index: number
  scene_type: SceneType
  narrative_role: NarrativeRole
  duration_seconds: number
  asset_id: string | null
  visual_instruction: string | null
  motion_type: string | null
  on_screen_text: string | null
  voiceover_line: string | null
  caption_text: string | null
  callout_text: string | null
  transition_type: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // 006+ cinematic fields:
  motion_params: MotionParams | null
  region_of_interest: RegionOfInterest | null
  emphasis_beats: EmphasisBeat[] | null
  color_theme: ColorTheme | null
  energy_level: number | null
  music_sync_point: MusicSyncPoint | null
  vocal_direction: VocalDirection | null
}

export type DbStoryboardVersionWithScenes = DbStoryboardVersion & {
  storyboard_scenes: DbStoryboardScene[]
}

export type DbCaptionVersion = {
  id: string
  project_id: string
  script_id: string
  storyboard_version_id: string
  version_number: number
  segments: CaptionSegment[]   // 006+: extended with emphasis_words, per_word_timing
  raw_json: Record<string, unknown>
  created_at: string
}

export type DbRenderPayload = {
  id: string
  project_id: string
  storyboard_version_id: string
  script_id: string
  payload: Record<string, unknown>
  aspect_ratio: string
  style_preset: string | null
  created_by: string
  created_at: string
}

export type DbRenderJob = {
  id: string
  project_id: string
  render_payload_id: string
  provider: string
  status: RenderStatus
  progress: number | null
  output_url: string | null
  thumbnail_url: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type DbApproval = {
  id: string
  project_id: string
  version_type: string
  version_id: string
  status: ApprovalStatus
  reviewer_id: string
  notes: string | null
  created_at: string
}

export type DbActivityLog = {
  id: string
  project_id: string
  user_id: string | null
  action_type: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}
