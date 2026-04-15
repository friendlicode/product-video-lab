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
  segments: Array<{ start_ms: number; end_ms: number; text: string }>
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
