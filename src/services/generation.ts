/**
 * AI Generation Pipeline
 * Each function calls OpenAI, parses structured JSON, and persists to Supabase.
 */
import { supabase } from '@/lib/supabase'
import { callOpenAI } from '@/lib/openai'
import type { OpenAIMessage } from '@/lib/openai'
import { getSettings } from '@/lib/settings'
import { logActivity } from './activity'
import { saveBrief, getLatestBrief } from './briefs'
import { saveStoryDirections, getStoryDirections } from './stories'
import { saveHooks } from './hooks'
import { saveScript } from './scripts'
import { saveStoryboard, getStoryboardWithScenes } from './storyboards'
import { createRenderPayload } from './rendering'
import { getProjectAssets } from './assets'
import { getExemplarsByCategory, type DbVideoExemplar, type ExemplarCategory } from './exemplars'
import { formatAssetForPrompt } from './assetAnalysis'
import type {
  DbProductBrief,
  DbStoryDirection,
  DbHook,
  DbScript,
  DbStoryboardScene,
  DbStoryboardVersionWithScenes,
  DbCaptionVersion,
  DbRenderPayload,
} from '@/types/db'
import type { NarrativeRole, NarrativeType, HookType, SceneType, TargetPlatform } from '@/types/index'

// ─── Exemplar injection helpers ───────────────────────────────────────────────

function mapProductCategoryToExemplar(
  category: string | null,
  platform: string | null
): ExemplarCategory[] {
  const cats: ExemplarCategory[] = []
  if (category?.includes('saas') || category?.includes('b2b')) cats.push('b2b_saas')
  if (category?.includes('ai') || category?.includes('ml')) cats.push('ai_app')
  if (category?.includes('dev') || category?.includes('code')) cats.push('devtools')
  if (platform === 'tiktok' || platform === 'instagram_reel') cats.push('consumer')
  if (cats.length === 0) cats.push('b2b_saas', 'ai_app')  // sensible default
  return cats
}

function formatExemplarForPrompt(ex: DbVideoExemplar): string {
  const ns = ex.narrative_structure as Array<Record<string, unknown>>
  const sceneDescriptions = ns.slice(0, 4).map((s) =>
    `  Scene ${(s.scene_index as number) + 1} (${s.narrative_role}, ${s.end_ms as number - (s.start_ms as number)}ms): ${s.notes}`
  ).join('\n')

  return `--- EXEMPLAR: ${ex.title} (${ex.brand}) ---
Hook pattern: ${ex.hook_pattern ?? 'N/A'}
Key techniques: ${ex.key_techniques.join(', ')}
Music strategy: ${JSON.stringify(ex.music_strategy)}
Pacing notes: ${(ex.pacing_curve as Record<string, string>).notes ?? 'N/A'}
Scene breakdown (first 4):
${sceneDescriptions}
Curator insight: ${ex.curator_notes ?? 'N/A'}
---`
}

async function getExemplarsForProject(
  projectCategory: string | null,
  platform: string | null
): Promise<DbVideoExemplar[]> {
  try {
    const cats = mapProductCategoryToExemplar(projectCategory, platform)
    return await getExemplarsByCategory(cats, 3)
  } catch {
    return []  // non-fatal; degrade gracefully if exemplars table not yet migrated
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

function aspectRatioForPlatform(platform: TargetPlatform | null): string {
  switch (platform) {
    case 'youtube_long':
    case 'website':
    case 'pitch_deck':
      return '16:9'
    case 'linkedin':
      return '1:1'
    default:
      return '9:16'
  }
}

// ─── 1. generateProductBrief ──────────────────────────────────────────────────

export async function generateProductBrief(projectId: string): Promise<DbProductBrief> {
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (projErr || !project) throw new Error('Project not found')

  const assets = await getProjectAssets(projectId)
  const imageAssets = assets.filter((a) => a.mime_type?.startsWith('image/') && a.file_url)

  const systemPrompt = `You are a B2B SaaS product marketing strategist. Analyze the product information and screenshots provided. Return a JSON object with these exact keys: audience_summary (string), problem_summary (string), promise_summary (string), benefits (array of strings), objections (array of strings), proof_points (array of strings), visual_highlights (array of strings describing what's notable in the screenshots — leave empty if no images), positioning_notes (object where each value is a string).`

  const textContent = [
    `Product Name: ${project.product_name}`,
    `Description: ${project.product_description ?? 'N/A'}`,
    `Target Audience: ${project.target_audience ?? 'N/A'}`,
    `Desired Outcome: ${project.desired_outcome ?? 'N/A'}`,
    `CTA: ${project.cta ?? 'N/A'}`,
    `Platform: ${project.target_platform ?? 'N/A'}`,
    `Tone: ${project.tone_preset ?? 'N/A'}`,
  ].join('\n')

  const userContent: OpenAIMessage['content'] = imageAssets.length > 0
    ? [
        { type: 'text', text: textContent },
        ...imageAssets.slice(0, 5).map((a) => ({
          type: 'image_url' as const,
          image_url: { url: a.file_url },
        })),
      ]
    : textContent

  const { data: raw } = await callOpenAI<Record<string, unknown>>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { model: getSettings().highStakesModel, response_format: { type: 'json_object' } }
  )

  const userId = await getCurrentUserId()
  const brief = await saveBrief(projectId, {
    audience_summary: typeof raw.audience_summary === 'string' ? raw.audience_summary : null,
    problem_summary: typeof raw.problem_summary === 'string' ? raw.problem_summary : null,
    promise_summary: typeof raw.promise_summary === 'string' ? raw.promise_summary : null,
    benefits: Array.isArray(raw.benefits) ? raw.benefits : [],
    objections: Array.isArray(raw.objections) ? raw.objections : [],
    proof_points: Array.isArray(raw.proof_points) ? raw.proof_points : [],
    visual_highlights: Array.isArray(raw.visual_highlights) ? raw.visual_highlights : [],
    positioning_notes:
      raw.positioning_notes && typeof raw.positioning_notes === 'object' && !Array.isArray(raw.positioning_notes)
        ? (raw.positioning_notes as Record<string, unknown>)
        : {},
    raw_json: raw,
    generated_by: 'ai',
  })

  await logActivity(projectId, userId, 'generated_brief', 'product_briefs', brief.id, {
    version_number: brief.version_number,
  })
  return brief
}

// ─── 2. generateStoryDirections ──────────────────────────────────────────────

export async function generateStoryDirections(
  projectId: string,
  briefId: string
): Promise<DbStoryDirection[]> {
  const { data: brief, error: briefErr } = await supabase
    .from('product_briefs')
    .select('*')
    .eq('id', briefId)
    .single()
  if (briefErr || !brief) throw new Error('Brief not found')

  const systemPrompt = `You are a story strategist for short-form B2B product marketing videos. Given a product brief, generate 4 story directions. Each represents a different narrative angle for a 30-60 second product video. Return a JSON object with key "directions" as an array. Each direction must have: title (string), angle (string), target_emotion (string), narrative_type (one of: pain_to_solution, before_after, contrarian_insight, founder_reveal, hidden_cost, workflow_transformation, speed_and_efficiency, social_proof, category_reframe), story_summary (string), hook_setup (string), tension (string), resolution (string), payoff (string), cta_angle (string). Make each direction meaningfully different in approach and emotional tone.`

  const userContent = [
    `Audience: ${brief.audience_summary ?? 'N/A'}`,
    `Problem: ${brief.problem_summary ?? 'N/A'}`,
    `Promise: ${brief.promise_summary ?? 'N/A'}`,
    `Benefits: ${(brief.benefits as string[]).slice(0, 5).join(', ')}`,
    `Proof Points: ${(brief.proof_points as string[]).slice(0, 3).join(', ')}`,
    `Objections to address: ${(brief.objections as string[]).slice(0, 3).join(', ')}`,
  ].join('\n')

  const { data: raw } = await callOpenAI<{ directions: Record<string, unknown>[] }>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { model: getSettings().highStakesModel, response_format: { type: 'json_object' } }
  )

  const rawDirections = Array.isArray(raw?.directions) ? raw.directions : []

  const existing = await getStoryDirections(projectId)
  const nextVersion =
    existing.length > 0 ? Math.max(...existing.map((d) => d.version_number)) + 1 : 1

  const directionsToSave = rawDirections.map((d) => ({
    version_number: nextVersion,
    title: String(d.title ?? 'Untitled Direction'),
    angle: typeof d.angle === 'string' ? d.angle : null,
    target_emotion: typeof d.target_emotion === 'string' ? d.target_emotion : null,
    narrative_type: (d.narrative_type as NarrativeType) ?? 'pain_to_solution',
    story_summary: typeof d.story_summary === 'string' ? d.story_summary : null,
    hook_setup: typeof d.hook_setup === 'string' ? d.hook_setup : null,
    tension: typeof d.tension === 'string' ? d.tension : null,
    resolution: typeof d.resolution === 'string' ? d.resolution : null,
    payoff: typeof d.payoff === 'string' ? d.payoff : null,
    cta_angle: typeof d.cta_angle === 'string' ? d.cta_angle : null,
    raw_json: d,
    generated_by: 'ai',
  }))

  const userId = await getCurrentUserId()
  const directions = await saveStoryDirections(projectId, directionsToSave)

  await logActivity(projectId, userId, 'generated_story_directions', 'story_directions', undefined, {
    count: directions.length,
    brief_id: briefId,
  })
  return directions
}

// ─── 3. generateHooks ────────────────────────────────────────────────────────

export async function generateHooks(
  projectId: string,
  storyDirectionId: string
): Promise<DbHook[]> {
  const { data: direction, error: dirErr } = await supabase
    .from('story_directions')
    .select('*')
    .eq('id', storyDirectionId)
    .single()
  if (dirErr || !direction) throw new Error('Story direction not found')

  const brief = await getLatestBrief(projectId)

  const systemPrompt = `You are a hook writer for short-form B2B product videos. Given a story direction, generate 6 hooks. Each hook should grab attention in the first 2-3 seconds. Return JSON with key "hooks" as an array. Each hook: hook_text (string), hook_type (one of: question, statistic, bold_claim, pain_point, contrarian, story_opener, visual_hook), score (number 1-10), rationale (string). Hooks must directly connect to the story direction's tension and transformation.`

  const userContent = [
    `Story Direction: ${direction.title}`,
    `Angle: ${direction.angle ?? 'N/A'}`,
    `Target Emotion: ${direction.target_emotion ?? 'N/A'}`,
    `Tension: ${direction.tension ?? 'N/A'}`,
    `Payoff: ${direction.payoff ?? 'N/A'}`,
    `Hook Setup: ${direction.hook_setup ?? 'N/A'}`,
    brief ? `Product Problem: ${brief.problem_summary ?? 'N/A'}` : '',
    brief ? `Product Promise: ${brief.promise_summary ?? 'N/A'}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const { data: raw } = await callOpenAI<{ hooks: Record<string, unknown>[] }>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { model: getSettings().lightweightModel, response_format: { type: 'json_object' } }
  )

  const rawHooks = Array.isArray(raw?.hooks) ? raw.hooks : []
  const hooksToSave = rawHooks.map((h) => ({
    version_number: 1,
    hook_text: String(h.hook_text ?? ''),
    hook_type: (h.hook_type as HookType) ?? 'bold_claim',
    score: typeof h.score === 'number' ? h.score : null,
    rationale: typeof h.rationale === 'string' ? h.rationale : null,
    raw_json: h,
    generated_by: 'ai',
  }))

  const userId = await getCurrentUserId()
  const hooks = await saveHooks(projectId, storyDirectionId, hooksToSave)

  await logActivity(projectId, userId, 'generated_hooks', 'hooks', undefined, {
    count: hooks.length,
    story_direction_id: storyDirectionId,
  })
  return hooks
}

// ─── 4. generateScript ───────────────────────────────────────────────────────

export async function generateScript(
  projectId: string,
  storyDirectionId: string,
  hookId: string
): Promise<DbScript> {
  const [{ data: direction, error: dirErr }, { data: hook, error: hookErr }, { data: project, error: projErr }] =
    await Promise.all([
      supabase.from('story_directions').select('*').eq('id', storyDirectionId).single(),
      supabase.from('hooks').select('*').eq('id', hookId).single(),
      supabase.from('projects').select('*').eq('id', projectId).single(),
    ])
  if (dirErr || !direction) throw new Error('Story direction not found')
  if (hookErr || !hook) throw new Error('Hook not found')
  if (projErr || !project) throw new Error('Project not found')

  const brief = await getLatestBrief(projectId)

  const platformDuration: Record<string, number> = {
    linkedin: 45,
    twitter_x: 30,
    youtube_short: 60,
    youtube_long: 90,
    instagram_reel: 60,
    tiktok: 60,
    website: 60,
    pitch_deck: 120,
    other: 60,
  }
  const targetDuration = platformDuration[project.target_platform ?? 'other'] ?? 60

  const exemplars = await getExemplarsForProject(project.product_description, project.target_platform)
  const exemplarScriptBlock = exemplars.length > 0
    ? `\n\nREFERENCE SCRIPTS — Study how these world-class product videos structure their voiceover. Note the pacing, brevity, and emphasis patterns:\n\n${exemplars.map((ex) => {
        const ns = ex.narrative_structure as Array<Record<string, unknown>>
        const voiceoverLines = ns.filter((s) => s.voiceover_line).map((s) => `  ${s.narrative_role}: "${s.voiceover_line}"`).join('\n')
        return `${ex.brand} (${ex.duration_seconds}s):\n${voiceoverLines || '  [Music and text only — no voiceover]'}\nPacing: ${(ex.pacing_curve as Record<string, string>).notes ?? 'N/A'}`
      }).join('\n\n')}`
    : ''

  const systemPrompt = `You are a scriptwriter and creative director for short-form product marketing videos. Your scripts feel like they came from the best YC Demo Day pitches — crisp, human, and magnetic.

Write a complete video script. Return JSON with:
- title: string
- duration_target_seconds: number
- full_script: string (readable block, all sections combined)
- voiceover_script: string (narration only — words spoken aloud)
- cta_script: string (call to action text)
- narrative_structure: object with exactly these keys (1–3 sentences each): { hook, problem, shift, proof, payoff, cta }
- music_cue_points: array of { narrative_role, type: "drop"|"build"|"silence"|"release", description: string }
- vocal_notes: object with keys matching narrative_structure, each containing: { pace: "slow"|"normal"|"fast", tone: "warm"|"urgent"|"authoritative"|"excited"|"calm", emphasis_words: string[], pause_after: boolean }

STYLE RULES:
- Hook: The exact hook text provided, verbatim. No additions.
- Problem: Empathy first. One sharp sentence that makes the audience nod.
- Shift: Short. The product name appears here. No features yet.
- Proof: Specific. Name what the product does. Use numbers if available.
- Payoff: The brand promise. 1 sentence. Make it land.
- CTA: Confident. Never end with "just". Never end with "simple". Be direct.
- No corporate jargon. No "leverage", "utilize", "synergy", "seamlessly".
- Target duration: ${targetDuration}s — be ruthless about brevity.${exemplarScriptBlock}`

  const userContent = [
    `Product: ${project.product_name}`,
    `Platform: ${project.target_platform ?? 'other'} | Tone: ${project.tone_preset ?? 'conversational'}`,
    `CTA: ${project.cta ?? 'N/A'}`,
    ``,
    `Story Direction: ${direction.title}`,
    `Angle: ${direction.angle ?? 'N/A'}`,
    `Tension: ${direction.tension ?? 'N/A'}`,
    `Payoff: ${direction.payoff ?? 'N/A'}`,
    `CTA Angle: ${direction.cta_angle ?? 'N/A'}`,
    ``,
    `Opening hook (use VERBATIM, no changes): "${hook.hook_text}"`,
    brief
      ? `\nProduct Context:\nAudience: ${brief.audience_summary}\nProblem: ${brief.problem_summary}\nPromise: ${brief.promise_summary}`
      : '',
  ]
    .filter((l) => l !== '')
    .join('\n')

  const { data: raw } = await callOpenAI<Record<string, unknown>>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { model: getSettings().highStakesModel, response_format: { type: 'json_object' } }
  )

  const userId = await getCurrentUserId()
  const script = await saveScript(projectId, {
    story_direction_id: storyDirectionId,
    selected_hook_id: hookId,
    title: typeof raw.title === 'string' ? raw.title : `${project.product_name} Script`,
    duration_target_seconds:
      typeof raw.duration_target_seconds === 'number' ? raw.duration_target_seconds : null,
    full_script: typeof raw.full_script === 'string' ? raw.full_script : null,
    voiceover_script: typeof raw.voiceover_script === 'string' ? raw.voiceover_script : null,
    cta_script: typeof raw.cta_script === 'string' ? raw.cta_script : null,
    narrative_structure: (raw.narrative_structure as Record<string, string>) ?? {},
    raw_json: raw,
    generated_by: 'ai',
  })

  // Advance project status to scripting
  await supabase
    .from('projects')
    .update({ status: 'scripting' })
    .eq('id', projectId)
    .in('status', ['draft', 'briefing', 'story_selection'])

  await logActivity(projectId, userId, 'generated_script', 'scripts', script.id)
  return script
}

// ─── 5. generateStoryboard ───────────────────────────────────────────────────

export async function generateStoryboard(
  projectId: string,
  scriptId: string
): Promise<DbStoryboardVersionWithScenes> {
  const [{ data: script, error: scriptErr }, { data: project, error: projErr }] = await Promise.all(
    [
      supabase.from('scripts').select('*').eq('id', scriptId).single(),
      supabase.from('projects').select('*').eq('id', projectId).single(),
    ]
  )
  if (scriptErr || !script) throw new Error('Script not found')
  if (projErr || !project) throw new Error('Project not found')

  const [assets, exemplars] = await Promise.all([
    getProjectAssets(projectId),
    getExemplarsForProject(project.product_description, project.target_platform),
  ])

  const exemplarBlock = exemplars.length > 0
    ? `\n\nREFERENCE EXEMPLARS — Study these world-class product marketing videos. Use their pacing, motion choices, and cinematic techniques as inspiration:\n\n${exemplars.map(formatExemplarForPrompt).join('\n\n')}`
    : ''

  // Use rich asset descriptions if analysis has run, fall back to filename
  const assetList = assets.length > 0
    ? assets.map((a) => formatAssetForPrompt({
        id: a.id,
        file_name: a.file_name,
        asset_type: a.asset_type,
        semantic_tags: a.semantic_tags ?? [],
        analysis: a.analysis,
      })).join('\n')
    : 'None available.'

  const systemPrompt = `You are a creative director for short-form product marketing videos. You combine the roles of cinematographer, editor, and motion designer.

Given a script, available assets (with AI analysis), and reference exemplars from world-class product videos, create a scene-by-scene storyboard that feels like a YC-level launch video.

PACING RULES (enforce strictly):
- hook: 2–3 seconds max. Must grab attention immediately.
- problem: 4–8 seconds. Build empathy.
- shift: 3–5 seconds. The product appears. Make it feel like relief.
- proof: 6–15 seconds total (can be multiple scenes). Show the product doing real things.
- payoff: 2–5 seconds. The brand promise moment.
- cta: 2–4 seconds. Clear, confident, no clutter.

Return JSON with key "scenes" as an array. Each scene must include ALL of these fields:
- scene_index: number (0-based)
- scene_type: one of: text_overlay, screenshot_pan, screenshot_zoom, video_clip, split_screen, logo_reveal, cta_card, transition_card
- narrative_role: one of: hook, problem, shift, proof, payoff, cta
- duration_seconds: number (follow pacing rules above)
- visual_instruction: string (specific camera/motion direction, e.g. "Start at bottom-left of dashboard, spring-zoom to top navigation in 1.5s")
- motion_type: string (e.g. spring_zoom_in, pan_left, fade_in, slide_up, static, kinetic_text_reveal)
- motion_params: object { speed: 0.5–2.0, easing: "spring"|"ease_in_out"|"elastic"|"linear", amplitude: "subtle"|"moderate"|"dramatic" }
- region_of_interest: object { x: 0.0–1.0, y: 0.0–1.0, width: 0.0–1.0, height: 0.0–1.0 } or null (only for screenshot scenes — which UI region to focus on)
- emphasis_beats: array of { time_ms, type: "zoom"|"flash"|"scale_pop", intensity: 0.0–1.0 } or null (visual accents within this scene)
- energy_level: number 1–10 (1=calm, 10=maximum)
- music_sync_point: "drop"|"build"|"release"|"silence"|null (how this scene relates to music)
- color_theme: object { primary, secondary, accent, background } hex colors, or null (if this scene needs a specific palette)
- on_screen_text: string or null
- voiceover_line: string or null
- caption_text: string or null (shorter version of voiceover for caption display)
- vocal_direction: object { pace: "slow"|"normal"|"fast", tone: "warm"|"urgent"|"authoritative"|"excited", pause_before_ms: number, emphasis_words: string[] } or null
- transition_type: "cut"|"fade"|"dissolve"|"slide"
- asset_id: string from the provided asset list, or null (use semantic analysis to pick the RIGHT asset for this scene's narrative role)

ASSET SELECTION: Use the asset analysis (semantic_tags, recommended_narrative_role, content_summary) to pick the most appropriate asset for each scene. Do NOT assign assets sequentially — assign them by narrative fit.

Create 6–10 scenes. Every narrative role (hook, problem, shift, proof, payoff, cta) must appear at least once.${exemplarBlock}`

  const narrativeText = Object.entries(script.narrative_structure)
    .map(([role, text]) => `${role.toUpperCase()}: ${text}`)
    .join('\n\n')

  const userContent = [
    `Product: ${project.product_name}`,
    `Platform: ${project.target_platform ?? 'N/A'} | Tone: ${project.tone_preset ?? 'conversational'}`,
    `Script: ${script.title} (${script.duration_target_seconds ?? 60}s target)`,
    ``,
    `Narrative Structure:`,
    narrativeText,
    script.full_script ? `\nFull Script:\n${script.full_script}` : '',
    `\nAvailable Assets (AI-analyzed):\n${assetList}`,
  ]
    .filter((l) => l !== '')
    .join('\n')

  const { data: raw } = await callOpenAI<{ scenes: Record<string, unknown>[] }>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { model: getSettings().highStakesModel, response_format: { type: 'json_object' } }
  )

  const rawScenes = Array.isArray(raw?.scenes) ? raw.scenes : []
  const assetIds = new Set(assets.map((a) => a.id))

  const scenes = rawScenes.map((s, i) => ({
    scene_index: typeof s.scene_index === 'number' ? s.scene_index : i,
    scene_type: (s.scene_type as SceneType) ?? 'text_overlay',
    narrative_role: (s.narrative_role as NarrativeRole) ?? 'hook',
    duration_seconds: typeof s.duration_seconds === 'number' ? s.duration_seconds : 3,
    asset_id: typeof s.asset_id === 'string' && assetIds.has(s.asset_id) ? s.asset_id : null,
    visual_instruction: typeof s.visual_instruction === 'string' ? s.visual_instruction : null,
    motion_type: typeof s.motion_type === 'string' ? s.motion_type : 'static',
    on_screen_text: typeof s.on_screen_text === 'string' ? s.on_screen_text : null,
    voiceover_line: typeof s.voiceover_line === 'string' ? s.voiceover_line : null,
    caption_text: typeof s.caption_text === 'string' ? s.caption_text : null,
    callout_text: null,
    transition_type: typeof s.transition_type === 'string' ? s.transition_type : 'cut',
    metadata: {},
    // 006+ cinematic fields (cast from AI JSON — values are validated at runtime)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    motion_params: s.motion_params && typeof s.motion_params === 'object' ? s.motion_params as any : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    region_of_interest: s.region_of_interest && typeof s.region_of_interest === 'object' ? s.region_of_interest as any : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emphasis_beats: Array.isArray(s.emphasis_beats) ? s.emphasis_beats as any : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    color_theme: s.color_theme && typeof s.color_theme === 'object' ? s.color_theme as any : null,
    energy_level: typeof s.energy_level === 'number' ? Math.min(10, Math.max(1, Math.round(s.energy_level))) : null,
    music_sync_point: (['drop','build','release','silence'] as string[]).includes(s.music_sync_point as string) ? s.music_sync_point as 'drop'|'build'|'release'|'silence' : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vocal_direction: s.vocal_direction && typeof s.vocal_direction === 'object' ? s.vocal_direction as any : null,
  }))

  const userId = await getCurrentUserId()
  const storyboard = await saveStoryboard(
    projectId,
    scriptId,
    {
      title: `${script.title} Storyboard`,
      raw_json: raw as Record<string, unknown>,
      generated_by: 'ai',
    },
    scenes
  )

  await logActivity(projectId, userId, 'generated_storyboard', 'storyboard_versions', storyboard.id, {
    scene_count: scenes.length,
  })
  return storyboard
}

// ─── 6. generateCaptions ─────────────────────────────────────────────────────

export async function generateCaptions(
  projectId: string,
  scriptId: string,
  storyboardVersionId: string
): Promise<DbCaptionVersion> {
  const { data: script, error: scriptErr } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', scriptId)
    .single()
  if (scriptErr || !script) throw new Error('Script not found')

  const storyboard = await getStoryboardWithScenes(storyboardVersionId)
  const scenes = storyboard.storyboard_scenes
  const totalDurationS = scenes.reduce((sum, s) => sum + s.duration_seconds, 0)

  const systemPrompt = `You are a creative caption designer for premium product marketing videos. You create captions that feel kinetic and intentional — not just subtitles.

Given a script and storyboard, create timed caption segments with emphasis markup.

Return JSON with key "segments" as an array. Each segment:
- start_ms: number
- end_ms: number
- text: string (5–10 words max per segment — short chunks hit harder)
- emphasis_words: array of { word_index: number (0-based), style: "bold"|"color"|"scale" } — mark words that should visually POP. Use "scale" for the most important word in the sentence. Use "color" for the product name or key claims. Use "bold" for verbs and action words.

CAPTION PRINCIPLES:
- The most important word in each segment should have emphasis_words entry.
- Product name always gets style: "color".
- Numbers and statistics get style: "scale".
- Action verbs (build, ship, launch, see, find) get style: "bold".
- Never mark more than 2 words per segment as emphasized.
- Align segment boundaries to scene boundaries where possible.
- Total duration must fill exactly ${totalDurationS * 1000}ms.

Example segment:
{ "start_ms": 0, "end_ms": 2500, "text": "Work is broken.", "emphasis_words": [{"word_index": 2, "style": "scale"}] }`

  const sceneList = scenes
    .map(
      (s) =>
        `Scene ${s.scene_index + 1} (${s.narrative_role}, ${s.duration_seconds}s): ${s.voiceover_line ?? s.on_screen_text ?? '[no text]'}`
    )
    .join('\n')

  const userContent = [
    `Total Duration: ${totalDurationS}s`,
    `Voiceover: ${script.voiceover_script ?? script.full_script ?? 'N/A'}`,
    ``,
    `Scenes (for boundary alignment):`,
    sceneList,
  ].join('\n')

  const { data: raw } = await callOpenAI<{ segments: Record<string, unknown>[] }>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { model: getSettings().lightweightModel, response_format: { type: 'json_object' } }
  )

  const rawSegments = Array.isArray(raw?.segments) ? raw.segments : []
  const segments = rawSegments.map((s) => ({
    start_ms: typeof s.start_ms === 'number' ? s.start_ms : 0,
    end_ms: typeof s.end_ms === 'number' ? s.end_ms : 2000,
    text: typeof s.text === 'string' ? s.text : '',
    emphasis_words: Array.isArray(s.emphasis_words)
      ? s.emphasis_words.filter(
          (w: unknown) =>
            w && typeof w === 'object' &&
            typeof (w as Record<string, unknown>).word_index === 'number' &&
            ['bold', 'color', 'scale', 'underline'].includes((w as Record<string, unknown>).style as string)
        )
      : [],
  }))

  const { count } = await supabase
    .from('caption_versions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('script_id', scriptId)

  const { data: captionVersion, error } = await supabase
    .from('caption_versions')
    .insert({
      project_id: projectId,
      script_id: scriptId,
      storyboard_version_id: storyboardVersionId,
      version_number: (count ?? 0) + 1,
      segments,
      raw_json: raw as Record<string, unknown>,
    })
    .select()
    .single()
  if (error) throw error

  const userId = await getCurrentUserId()
  await logActivity(projectId, userId, 'generated_captions', 'caption_versions', captionVersion.id, {
    segment_count: segments.length,
  })
  return captionVersion
}

// ─── 7. assembleRenderPayload ─────────────────────────────────────────────────

export async function assembleRenderPayload(
  projectId: string,
  storyboardVersionId: string,
  scriptId: string
): Promise<DbRenderPayload> {
  const [{ data: project, error: projErr }, { data: script, error: scriptErr }] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('scripts').select('*').eq('id', scriptId).single(),
    ])
  if (projErr || !project) throw new Error('Project not found')
  if (scriptErr || !script) throw new Error('Script not found')

  const [storyboard, assets, { data: captionRows }] = await Promise.all([
    getStoryboardWithScenes(storyboardVersionId),
    getProjectAssets(projectId),
    supabase
      .from('caption_versions')
      .select('*')
      .eq('project_id', projectId)
      .eq('script_id', scriptId)
      .eq('storyboard_version_id', storyboardVersionId)
      .order('version_number', { ascending: false })
      .limit(1),
  ])

  const latestCaptions = captionRows?.[0] ?? null
  const assetMap = new Map(assets.map((a) => [a.id, a]))
  const scenes = storyboard.storyboard_scenes
  const aspectRatio = aspectRatioForPlatform(project.target_platform)
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration_seconds, 0)

  const renderScenes = scenes.map((s) => {
    const asset = s.asset_id ? assetMap.get(s.asset_id) : null
    const sceneStartMs = scenes
      .filter((other) => other.scene_index < s.scene_index)
      .reduce((sum, other) => sum + other.duration_seconds * 1000, 0)
    const sceneEndMs = sceneStartMs + s.duration_seconds * 1000
    const sceneCaption =
      latestCaptions?.segments.filter(
        (seg: { start_ms: number; end_ms: number; text: string }) =>
          seg.start_ms >= sceneStartMs && seg.start_ms < sceneEndMs
      ) ?? []
    return {
      scene_index: s.scene_index,
      scene_type: s.scene_type,
      narrative_role: s.narrative_role,
      duration_seconds: s.duration_seconds,
      asset_url: asset?.file_url ?? null,
      asset_type: asset?.asset_type ?? null,
      asset_semantic_tags: asset?.semantic_tags ?? [],
      asset_analysis: asset?.analysis ?? null,
      visual_instruction: s.visual_instruction,
      motion_type: s.motion_type ?? 'static',
      on_screen_text: s.on_screen_text,
      voiceover_line: s.voiceover_line,
      caption_text: s.caption_text,
      transition_type: s.transition_type,
      captions: sceneCaption,
      // 006+ cinematic fields — null-safe (existing scenes have null values)
      motion_params: s.motion_params ?? null,
      region_of_interest: s.region_of_interest ?? null,
      emphasis_beats: s.emphasis_beats ?? null,
      color_theme: s.color_theme ?? null,
      energy_level: s.energy_level ?? null,
      music_sync_point: s.music_sync_point ?? null,
      vocal_direction: s.vocal_direction ?? null,
    }
  })

  const payload: Record<string, unknown> = {
    project_id: projectId,
    project_name: project.product_name,
    internal_name: project.internal_name,
    target_platform: project.target_platform,
    tone_preset: project.tone_preset,
    aspect_ratio: aspectRatio,
    total_duration_seconds: totalDuration,
    script: {
      id: script.id,
      title: script.title,
      full_script: script.full_script,
      voiceover_script: script.voiceover_script,
      cta_script: script.cta_script,
      narrative_structure: script.narrative_structure,
    },
    storyboard_version_id: storyboardVersionId,
    scenes: renderScenes,
    captions: latestCaptions?.segments ?? [],
    cta: project.cta,
    assembled_at: new Date().toISOString(),
  }

  const userId = await getCurrentUserId()
  const renderPayload = await createRenderPayload(projectId, storyboardVersionId, scriptId, payload, {
    aspectRatio,
    stylePreset: project.tone_preset ?? undefined,
  })

  await logActivity(
    projectId,
    userId,
    'assembled_render_payload',
    'render_payloads',
    renderPayload.id
  )
  return renderPayload
}

// ─── Asset-to-scene matching ──────────────────────────────────────────────────

export interface AssetMatchSuggestion {
  scene_index: number
  scene_type: string
  narrative_role: string
  on_screen_text: string | null
  recommended_asset_id: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  reasoning: string
  alternatives: string[]  // asset IDs, best to worst
}

/**
 * Uses GPT to match each storyboard scene to the best available asset.
 * Call after storyboard generation and before assembleRenderPayload.
 *
 * Returns suggestions — does NOT auto-apply. The UI (AssetMatchingReview)
 * lets the user confirm or swap before the selections are saved.
 */
export async function matchAssetsToScenes(
  projectId: string,
  storyboardVersionId: string
): Promise<AssetMatchSuggestion[]> {
  // Load storyboard scenes
  const storyboard = await getStoryboardWithScenes(storyboardVersionId)
  const scenes = storyboard?.storyboard_scenes ?? []
  if (!scenes.length) return []

  // Load analyzed project assets
  const rawAssets = await getProjectAssets(projectId)
  if (!rawAssets?.length) return []

  // Format assets for the prompt
  const assetList = rawAssets.map((a) => formatAssetForPrompt({
    id: a.id,
    file_name: a.file_name,
    asset_type: a.asset_type,
    semantic_tags: a.semantic_tags ?? [],
    analysis: a.analysis,
  })).join('\n')

  // Format scenes for the prompt
  const sceneList = scenes.map((s: DbStoryboardScene) =>
    `Scene ${s.scene_index} | type: ${s.scene_type} | role: ${s.narrative_role} | text: "${s.on_screen_text ?? ''}"`
  ).join('\n')

  const systemPrompt = `You are a video production director matching visual assets to storyboard scenes.
Your job is to assign the best asset to each scene based on semantic fit and narrative purpose.

Rules:
1. "hook" scenes → use product_hero, lifestyle, or result_view assets
2. "problem" scenes → use problem_state, empty_state, or error_state assets
3. "shift" scenes → use product_hero or transition assets
4. "proof" scenes → use result_view, data_visualization, or dashboard assets
5. "payoff" / "cta" scenes → use success_state or product_hero assets
6. Text-only scenes (text_overlay, transition_card) → recommended_asset_id should be null
7. Each asset can be reused, but try to spread variety if possible
8. If no good match exists, set confidence to "none" and recommended_asset_id to null

Return ONLY valid JSON array (no markdown):
[
  {
    "scene_index": 0,
    "recommended_asset_id": "uuid-or-null",
    "confidence": "high|medium|low|none",
    "reasoning": "one sentence",
    "alternatives": ["uuid2", "uuid3"]
  }
]`

  const response = await callOpenAI<AssetMatchSuggestion[]>(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `AVAILABLE ASSETS:\n${assetList}\n\nSTORYBOARD SCENES:\n${sceneList}\n\nReturn the asset matching array:`,
      },
    ],
    {
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    }
  )

  // GPT may return { matches: [...] } or just [...] directly
  const raw = response.data
  const matches: AssetMatchSuggestion[] = Array.isArray(raw) ? raw :
    (raw as { matches?: AssetMatchSuggestion[] }).matches ?? []

  // Enrich with scene data for the UI
  return matches.map((m) => {
    const scene = scenes.find((s: DbStoryboardScene) => s.scene_index === m.scene_index)
    return {
      ...m,
      scene_type: scene?.scene_type ?? 'unknown',
      narrative_role: scene?.narrative_role ?? 'unknown',
      on_screen_text: scene?.on_screen_text ?? null,
      alternatives: m.alternatives ?? [],
    }
  })
}

/**
 * Apply confirmed asset matches back to the storyboard scenes.
 * Called when the user clicks "Apply" in AssetMatchingReview.
 */
export async function applyAssetMatches(
  storyboardVersionId: string,
  confirmedMatches: Array<{ scene_index: number; asset_id: string | null }>
): Promise<void> {
  // Update each scene's asset_id in storyboard_scenes
  await Promise.all(
    confirmedMatches.map(({ scene_index, asset_id }) =>
      supabase
        .from('storyboard_scenes')
        .update({ asset_id })
        .eq('storyboard_version_id', storyboardVersionId)
        .eq('scene_index', scene_index)
        .then(({ error }) => {
          if (error) throw error
        })
    )
  )
}
