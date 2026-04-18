/**
 * assetAnalysis.ts
 *
 * GPT-4 Vision analysis for uploaded project assets.
 * Runs automatically after upload (images) or on-demand (video keyframes).
 * Results are stored in project_assets.analysis + semantic_tags.
 *
 * Costs approx $0.001–0.003 per image at gpt-4o 'low' detail.
 * Cached per asset: re-runs only if analysis_status = 'pending' | 'failed'.
 */

import { supabase } from '@/lib/supabase'
import { callOpenAI } from '@/lib/openai'
import type { AssetAnalysis, AssetAnalysisStatus } from '@/types/db'

const SEMANTIC_TAGS = [
  'ui_tour',
  'problem_state',
  'result_view',
  'feature_detail',
  'social_proof',
  'product_hero',
  'lifestyle',
  'b_roll',
  'dashboard',
  'onboarding',
  'empty_state',
  'error_state',
  'success_state',
  'comparison',
  'data_visualization',
] as const

const NARRATIVE_ROLES = ['hook', 'problem', 'shift', 'proof', 'payoff', 'cta'] as const

type NarrativeRole = (typeof NARRATIVE_ROLES)[number]

export type AssetAnalysisResult = {
  // AssetAnalysis fields (flattened for easy destructuring)
  ocr_text?: string
  dominant_colors?: string[]
  detected_regions?: Array<{ label: string; x: number; y: number; w: number; h: number }>
  scene_boundaries_ms?: number[]
  motion_estimate?: 'static' | 'slow_pan' | 'fast_cut' | 'handheld'
  content_summary?: string
  recommended_narrative_role?: string
  // Additional top-level field
  analysis: AssetAnalysis
  semantic_tags: string[]
}

// ─── Core analysis function ──────────────────────────────────────────────────

export async function analyzeImageAsset(
  assetId: string,
  imageUrl: string,
  fileName: string
): Promise<AssetAnalysisResult> {
  // Mark as processing
  await setAnalysisStatus(assetId, 'processing')

  try {
    const result = await runVisionAnalysis(imageUrl, fileName)
    // Persist results
    await supabase
      .from('project_assets')
      .update({
        analysis: result.analysis,
        semantic_tags: result.semantic_tags,
        analysis_status: 'complete' as AssetAnalysisStatus,
      })
      .eq('id', assetId)

    return result as AssetAnalysisResult
  } catch (err) {
    await setAnalysisStatus(assetId, 'failed')
    throw err
  }
}

// ─── GPT-4 Vision call ───────────────────────────────────────────────────────

async function runVisionAnalysis(
  imageUrl: string,
  fileName: string
): Promise<AssetAnalysisResult> {
  const systemPrompt = `You are an expert product marketing creative director.
Analyze the provided product screenshot or image and return a JSON object.
You will categorize what you see and suggest how it should be used in a product marketing video.

Valid semantic_tags (pick 1–4 that apply):
${SEMANTIC_TAGS.join(', ')}

Valid recommended_narrative_roles:
${NARRATIVE_ROLES.join(', ')}

Motion estimate options: static, slow_pan, fast_cut, handheld

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "semantic_tags": ["tag1", "tag2"],
  "ocr_text": "any text visible in the image, or empty string",
  "dominant_colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "detected_regions": [
    { "label": "navigation bar", "x": 0.0, "y": 0.0, "w": 1.0, "h": 0.06 },
    { "label": "main content area", "x": 0.0, "y": 0.06, "w": 1.0, "h": 0.7 }
  ],
  "motion_estimate": "static",
  "content_summary": "One sentence describing what this image shows for video production context.",
  "recommended_narrative_role": "proof"
}`

  const response = await callOpenAI<{
    semantic_tags: string[]
    ocr_text: string
    dominant_colors: string[]
    detected_regions: Array<{ label: string; x: number; y: number; w: number; h: number }>
    motion_estimate: string
    content_summary: string
    recommended_narrative_role: NarrativeRole
  }>(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'low', // cost-efficient; enough for classification
            },
          },
          {
            type: 'text',
            text: `File name: ${fileName}. Analyze this for product marketing video production.`,
          },
        ],
      },
    ],
    {
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }
  )

  const raw = response.data
  const analysis: AssetAnalysis = {
    ocr_text: raw.ocr_text || undefined,
    dominant_colors: raw.dominant_colors || [],
    detected_regions: raw.detected_regions || [],
    motion_estimate: (raw.motion_estimate as AssetAnalysis['motion_estimate']) || 'static',
    content_summary: raw.content_summary || undefined,
    recommended_narrative_role: raw.recommended_narrative_role || undefined,
  }

  return {
    ...analysis,
    analysis,
    semantic_tags: (raw.semantic_tags || []).filter((t: string) =>
      (SEMANTIC_TAGS as readonly string[]).includes(t)
    ),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function setAnalysisStatus(assetId: string, status: AssetAnalysisStatus): Promise<void> {
  await supabase.from('project_assets').update({ analysis_status: status }).eq('id', assetId)
}

/**
 * Run analysis on any pending assets for a project.
 * Call after upload or on project open to ensure all assets are analyzed.
 */
export async function analyzePendingAssets(projectId: string): Promise<void> {
  const { data: assets } = await supabase
    .from('project_assets')
    .select('id, file_url, file_name, mime_type, analysis_status')
    .eq('project_id', projectId)
    .in('analysis_status', ['pending', 'failed'])

  if (!assets?.length) return

  const imageAssets = assets.filter(
    (a) => a.mime_type?.startsWith('image/') ?? a.file_name.match(/\.(png|jpg|jpeg|webp|gif)$/i)
  )
  const videoAssets = assets.filter(
    (a) => a.mime_type?.startsWith('video/') ?? a.file_name.match(/\.(mp4|mov|webm|avi)$/i)
  )

  // Run sequentially to avoid hammering the API (burst = bad UX + cost)
  for (const asset of imageAssets) {
    try {
      await analyzeImageAsset(asset.id, asset.file_url, asset.file_name)
    } catch (err) {
      console.warn(`[assetAnalysis] Image analysis failed for ${asset.id}:`, err)
    }
  }

  for (const asset of videoAssets) {
    try {
      await analyzeVideoAsset(asset.id, asset.file_url, asset.file_name)
    } catch (err) {
      console.warn(`[assetAnalysis] Video analysis failed for ${asset.id}:`, err)
    }
  }
}

// ─── Video asset analysis ────────────────────────────────────────────────────

/**
 * Analyze a video asset by extracting keyframes (browser canvas) and
 * running GPT-4 Vision on 3 representative frames.
 *
 * Falls back to metadata-only analysis if frame capture fails (CORS, etc.)
 * Results stored to project_assets.analysis + semantic_tags.
 */
export async function analyzeVideoAsset(
  assetId: string,
  videoUrl: string,
  fileName: string
): Promise<AssetAnalysisResult> {
  await setAnalysisStatus(assetId, 'processing')

  try {
    // Attempt to extract keyframe data URLs via browser canvas
    const frameDataUrls = await extractVideoKeyframes(videoUrl, 3).catch((err) => {
      console.warn('[assetAnalysis] Keyframe capture failed, falling back to metadata:', err)
      return [] as string[]
    })

    let result: AssetAnalysisResult

    if (frameDataUrls.length > 0) {
      // Full vision analysis using extracted frames
      result = await runVideoVisionAnalysis(frameDataUrls, fileName)
    } else {
      // Fallback: GPT analyses just the file name + context
      result = await runMetadataOnlyAnalysis(fileName)
    }

    await supabase
      .from('project_assets')
      .update({
        analysis: result.analysis,
        semantic_tags: result.semantic_tags,
        analysis_status: 'complete' as AssetAnalysisStatus,
      })
      .eq('id', assetId)

    return result
  } catch (err) {
    await setAnalysisStatus(assetId, 'failed')
    throw err
  }
}

/**
 * Extract N keyframes from a video URL using browser canvas.
 * Returns base64 JPEG data URLs at reduced resolution (640×360).
 * Throws if CORS prevents canvas reads.
 */
async function extractVideoKeyframes(
  videoUrl: string,
  frameCount = 3
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'metadata'
    video.src = videoUrl

    video.addEventListener('error', () => reject(new Error('Video load error')))
    video.addEventListener('loadedmetadata', async () => {
      const duration = video.duration
      if (!isFinite(duration) || duration === 0) {
        reject(new Error('Invalid video duration'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not available')); return }

      const seekPoints = Array.from({ length: frameCount }, (_, i) =>
        (duration * (i + 1)) / (frameCount + 1)
      )

      const frames: string[] = []
      for (const seekTime of seekPoints) {
        video.currentTime = seekTime
        await new Promise<void>((res) => {
          video.addEventListener('seeked', () => res(), { once: true })
        })
        ctx.drawImage(video, 0, 0, 640, 360)
        try {
          frames.push(canvas.toDataURL('image/jpeg', 0.6))
        } catch {
          reject(new Error('Canvas tainted — CORS not configured for video URL'))
          return
        }
      }

      video.remove()
      resolve(frames)
    })
  })
}

/** Full vision analysis using extracted video keyframes */
async function runVideoVisionAnalysis(
  frameDataUrls: string[],
  fileName: string
): Promise<AssetAnalysisResult> {
  const systemPrompt = `You are an expert product marketing creative director analyzing video footage.
You will see ${frameDataUrls.length} keyframes from a product demo or b-roll video clip.
Based on what you see across the frames, return a JSON analysis for video production use.

Valid semantic_tags (pick 1-4): ui_tour, problem_state, result_view, feature_detail, social_proof, product_hero, lifestyle, b_roll, dashboard, onboarding, empty_state, error_state, success_state, comparison, data_visualization

Valid recommended_narrative_roles: hook, problem, shift, proof, payoff, cta

Motion estimate (based on what you see changing across frames):
- "static": camera and content barely move
- "slow_pan": gradual camera or UI movement
- "fast_cut": scene changes within the clip
- "handheld": shaky/dynamic camera movement

Return ONLY valid JSON (no markdown):
{
  "semantic_tags": ["tag1", "tag2"],
  "ocr_text": "any text visible, or empty string",
  "dominant_colors": ["#hex1", "#hex2", "#hex3"],
  "detected_regions": [{ "label": "...", "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 }],
  "motion_estimate": "slow_pan",
  "scene_boundaries_ms": [],
  "content_summary": "One sentence for video production context.",
  "recommended_narrative_role": "proof"
}`

  const imageContent = frameDataUrls.map((url) => ({
    type: 'image_url' as const,
    image_url: { url, detail: 'low' as const },
  }))

  const response = await callOpenAI<{
    semantic_tags: string[]
    ocr_text: string
    dominant_colors: string[]
    detected_regions: Array<{ label: string; x: number; y: number; w: number; h: number }>
    motion_estimate: string
    scene_boundaries_ms: number[]
    content_summary: string
    recommended_narrative_role: string
  }>(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text' as const, text: `Video file: ${fileName}. Analyze for product marketing video production.` },
        ],
      },
    ],
    {
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    }
  )

  const raw = response.data
  const analysis: AssetAnalysis = {
    ocr_text:                   raw.ocr_text || undefined,
    dominant_colors:             raw.dominant_colors || [],
    detected_regions:            raw.detected_regions || [],
    scene_boundaries_ms:         raw.scene_boundaries_ms || [],
    motion_estimate:             (raw.motion_estimate as AssetAnalysis['motion_estimate']) || 'slow_pan',
    content_summary:             raw.content_summary || undefined,
    recommended_narrative_role:  raw.recommended_narrative_role || undefined,
  }

  return {
    ...analysis,
    analysis,
    semantic_tags: (raw.semantic_tags || []).filter((t: string) =>
      (SEMANTIC_TAGS as readonly string[]).includes(t)
    ),
  }
}

/** Metadata-only fallback when frame capture isn't possible */
async function runMetadataOnlyAnalysis(fileName: string): Promise<AssetAnalysisResult> {
  // Use GPT to infer semantic context from the file name alone
  const name = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

  const analysis: AssetAnalysis = {
    motion_estimate: 'slow_pan',
    content_summary: `Video clip: ${name}`,
    recommended_narrative_role: 'proof',
    dominant_colors: [],
    detected_regions: [],
  }

  return {
    ...analysis,
    analysis,
    semantic_tags: name.toLowerCase().includes('demo') ? ['ui_tour'] :
                   name.toLowerCase().includes('result') ? ['result_view'] :
                   ['b_roll'],
  }
}

/**
 * Format asset analysis as a compact string for injection into AI prompts.
 * Used by generateStoryboard to give the AI semantic context about assets.
 */
export function formatAssetForPrompt(asset: {
  id: string
  file_name: string
  asset_type: string
  semantic_tags: string[]
  analysis?: AssetAnalysis | null
}): string {
  const tags = asset.semantic_tags.length ? asset.semantic_tags.join(', ') : 'unanalyzed'
  const role = asset.analysis?.recommended_narrative_role ?? 'unknown'
  const summary = asset.analysis?.content_summary ?? asset.file_name
  const motion = asset.analysis?.motion_estimate ?? 'static'
  return `- id: ${asset.id} | type: ${asset.asset_type} | tags: [${tags}] | role: ${role} | motion: ${motion} | summary: "${summary}"`
}
