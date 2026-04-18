// Supabase Edge Function: select-music
//
// Finds beat-matched background music for a given mood + energy level.
//
// PRIMARY:  Jamendo API (free — register at https://developer.jamendo.com/)
//           Set secret: JAMENDO_CLIENT_ID=your_client_id
//           Jamendo tracks are Creative Commons (CC-BY / CC-BY-SA).
//           Attribution stored in music_cues.track_artist and surfaced in export.
//
// FALLBACK: Local music_library table (curated CC0 tracks, zero config).
//           Works out of the box with no secrets set.
//
// Deploy:
//   npx supabase functions deploy select-music --no-verify-jwt
//
// Optional secret (enables Jamendo search):
//   npx supabase secrets set JAMENDO_CLIENT_ID=your_id_here

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const JAMENDO_BASE = "https://api.jamendo.com/v3.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// ─── Beat grid generator ─────────────────────────────────────────────────────

function generateBeatGrid(bpm: number, durationMs: number): number[] {
  const beatPeriodMs = 60_000 / bpm
  const beats: number[] = []
  let t = 0
  while (t <= durationMs) {
    beats.push(Math.round(t))
    t += beatPeriodMs
  }
  return beats
}

function estimateSections(durationMs: number) {
  return {
    intro_end_ms:   Math.round(durationMs * 0.15),
    build_end_ms:   Math.round(durationMs * 0.50),
    drop_end_ms:    Math.round(durationMs * 0.85),
    outro_start_ms: Math.round(durationMs * 0.85),
  }
}

// ─── Mood → Jamendo tag mapping ───────────────────────────────────────────────

// Jamendo speed param: "low" | "medium" | "high"
const ENERGY_TO_SPEED: Record<string, string> = {
  low:    'low',
  medium: 'medium',
  high:   'high',
}

// Map our internal mood strings to Jamendo tag search terms
const MOOD_TO_TAGS: Record<string, string> = {
  tense_then_triumphant: 'cinematic+epic',
  energetic:             'energetic+upbeat+electronic',
  inspiring:             'inspiring+uplifting+motivational',
  dramatic:              'dramatic+cinematic',
  minimal:               'ambient+minimal+background',
  playful:               'fun+quirky+upbeat',
  corporate:             'corporate+business+professional',
  dark:                  'dark+electronic+suspense',
}

function energyToSpeed(energyLevel: number): string {
  if (energyLevel <= 3) return 'low'
  if (energyLevel <= 7) return 'medium'
  return 'high'
}

// Estimate BPM center from energy level (for beat grid generation)
function energyToBpm(energyLevel: number): number {
  return Math.round(70 + energyLevel * 8)  // 78–150 BPM range
}

// ─── Jamendo API ─────────────────────────────────────────────────────────────

interface JamendoTrack {
  id: string
  name: string
  duration: number        // seconds
  artist_name: string
  shareurl: string
  audio: string           // streaming URL (preview quality)
  audiodownload: string   // full download URL
  image: string
  license_ccurl: string
  musicinfo?: {
    speed?: string
    tags?: { genres?: string[]; vartags?: string[] }
  }
}

async function searchJamendo(
  clientId: string,
  tags: string,
  speed: string,
  limit = 3
): Promise<MusicOption[]> {
  const params = new URLSearchParams({
    client_id:    clientId,
    format:       'json',
    limit:        String(limit),
    tags,
    speed,
    include:      'musicinfo',
    audioformat:  'mp31',
    order:        'popularity_total',
    // Instrumental tracks only (better for background)
    vocalsinstrumental: 'instrumental',
    groupby: 'artist_id',  // variety — one track per artist
  })

  const res = await fetch(`${JAMENDO_BASE}/tracks/?${params}`)
  if (!res.ok) {
    throw new Error(`Jamendo API ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`)
  }

  const data = await res.json() as { results: JamendoTrack[] }
  return (data.results ?? []).map((t) => ({
    id:           t.id,
    title:        t.name,
    artist:       t.artist_name,
    bpm:          null,  // Jamendo doesn't provide exact BPM — estimated below
    duration_ms:  t.duration * 1000,
    preview_url:  t.audio,
    image_url:    t.image ?? null,
    moods:        t.musicinfo?.tags?.vartags ?? t.musicinfo?.tags?.genres ?? [],
    genres:       t.musicinfo?.tags?.genres ?? [],
    license_url:  t.license_ccurl ?? null,
    source:       'jamendo' as const,
  }))
}

// ─── Local music_library fallback ────────────────────────────────────────────

async function searchLocalLibrary(
  supabase: ReturnType<typeof createClient>,
  energyLevel: number,
  mood: string,
  limit = 3
): Promise<MusicOption[]> {
  // Map energy 1-10 to speed category
  const speedCategory =
    energyLevel <= 3 ? 'low' :
    energyLevel <= 7 ? 'medium' : 'high'

  // Try exact speed match first, then broaden
  const { data } = await supabase
    .from('music_library')
    .select('*')
    .eq('speed_category', speedCategory)
    .contains('mood_tags', mood ? [mood.split('_')[0]] : [])  // fuzzy: first word of mood
    .limit(limit)

  let tracks = data ?? []

  // Broaden if not enough results
  if (tracks.length < limit) {
    const { data: broader } = await supabase
      .from('music_library')
      .select('*')
      .eq('speed_category', speedCategory)
      .limit(limit)
    tracks = broader ?? []
  }

  // Last resort: any tracks
  if (tracks.length === 0) {
    const { data: any } = await supabase
      .from('music_library')
      .select('*')
      .limit(limit)
    tracks = any ?? []
  }

  return tracks.map((t: Record<string, unknown>) => ({
    id:          String(t.id),
    title:       String(t.title),
    artist:      String(t.artist ?? 'Unknown'),
    bpm:         Number(t.bpm) || null,
    duration_ms: Number(t.duration_ms) || 120_000,
    preview_url: String(t.preview_url),
    image_url:   t.image_url ? String(t.image_url) : null,
    moods:       (t.mood_tags as string[]) ?? [],
    genres:      (t.genres as string[]) ?? [],
    license_url: t.license_url ? String(t.license_url) : null,
    source:      'library' as const,
  }))
}

// ─── Shared output type ───────────────────────────────────────────────────────

interface MusicOption {
  id: string
  title: string
  artist: string
  bpm: number | null
  duration_ms: number
  preview_url: string
  image_url: string | null
  moods: string[]
  genres: string[]
  license_url: string | null
  source: 'jamendo' | 'library'
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json({ error: "Unauthorized" }, 401)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authErr } = await supabaseClient.auth.getUser()
  if (authErr || !user) return json({ error: "Unauthorized" }, 401)

  let body: {
    mood?: string
    energy_level?: number
    duration_seconds?: number
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { mood = 'energetic', energy_level = 7, duration_seconds = 30 } = body
  const durationMs = duration_seconds * 1000
  const jamendoClientId = Deno.env.get("JAMENDO_CLIENT_ID")

  let tracks: MusicOption[] = []

  // ── Try Jamendo first if key is configured ──
  if (jamendoClientId) {
    try {
      const tags = MOOD_TO_TAGS[mood] ?? 'background+instrumental'
      const speed = energyToSpeed(energy_level)
      tracks = await searchJamendo(jamendoClientId, tags, speed, 3)
      console.log(`[select-music] Jamendo returned ${tracks.length} tracks`)
    } catch (err) {
      console.warn('[select-music] Jamendo failed, falling back to local library:', err)
    }
  }

  // ── Fall back to local music_library table ──
  if (tracks.length === 0) {
    try {
      tracks = await searchLocalLibrary(supabase, energy_level, mood, 3)
      console.log(`[select-music] Local library returned ${tracks.length} tracks`)
    } catch (err) {
      console.warn('[select-music] Local library query failed:', err)
    }
  }

  if (tracks.length === 0) {
    return json({
      options: [],
      message: 'No tracks found. Add tracks to the music_library table or set JAMENDO_CLIENT_ID.',
    })
  }

  // Estimate BPM from energy level (Jamendo doesn't always provide exact BPM)
  const estimatedBpm = energyToBpm(energy_level)

  const options = tracks.map((track) => {
    const bpm = track.bpm ?? estimatedBpm
    const beatGrid = generateBeatGrid(bpm, Math.min(durationMs, track.duration_ms))
    const sections = estimateSections(track.duration_ms)

    return {
      ...track,
      bpm,
      beat_grid_ms: beatGrid,
      sections,
    }
  })

  return json({ options, source: tracks[0]?.source ?? 'unknown' })
})
