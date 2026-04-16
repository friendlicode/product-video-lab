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
import type {
  DbProductBrief,
  DbStoryDirection,
  DbHook,
  DbScript,
  DbStoryboardVersionWithScenes,
  DbCaptionVersion,
  DbRenderPayload,
} from '@/types/db'
import type { NarrativeRole, NarrativeType, HookType, SceneType, TargetPlatform } from '@/types/index'

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

  const systemPrompt = `You are a scriptwriter for short-form B2B product marketing videos. Write a complete video script following this narrative structure. Return JSON with: title (string), duration_target_seconds (number), full_script (string, complete script as one readable block), voiceover_script (string, narration only), cta_script (string, call to action text), narrative_structure (object with exactly these keys each containing 1-3 sentences): { hook, problem, shift, proof, payoff, cta }. Style: founder-voice, conversational, direct — no corporate jargon. The hook field must open with the provided hook text verbatim.`

  const userContent = [
    `Product: ${project.product_name}`,
    `Platform: ${project.target_platform ?? 'other'} (target: ${targetDuration}s)`,
    `Tone: ${project.tone_preset ?? 'conversational'}`,
    `CTA: ${project.cta ?? 'N/A'}`,
    ``,
    `Story Direction: ${direction.title}`,
    `Angle: ${direction.angle ?? 'N/A'}`,
    `Tension: ${direction.tension ?? 'N/A'}`,
    `Payoff: ${direction.payoff ?? 'N/A'}`,
    `CTA Angle: ${direction.cta_angle ?? 'N/A'}`,
    ``,
    `Opening hook (use verbatim): "${hook.hook_text}"`,
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

  const assets = await getProjectAssets(projectId)

  const systemPrompt = `You are a storyboard designer for short-form product marketing videos. Given a script with narrative structure, create a scene-by-scene storyboard. Return JSON with key "scenes" as an array. Each scene: scene_index (number starting from 0), scene_type (one of: text_overlay, screenshot_pan, screenshot_zoom, video_clip, split_screen, logo_reveal, cta_card, transition_card, custom), narrative_role (one of: hook, problem, shift, proof, payoff, cta), duration_seconds (number), visual_instruction (string), motion_type (string e.g. slow_zoom_in pan_left static fade_in bounce slide_up), on_screen_text (string or null), voiceover_line (string or null), caption_text (string or null), transition_type (one of: cut, fade, dissolve, slide), asset_id (string from the provided asset list, or null). Create 6-10 scenes covering all 6 narrative roles. Match scenes to available assets where logical.`

  const assetList =
    assets.length > 0
      ? assets.map((a) => `- id: ${a.id} | name: ${a.file_name} | type: ${a.asset_type}`).join('\n')
      : 'None available.'

  const narrativeText = Object.entries(script.narrative_structure)
    .map(([role, text]) => `${role.toUpperCase()}: ${text}`)
    .join('\n\n')

  const userContent = [
    `Product: ${project.product_name}`,
    `Platform: ${project.target_platform ?? 'N/A'}`,
    `Script: ${script.title} (${script.duration_target_seconds ?? 60}s target)`,
    ``,
    `Narrative Structure:`,
    narrativeText,
    script.full_script ? `\nFull Script:\n${script.full_script}` : '',
    `\nAvailable Assets:\n${assetList}`,
  ]
    .filter((l) => l !== '')
    .join('\n')

  const { data: raw } = await callOpenAI<{ scenes: Record<string, unknown>[] }>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    { model: getSettings().lightweightModel, response_format: { type: 'json_object' } }
  )

  const rawScenes = Array.isArray(raw?.scenes) ? raw.scenes : []
  const assetIds = new Set(assets.map((a) => a.id))

  const scenes = rawScenes.map((s, i) => ({
    scene_index: typeof s.scene_index === 'number' ? s.scene_index : i,
    scene_type: (s.scene_type as SceneType) ?? 'text_overlay',
    narrative_role: (s.narrative_role as NarrativeRole) ?? 'hook',
    duration_seconds: typeof s.duration_seconds === 'number' ? s.duration_seconds : 3,
    asset_id:
      typeof s.asset_id === 'string' && assetIds.has(s.asset_id) ? s.asset_id : null,
    visual_instruction:
      typeof s.visual_instruction === 'string' ? s.visual_instruction : null,
    motion_type: typeof s.motion_type === 'string' ? s.motion_type : 'static',
    on_screen_text: typeof s.on_screen_text === 'string' ? s.on_screen_text : null,
    voiceover_line: typeof s.voiceover_line === 'string' ? s.voiceover_line : null,
    caption_text: typeof s.caption_text === 'string' ? s.caption_text : null,
    callout_text: null,
    transition_type: typeof s.transition_type === 'string' ? s.transition_type : 'cut',
    metadata: {},
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

  const systemPrompt = `You are a caption/subtitle generator. Given a script and storyboard scenes with durations, create timed caption segments. Return JSON with key "segments" as an array. Each segment: start_ms (number), end_ms (number), text (string). Break text into readable 5-10 word chunks. Align segment boundaries with scene boundaries where possible. Total duration should match ${totalDurationS * 1000}ms.`

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
    `Scenes:`,
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
      visual_instruction: s.visual_instruction,
      motion_type: s.motion_type ?? 'static',
      on_screen_text: s.on_screen_text,
      voiceover_line: s.voiceover_line,
      caption_text: s.caption_text,
      transition_type: s.transition_type,
      captions: sceneCaption,
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
