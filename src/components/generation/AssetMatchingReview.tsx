/**
 * AssetMatchingReview — review and confirm AI asset-to-scene pairings.
 *
 * Displayed after storyboard generation. The AI proposes which asset
 * belongs in which scene; the user can accept or swap any pairing before
 * the matches are applied back to the storyboard.
 *
 * Props:
 *   storyboardVersionId — ID of the storyboard version to update.
 *   projectId           — project ID (to load available assets).
 *   onApplied           — callback when changes are saved.
 *   onClose             — close/dismiss the panel.
 */

import { useState, useEffect, useCallback } from 'react'
import { Wand2, CheckCircle2, XCircle, RefreshCw, ChevronDown, Image, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getProjectAssets } from '@/services/assets'
import {
  matchAssetsToScenes,
  applyAssetMatches,
  type AssetMatchSuggestion,
} from '@/services/generation'
import type { DbProjectAsset } from '@/types/db'

// ─── Confidence badge ─────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG = {
  high:   { label: 'Strong match',    classes: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  medium: { label: 'Good match',      classes: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  low:    { label: 'Weak match',      classes: 'text-red-400 bg-red-400/10 border-red-400/20' },
  none:   { label: 'No asset needed', classes: 'text-zinc-500 bg-zinc-800 border-zinc-700' },
}

// ─── Single scene row ─────────────────────────────────────────────────────────

function SceneRow({
  suggestion,
  assets,
  onSwap,
}: {
  suggestion: AssetMatchSuggestion & { selectedAssetId: string | null }
  assets: DbProjectAsset[]
  onSwap: (sceneIndex: number, assetId: string | null) => void
}) {
  const [showSwap, setShowSwap] = useState(false)

  const selectedAsset = assets.find((a) => a.id === suggestion.selectedAssetId)
  const alternativeAssets = suggestion.alternatives
    .map((id) => assets.find((a) => a.id === id))
    .filter(Boolean) as DbProjectAsset[]

  const { label: confLabel, classes: confClasses } =
    CONFIDENCE_CONFIG[suggestion.confidence] ?? CONFIDENCE_CONFIG.none

  const isTextOnly = suggestion.scene_type === 'text_overlay' ||
    suggestion.scene_type === 'transition_card' ||
    suggestion.scene_type === 'kinetic_text'

  function AssetThumb({ asset }: { asset: DbProjectAsset }) {
    const isVideo = asset.mime_type?.startsWith('video/') ?? asset.file_name.match(/\.(mp4|mov|webm)$/i)
    return (
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-10 h-8 rounded-md bg-zinc-700 flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={
            !isVideo && asset.file_url
              ? { backgroundImage: `url(${asset.file_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}
          }
        >
          {isVideo ? (
            <Video size={14} className="text-zinc-400" />
          ) : !asset.file_url ? (
            <Image size={14} className="text-zinc-400" />
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-zinc-200 truncate font-medium">{asset.file_name}</div>
          {asset.semantic_tags?.length > 0 && (
            <div className="text-xs text-zinc-500 truncate">
              {asset.semantic_tags.slice(0, 2).join(', ')}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      {/* Scene header */}
      <div className="flex items-start gap-3 p-3 bg-zinc-900/50">
        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center mt-0.5">
          <span className="text-xs text-zinc-500 font-mono">{suggestion.scene_index}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-zinc-300 capitalize">
              {suggestion.narrative_role}
            </span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">{suggestion.scene_type.replace(/_/g, ' ')}</span>
          </div>
          {suggestion.on_screen_text && (
            <p className="text-xs text-zinc-500 truncate italic">"{suggestion.on_screen_text}"</p>
          )}
        </div>

        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${confClasses}`}>
          {confLabel}
        </span>
      </div>

      {/* Asset selection */}
      <div className="p-3 border-t border-zinc-800/60 space-y-2">
        {isTextOnly && !suggestion.selectedAssetId ? (
          <p className="text-xs text-zinc-600 italic">Text-only scene — no asset required</p>
        ) : selectedAsset ? (
          <AssetThumb asset={selectedAsset} />
        ) : (
          <p className="text-xs text-red-400/80 italic">No asset assigned</p>
        )}

        {/* Reasoning tooltip */}
        {suggestion.reasoning && (
          <p className="text-xs text-zinc-600 leading-relaxed">{suggestion.reasoning}</p>
        )}

        {/* Swap control */}
        <div className="flex items-center gap-2">
          <button
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            onClick={() => setShowSwap((v) => !v)}
          >
            <ChevronDown
              size={12}
              className={`transition-transform ${showSwap ? 'rotate-180' : ''}`}
            />
            Swap asset
          </button>
        </div>

        {showSwap && (
          <div className="space-y-1 pt-1 border-t border-zinc-800/60">
            {/* None option */}
            <button
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors
                ${!suggestion.selectedAssetId
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                }`}
              onClick={() => { onSwap(suggestion.scene_index, null); setShowSwap(false) }}
            >
              None (text only)
            </button>

            {/* All available assets */}
            {assets.map((asset) => (
              <button
                key={asset.id}
                className={`w-full text-left px-2 py-2 rounded-lg transition-colors
                  ${suggestion.selectedAssetId === asset.id
                    ? 'bg-violet-500/15 border border-violet-500/30'
                    : 'hover:bg-zinc-800/60 border border-transparent'
                  }`}
                onClick={() => { onSwap(suggestion.scene_index, asset.id); setShowSwap(false) }}
              >
                <AssetThumb asset={asset} />
                {alternativeAssets.some((a) => a.id === asset.id) && (
                  <span className="ml-12 text-xs text-violet-400">AI suggestion</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  projectId: string
  storyboardVersionId: string | null
  onApplied?: () => void
  onClose?: () => void
}

export function AssetMatchingReview({
  projectId,
  storyboardVersionId,
  onApplied,
  onClose,
}: Props) {
  const [matching, setMatching] = useState(false)
  const [applying, setApplying] = useState(false)
  const [suggestions, setSuggestions] = useState<
    Array<AssetMatchSuggestion & { selectedAssetId: string | null }>
  >([])
  const [assets, setAssets] = useState<DbProjectAsset[]>([])

  // Load assets on mount
  useEffect(() => {
    if (!projectId) return
    getProjectAssets(projectId)
      .then(setAssets)
      .catch(console.warn)
  }, [projectId])

  const runMatching = useCallback(async () => {
    if (!storyboardVersionId) return
    setMatching(true)
    try {
      const raw = await matchAssetsToScenes(projectId, storyboardVersionId)
      setSuggestions(
        raw.map((s) => ({
          ...s,
          selectedAssetId: s.recommended_asset_id,
        }))
      )
    } catch (err) {
      toast.error('Asset matching failed: ' + (err as Error).message)
    } finally {
      setMatching(false)
    }
  }, [projectId, storyboardVersionId])

  const handleSwap = useCallback((sceneIndex: number, assetId: string | null) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.scene_index === sceneIndex ? { ...s, selectedAssetId: assetId } : s
      )
    )
  }, [])

  const handleApply = useCallback(async () => {
    if (!storyboardVersionId) return
    setApplying(true)
    try {
      await applyAssetMatches(
        storyboardVersionId,
        suggestions.map((s) => ({ scene_index: s.scene_index, asset_id: s.selectedAssetId }))
      )
      toast.success('Asset assignments saved!')
      onApplied?.()
    } catch (err) {
      toast.error('Failed to apply: ' + (err as Error).message)
    } finally {
      setApplying(false)
    }
  }, [storyboardVersionId, suggestions, onApplied])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Wand2 size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-zinc-200">Asset Matching</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <XCircle size={16} />
          </button>
        )}
      </div>

      {/* Trigger */}
      {suggestions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Wand2 size={22} className="text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200 mb-1">AI Asset Matching</p>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-48">
              Let the AI find the best screenshot or clip for each scene based on semantic analysis.
            </p>
          </div>
          <Button
            onClick={runMatching}
            disabled={matching || !storyboardVersionId || assets.length === 0}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm"
          >
            {matching ? (
              <>
                <RefreshCw size={13} className="mr-2 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <Wand2 size={13} className="mr-2" />
                Match Assets to Scenes
              </>
            )}
          </Button>
          {assets.length === 0 && (
            <p className="text-xs text-amber-400/80">Upload assets first to enable matching</p>
          )}
        </div>
      )}

      {/* Results */}
      {suggestions.length > 0 && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {suggestions.map((s) => (
              <SceneRow
                key={s.scene_index}
                suggestion={s}
                assets={assets}
                onSwap={handleSwap}
              />
            ))}
          </div>

          {/* Footer actions */}
          <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={runMatching}
              disabled={matching}
              className="text-zinc-400 hover:text-zinc-200 text-xs"
            >
              <RefreshCw size={12} className={`mr-1.5 ${matching ? 'animate-spin' : ''}`} />
              Re-run
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={handleApply}
              disabled={applying}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
            >
              {applying ? (
                <RefreshCw size={12} className="mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 size={12} className="mr-1.5" />
              )}
              Apply all assignments
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
