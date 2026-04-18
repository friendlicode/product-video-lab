/**
 * music.ts — Client-side service for background music selection.
 *
 * Calls the select-music Edge Function which:
 *   1. Searches Jamendo API (free key — jamendo.com/developers) if JAMENDO_CLIENT_ID is set
 *   2. Falls back to the curated local music_library table (CC0, zero config)
 *
 * Results are persisted to the music_cues table and injected into render payloads.
 */

import { supabase } from '@/lib/supabase'
import type { BeatGrid } from '@/lib/beatSync'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MusicTrackOption {
  id: string
  title: string
  artist: string
  bpm: number | null
  duration_ms: number
  preview_url: string
  image_url: string | null
  moods: string[]
  genres: string[]
  license_url: string | null    // CC license page (CC-BY tracks from Jamendo)
  source: 'jamendo' | 'library' // where the track came from
  beat_grid_ms: number[]
  sections: {
    intro_end_ms: number
    build_end_ms: number
    drop_end_ms: number
    outro_start_ms: number
  }
}

export interface MusicSearchParams {
  mood?: string
  energy_level?: number
  duration_seconds?: number
}

export interface SavedMusicCue {
  id: string
  render_payload_id: string
  track_id: string
  track_title: string | null
  track_artist: string | null
  bpm: number | null
  duration_ms: number | null
  preview_url: string | null
  mood_tags: string[]
  beat_grid_ms: number[]
  sections: {
    intro_end_ms?: number
    build_end_ms?: number
    drop_end_ms?: number
    outro_start_ms?: number
  }
  created_at: string
}

// ─── Search tracks ────────────────────────────────────────────────────────────

/**
 * Search Epidemic Sound for music tracks matching the given params.
 * Returns up to 3 options for the user to choose from.
 */
export async function searchMusicTracks(
  params: MusicSearchParams
): Promise<MusicTrackOption[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/select-music`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `Music search failed (${res.status})`)
  }

  const data = await res.json()
  return (data.options ?? []) as MusicTrackOption[]
}

// ─── Save selected track ──────────────────────────────────────────────────────

/**
 * Persist the user's selected track to music_cues.
 * If a cue already exists for this payload, it is replaced.
 */
export async function saveMusicCue(
  renderPayloadId: string,
  track: MusicTrackOption
): Promise<SavedMusicCue> {
  // Upsert: replace existing cue for this render payload.
  // Requires UNIQUE(render_payload_id) — added in migration 008.
  const { data, error } = await supabase
    .from('music_cues')
    .upsert(
      {
        render_payload_id: renderPayloadId,
        track_id:          track.id,
        track_title:       track.title,
        track_artist:      track.artist,
        bpm:               track.bpm,
        duration_ms:       track.duration_ms,
        preview_url:       track.preview_url,
        mood_tags:         track.moods,
        beat_grid_ms:      track.beat_grid_ms,
        sections:          track.sections,
      },
      { onConflict: 'render_payload_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data as SavedMusicCue
}

/**
 * Get the saved music cue for a render payload (if any).
 */
export async function getMusicCue(
  renderPayloadId: string
): Promise<SavedMusicCue | null> {
  const { data, error } = await supabase
    .from('music_cues')
    .select('*')
    .eq('render_payload_id', renderPayloadId)
    .maybeSingle()

  if (error) throw error
  return data as SavedMusicCue | null
}

/**
 * Remove the music cue for a render payload (user clears selection).
 */
export async function removeMusicCue(renderPayloadId: string): Promise<void> {
  const { error } = await supabase
    .from('music_cues')
    .delete()
    .eq('render_payload_id', renderPayloadId)

  if (error) throw error
}

// ─── Beat grid helper ─────────────────────────────────────────────────────────

/**
 * Convert a SavedMusicCue into a BeatGrid for use with beatSync utilities.
 */
export function cueToGrid(cue: SavedMusicCue): BeatGrid {
  return {
    bpm:          cue.bpm ?? 120,
    beat_grid_ms: cue.beat_grid_ms ?? [],
    sections: {
      intro_end_ms:   cue.sections?.intro_end_ms  ?? 0,
      build_end_ms:   cue.sections?.build_end_ms  ?? 0,
      drop_end_ms:    cue.sections?.drop_end_ms   ?? 0,
      outro_start_ms: cue.sections?.outro_start_ms ?? 0,
    },
  }
}
