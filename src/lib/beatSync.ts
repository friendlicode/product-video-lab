/**
 * beatSync.ts — Snap video timestamps to the nearest beat in a beat grid.
 *
 * Given a list of beat timestamps (ms) from Epidemic Sound's BPM data,
 * this snaps scene cut points, emphasis beats, and voiceover cue points
 * to the nearest musical beat — making the video feel rhythmically alive.
 *
 * All functions are pure (no side effects) so they can run during payload
 * assembly without touching the DB.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BeatGrid {
  bpm: number
  beat_grid_ms: number[]   // sorted list of beat timestamps in ms
  sections: {
    intro_end_ms: number
    build_end_ms: number
    drop_end_ms: number
    outro_start_ms: number
  }
}

export interface SnapOptions {
  toleranceMs?: number    // max distance to snap (default: 120ms = ±1/4 beat at 120bpm)
  direction?: 'nearest' | 'before' | 'after'
}

// ─── Core snap function ───────────────────────────────────────────────────────

/**
 * Snap a timestamp to the nearest beat in the grid.
 * Returns the original timestamp if no beat is within tolerance.
 */
export function snapToBeat(
  timestampMs: number,
  grid: BeatGrid,
  opts: SnapOptions = {}
): number {
  const { toleranceMs = 120, direction = 'nearest' } = opts
  const beats = grid.beat_grid_ms

  if (!beats.length) return timestampMs

  // Binary search for nearest beat
  let lo = 0, hi = beats.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (beats[mid] < timestampMs) lo = mid + 1
    else hi = mid
  }

  // lo is now the index of the first beat >= timestampMs
  const candidates: number[] = []
  if (direction !== 'after' && lo > 0) candidates.push(beats[lo - 1])
  if (direction !== 'before' && lo < beats.length) candidates.push(beats[lo])

  if (!candidates.length) return timestampMs

  const best = candidates.reduce((a, b) =>
    Math.abs(a - timestampMs) <= Math.abs(b - timestampMs) ? a : b
  )

  return Math.abs(best - timestampMs) <= toleranceMs ? best : timestampMs
}

// ─── Scene duration snap ──────────────────────────────────────────────────────

/**
 * Snap a scene's start time to the nearest beat, then round its duration
 * so the scene ends on a beat boundary too.
 * Returns { start_ms, duration_ms } adjusted to beat grid.
 */
export function snapSceneToBeat(
  startMs: number,
  durationMs: number,
  grid: BeatGrid,
  opts: SnapOptions = {}
): { start_ms: number; duration_ms: number } {
  const snappedStart = snapToBeat(startMs, grid, { ...opts, direction: 'nearest' })
  const targetEnd = startMs + durationMs
  const snappedEnd = snapToBeat(targetEnd, grid, { ...opts, direction: 'nearest' })

  return {
    start_ms: snappedStart,
    duration_ms: Math.max(snappedEnd - snappedStart, 1000), // min 1s
  }
}

// ─── Emphasis beat placement ──────────────────────────────────────────────────

/**
 * Suggest emphasis beat positions within a scene based on the beat grid.
 * Returns an array of { time_ms, type } for the most musically significant
 * beats within the scene window.
 *
 * Strategy: place emphasis beats on the first strong beat (bar 1) and
 * any beat that lands on the drop/build section boundary.
 */
export function suggestEmphasisBeats(
  sceneStartMs: number,
  sceneEndMs: number,
  grid: BeatGrid,
  maxBeats = 2
): Array<{ time_ms: number; type: 'scale_pop' | 'flash' | 'zoom'; intensity: number }> {
  const { beat_grid_ms, bpm, sections } = grid
  const beatsPerBar = 4
  const beatPeriodMs = 60_000 / bpm
  const barPeriodMs = beatPeriodMs * beatsPerBar

  const results: Array<{ time_ms: number; type: 'scale_pop'; intensity: number }> = []

  for (const beat of beat_grid_ms) {
    if (beat < sceneStartMs || beat >= sceneEndMs) continue

    const relativeMs = beat - sceneStartMs

    // Downbeats (every 4th beat = bar 1) get emphasis
    const beatIndex = Math.round(beat / beatPeriodMs)
    const isDownbeat = beatIndex % beatsPerBar === 0

    // Section boundaries get highest intensity
    const isDropPoint = Math.abs(beat - sections.drop_end_ms) < barPeriodMs ||
                        Math.abs(beat - sections.build_end_ms) < barPeriodMs

    const intensity = isDropPoint ? 0.9 : isDownbeat ? 0.6 : 0.3

    if (isDownbeat || isDropPoint) {
      results.push({ time_ms: relativeMs, type: 'scale_pop', intensity })
    }

    if (results.length >= maxBeats) break
  }

  return results
}

// ─── BPM → energy level ──────────────────────────────────────────────────────

/**
 * Convert a track's BPM to an energy level (1-10) for pacing decisions.
 */
export function bpmToEnergyLevel(bpm: number): number {
  // 60bpm = level 2, 100bpm = level 5, 140bpm = level 9
  const level = Math.round(((bpm - 60) / 80) * 7 + 2)
  return Math.max(1, Math.min(10, level))
}

// ─── Scene list snap (batch) ──────────────────────────────────────────────────

/**
 * Snap all scene cut points in a video to the beat grid.
 * Mutates the duration_seconds of each scene to align scene starts/ends
 * to musical beats. Preserves approximate visual timing while prioritizing
 * rhythmic alignment.
 *
 * @param scenes  Array of { duration_seconds } objects (from storyboard)
 * @param grid    Beat grid from the selected music track
 * @returns       New array of { duration_seconds } with snapped durations
 */
export function snapSceneListToGrid(
  scenes: Array<{ duration_seconds: number }>,
  grid: BeatGrid
): Array<{ duration_seconds: number }> {
  let cursorMs = 0
  return scenes.map((scene) => {
    const durationMs = scene.duration_seconds * 1000
    const { start_ms, duration_ms } = snapSceneToBeat(cursorMs, durationMs, grid)
    cursorMs = start_ms + duration_ms
    return {
      ...scene,
      duration_seconds: Math.round(duration_ms / 100) / 10, // 1dp precision
    }
  })
}
