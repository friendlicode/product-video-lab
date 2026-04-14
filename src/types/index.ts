// ─── String Literal Union Types (Enums) ───────────────────────────────────────

export type ProjectStatus =
  | 'draft'
  | 'briefing'
  | 'story_selection'
  | 'scripting'
  | 'storyboarding'
  | 'render_ready'
  | 'rendering'
  | 'review'
  | 'approved'
  | 'archived'

export type AssetType =
  | 'screenshot'
  | 'demo_video'
  | 'logo'
  | 'brand_asset'
  | 'other'

export type TonePreset =
  | 'bold'
  | 'conversational'
  | 'professional'
  | 'founder_raw'
  | 'hype'
  | 'minimal'
  | 'storyteller'

export type TargetPlatform =
  | 'linkedin'
  | 'twitter_x'
  | 'youtube_short'
  | 'youtube_long'
  | 'instagram_reel'
  | 'tiktok'
  | 'website'
  | 'pitch_deck'
  | 'other'

export type RenderStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'canceled'

export type SceneType =
  | 'text_overlay'
  | 'screenshot_pan'
  | 'screenshot_zoom'
  | 'video_clip'
  | 'split_screen'
  | 'logo_reveal'
  | 'cta_card'
  | 'transition_card'
  | 'custom'

export type NarrativeRole =
  | 'hook'
  | 'problem'
  | 'shift'
  | 'proof'
  | 'payoff'
  | 'cta'

export type NarrativeType =
  | 'pain_to_solution'
  | 'before_after'
  | 'contrarian_insight'
  | 'founder_reveal'
  | 'hidden_cost'
  | 'workflow_transformation'
  | 'speed_and_efficiency'
  | 'social_proof'
  | 'category_reframe'

export type HookType =
  | 'question'
  | 'statistic'
  | 'bold_claim'
  | 'pain_point'
  | 'contrarian'
  | 'story_opener'
  | 'visual_hook'

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested'

export type UserRole = 'admin' | 'editor' | 'viewer'

// ─── Core Interfaces ──────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  status: ProjectStatus
  owner_id: string
  thumbnail_url: string | null
  target_platform: TargetPlatform | null
  tone_preset: TonePreset | null
  created_at: string
  updated_at: string
}

export interface ProjectAsset {
  id: string
  project_id: string
  asset_type: AssetType
  file_name: string
  file_url: string
  file_size_bytes: number | null
  mime_type: string | null
  label: string | null
  sort_order: number
  uploaded_by: string
  created_at: string
}

export interface ProductBrief {
  id: string
  project_id: string
  product_name: string
  one_liner: string | null
  core_value_proposition: string | null
  target_audience: string | null
  key_features: string[]
  pain_points: string[]
  differentiators: string[]
  social_proof: string | null
  tone_preset: TonePreset | null
  target_platform: TargetPlatform | null
  raw_input: string | null
  generated_by_ai: boolean
  created_at: string
  updated_at: string
}

export interface StoryDirection {
  id: string
  project_id: string
  brief_id: string
  narrative_type: NarrativeType
  narrative_structure: NarrativeStructure
  title: string
  summary: string
  emotional_arc: string | null
  selected: boolean
  sort_order: number
  created_at: string
}

export interface Hook {
  id: string
  project_id: string
  story_direction_id: string | null
  hook_type: HookType
  text: string
  rationale: string | null
  selected: boolean
  sort_order: number
  created_at: string
}

export interface Script {
  id: string
  project_id: string
  story_direction_id: string
  hook_id: string | null
  title: string
  body: string
  word_count: number | null
  estimated_duration_seconds: number | null
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoryboardVersion {
  id: string
  project_id: string
  script_id: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoryboardScene {
  id: string
  storyboard_version_id: string
  project_id: string
  scene_index: number
  scene_type: SceneType
  narrative_role: NarrativeRole
  headline: string | null
  body_copy: string | null
  speaker_notes: string | null
  asset_id: string | null
  asset_url: string | null
  duration_seconds: number | null
  transition: string | null
  animation: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CaptionVersion {
  id: string
  project_id: string
  script_id: string
  version: number
  segments: CaptionSegment[]
  language_code: string
  is_active: boolean
  created_at: string
}

export interface RenderPayload {
  id: string
  project_id: string
  storyboard_version_id: string
  script_id: string
  caption_version_id: string | null
  payload: RenderPayloadSchema
  created_at: string
}

export interface RenderJob {
  id: string
  project_id: string
  render_payload_id: string
  status: RenderStatus
  progress_pct: number | null
  output_url: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  project_id: string
  render_job_id: string
  reviewer_id: string
  status: ApprovalStatus
  feedback: string | null
  reviewed_at: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  project_id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Composite / Value Types ──────────────────────────────────────────────────

export interface NarrativeStructure {
  hook: string
  problem: string
  shift: string
  proof: string
  payoff: string
  cta: string
}

export interface CaptionSegment {
  start_ms: number
  end_ms: number
  text: string
}

export interface StoryValidation {
  isComplete: boolean
  coverage: Record<
    NarrativeRole,
    {
      present: boolean
      strength: 'strong' | 'weak' | 'missing'
    }
  >
  warnings: string[]
}

// ─── Render Payload Schema ────────────────────────────────────────────────────

export interface RenderPayloadScene {
  scene_index: number
  scene_type: SceneType
  narrative_role: NarrativeRole
  headline: string | null
  body_copy: string | null
  speaker_notes: string | null
  asset_url: string | null
  duration_seconds: number
  transition: string | null
  animation: string | null
  captions: CaptionSegment[]
  metadata: Record<string, unknown>
}

export interface RenderPayloadSchema {
  project_id: string
  project_name: string
  target_platform: TargetPlatform
  tone_preset: TonePreset
  script_body: string
  scenes: RenderPayloadScene[]
  total_duration_seconds: number
  language_code: string
  created_at: string
}

// ─── Pipeline Generation Input / Output Types ─────────────────────────────────

export interface GenerateBriefInput {
  project_id: string
  raw_input: string
  tone_preset?: TonePreset
  target_platform?: TargetPlatform
}

export interface GenerateBriefOutput {
  brief: Omit<ProductBrief, 'id' | 'created_at' | 'updated_at'>
}

export interface GenerateStoryDirectionsInput {
  project_id: string
  brief_id: string
  count?: number
}

export interface GenerateStoryDirectionsOutput {
  directions: Omit<StoryDirection, 'id' | 'created_at'>[]
}

export interface GenerateHooksInput {
  project_id: string
  story_direction_id: string
  count?: number
}

export interface GenerateHooksOutput {
  hooks: Omit<Hook, 'id' | 'created_at'>[]
}

export interface GenerateScriptInput {
  project_id: string
  story_direction_id: string
  hook_id?: string
  tone_preset?: TonePreset
  target_platform?: TargetPlatform
}

export interface GenerateScriptOutput {
  script: Omit<Script, 'id' | 'created_at' | 'updated_at'>
}

export interface GenerateStoryboardInput {
  project_id: string
  script_id: string
  asset_ids?: string[]
}

export interface GenerateStoryboardOutput {
  storyboard_version: Omit<StoryboardVersion, 'id' | 'created_at' | 'updated_at'>
  scenes: Omit<StoryboardScene, 'id' | 'created_at' | 'updated_at'>[]
}

export interface GenerateCaptionsInput {
  project_id: string
  script_id: string
  language_code?: string
}

export interface GenerateCaptionsOutput {
  caption_version: Omit<CaptionVersion, 'id' | 'created_at'>
}

export interface GenerateRenderPayloadInput {
  project_id: string
  storyboard_version_id: string
  script_id: string
  caption_version_id?: string
}

export interface GenerateRenderPayloadOutput {
  render_payload: RenderPayloadSchema
}
