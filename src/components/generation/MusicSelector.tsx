/**
 * MusicSelector — Music track selection component.
 *
 * Displayed in the script/storyboard editor flow.
 * Searches Epidemic Sound for matching tracks, plays 30s previews,
 * and lets the user pick one to attach to the render payload.
 *
 * Props:
 *   renderPayloadId   — ID of the assembled render payload to attach music to.
 *   energyLevel       — 1-10 from the storyboard's visual_strategy (pacing).
 *   mood              — e.g. 'energetic', 'inspiring', 'dark' from visual_strategy.
 *   durationSeconds   — total video duration (to match track length).
 *   onCueSelected     — called when user confirms a track pick.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Music, Play, Pause, Check, RefreshCw, X, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  searchMusicTracks,
  saveMusicCue,
  removeMusicCue,
  getMusicCue,
  type MusicTrackOption,
  type SavedMusicCue,
} from '@/services/music'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  renderPayloadId: string | null
  energyLevel?: number | null
  mood?: string | null
  durationSeconds?: number
  onCueSelected?: (cue: SavedMusicCue | null) => void
}

// ─── Track card ───────────────────────────────────────────────────────────────

function TrackCard({
  track,
  isSelected,
  isPlaying,
  onPlay,
  onSelect,
}: {
  track: MusicTrackOption
  isSelected: boolean
  isPlaying: boolean
  onPlay: () => void
  onSelect: () => void
}) {
  return (
    <div
      className={`
        relative rounded-xl border p-4 transition-all cursor-pointer
        ${isSelected
          ? 'border-violet-500 bg-violet-500/10'
          : 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800'
        }
      `}
      onClick={onSelect}
    >
      {/* Selection check */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Album art placeholder */}
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{
            background: track.image_url
              ? `url(${track.image_url}) center/cover`
              : 'linear-gradient(135deg, #3f3f46, #52525b)',
          }}
        >
          {!track.image_url && <Music size={20} className="text-zinc-500" />}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-zinc-100 text-sm truncate">{track.title}</div>
          <div className="text-zinc-400 text-xs truncate">{track.artist}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {track.bpm && (
              <span className="text-xs text-zinc-500 bg-zinc-700/60 px-2 py-0.5 rounded-full">
                ~{track.bpm} BPM
              </span>
            )}
            {track.moods.slice(0, 1).map((m) => (
              <span key={m} className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full capitalize">
                {m}
              </span>
            ))}
            {/* Source badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              track.source === 'jamendo'
                ? 'text-blue-400 bg-blue-400/10'
                : 'text-emerald-400 bg-emerald-400/10'
            }`}>
              {track.source === 'jamendo' ? 'Jamendo CC' : 'CC0'}
            </span>
          </div>
        </div>

        {/* Play button */}
        <button
          className={`
            flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
            transition-colors border
            ${isPlaying
              ? 'bg-violet-500 border-violet-400 text-white'
              : 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600'
            }
          `}
          onClick={(e) => { e.stopPropagation(); onPlay() }}
          title={isPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
      </div>

      {/* Beat grid visualizer — a tiny bar chart of beat density */}
      {track.beat_grid_ms.length > 0 && (
        <div className="mt-3 flex items-end gap-px h-4 overflow-hidden">
          {Array.from({ length: 32 }).map((_, i) => {
            // Fill factor: how many beats fall in this 1/32 slice of the track?
            const sliceStart = (track.duration_ms / 32) * i
            const sliceEnd = (track.duration_ms / 32) * (i + 1)
            const count = track.beat_grid_ms.filter(
              (b) => b >= sliceStart && b < sliceEnd
            ).length
            const height = count > 0 ? Math.min(16, 4 + count * 6) : 2
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all ${
                  isSelected ? 'bg-violet-500/60' : 'bg-zinc-600/60'
                }`}
                style={{ height }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MusicSelector({
  renderPayloadId,
  energyLevel,
  mood,
  durationSeconds = 30,
  onCueSelected,
}: Props) {
  const [searching, setSearching] = useState(false)
  const [options, setOptions] = useState<MusicTrackOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedCue, setSavedCue] = useState<SavedMusicCue | null>(null)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load existing cue on mount
  useEffect(() => {
    if (!renderPayloadId) return
    getMusicCue(renderPayloadId)
      .then((cue) => {
        if (cue) {
          setSavedCue(cue)
          setSelectedId(cue.track_id)
          onCueSelected?.(cue)
        }
      })
      .catch(console.warn)
  }, [renderPayloadId])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const handleSearch = useCallback(async () => {
    setSearching(true)
    setError(null)
    try {
      const tracks = await searchMusicTracks({
        mood: mood ?? 'energetic',
        energy_level: energyLevel ?? 7,
        duration_seconds: durationSeconds,
      })
      setOptions(tracks)
      if (tracks.length === 0) {
        setError('No tracks found. Try adjusting your project mood or energy level.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Music search failed')
    } finally {
      setSearching(false)
    }
  }, [mood, energyLevel, durationSeconds])

  const handlePlay = useCallback((track: MusicTrackOption) => {
    if (playingId === track.id) {
      // Pause
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }

    // Stop current
    audioRef.current?.pause()

    const audio = new Audio(track.preview_url)
    audioRef.current = audio
    audio.play().catch(console.warn)
    audio.onended = () => setPlayingId(null)
    setPlayingId(track.id)
  }, [playingId])

  const handleSave = useCallback(async () => {
    if (!selectedId || !renderPayloadId) return
    const track = options.find((t) => t.id === selectedId)
    if (!track) return

    setSaving(true)
    try {
      const cue = await saveMusicCue(renderPayloadId, track)
      setSavedCue(cue)
      onCueSelected?.(cue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save music selection')
    } finally {
      setSaving(false)
    }
  }, [selectedId, renderPayloadId, options])

  const handleRemove = useCallback(async () => {
    if (!renderPayloadId) return
    audioRef.current?.pause()
    setPlayingId(null)
    try {
      await removeMusicCue(renderPayloadId)
      setSavedCue(null)
      setSelectedId(null)
      onCueSelected?.(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove music')
    }
  }, [renderPayloadId])

  const hasUnsavedChange = selectedId && selectedId !== savedCue?.track_id

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-zinc-200">Background Music</span>
          {savedCue && (
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              Selected
            </span>
          )}
        </div>
        {savedCue && (
          <button
            onClick={handleRemove}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Remove music"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Saved cue summary (collapsed state when music already selected) */}
      {savedCue && options.length === 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700">
          <div className="w-8 h-8 rounded-md bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Music size={14} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-200 truncate">{savedCue.track_title}</div>
            <div className="text-xs text-zinc-500">{savedCue.track_artist} · {savedCue.bpm} BPM</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-400 hover:text-zinc-200"
            onClick={handleSearch}
          >
            <RefreshCw size={12} className="mr-1.5" />
            Change
          </Button>
        </div>
      )}

      {/* Search trigger (no results yet) */}
      {!savedCue && options.length === 0 && (
        <div className="text-center py-6 border border-dashed border-zinc-700 rounded-xl">
          <Music size={28} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 mb-4">
            Find a beat-matched track for your video
          </p>
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={searching || !renderPayloadId}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {searching ? (
              <>
                <RefreshCw size={13} className="mr-2 animate-spin" />
                Searching Epidemic Sound...
              </>
            ) : (
              <>
                <Music size={13} className="mr-2" />
                Find Tracks
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Track options */}
      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              isSelected={selectedId === track.id}
              isPlaying={playingId === track.id}
              onPlay={() => handlePlay(track)}
              onSelect={() => setSelectedId(track.id)}
            />
          ))}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearch}
              disabled={searching}
              className="text-zinc-400 hover:text-zinc-200 text-xs"
            >
              {searching ? (
                <RefreshCw size={12} className="mr-1.5 animate-spin" />
              ) : (
                <RefreshCw size={12} className="mr-1.5" />
              )}
              Refresh options
            </Button>

            <div className="flex-1" />

            {hasUnsavedChange && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
              >
                {saving ? (
                  <RefreshCw size={12} className="mr-1.5 animate-spin" />
                ) : (
                  <Check size={12} className="mr-1.5" />
                )}
                Use this track
              </Button>
            )}

            {savedCue && !hasUnsavedChange && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check size={12} />
                Track saved
              </span>
            )}
          </div>
        </div>
      )}

      {/* Attribution note for Jamendo CC-BY tracks */}
      {options.some((t) => t.source === 'jamendo') && (
        <div className="text-xs text-zinc-600 leading-relaxed">
          Jamendo tracks are Creative Commons (CC-BY). Artist credit is stored automatically.{' '}
          <a
            href="https://developer.jamendo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 underline"
          >
            Free API key
          </a>
        </div>
      )}

      {/* Context pill: what the AI will use for music matching */}
      {(mood || energyLevel) && (
        <div className="text-xs text-zinc-600 flex items-center gap-2">
          <span>Matching:</span>
          {mood && <span className="text-zinc-500 capitalize">{mood.replace(/_/g, ' ')}</span>}
          {energyLevel && <span className="text-zinc-500">· Energy {energyLevel}/10</span>}
        </div>
      )}
    </div>
  )
}
