import { useState } from 'react'
import { Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react'
import type { DbStoryDirection } from '@/types/db'
import { NARRATIVE_TYPE_LABELS } from '@/lib/projectConstants'
import { Button } from '@/components/ui/button'

interface Props {
  directions: DbStoryDirection[] | null
  loading: boolean
  hasBrief: boolean
  generatingLock?: boolean
  onSelect: (id: string) => Promise<void>
  onGenerate: () => Promise<void>
}

function DirectionCard({
  direction,
  onSelect,
}: {
  direction: DbStoryDirection
  onSelect: (id: string) => void
}) {
  const [selecting, setSelecting] = useState(false)

  async function handleSelect() {
    setSelecting(true)
    try { await onSelect(direction.id) } finally { setSelecting(false) }
  }

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        direction.selected
          ? 'border-teal-700 bg-teal-950/20 ring-1 ring-teal-800'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      }`}
    >
      {direction.selected && (
        <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-teal-400" />
      )}

      {/* Header */}
      <div className="pr-6 mb-3">
        <p className="text-sm font-medium text-zinc-100 leading-snug">{direction.title}</p>
        <span className="inline-flex items-center mt-1.5 text-xs px-2 py-0.5 rounded-full border bg-zinc-800 text-zinc-400 border-zinc-700">
          {NARRATIVE_TYPE_LABELS[direction.narrative_type]}
        </span>
      </div>

      {/* Fields */}
      <div className="space-y-2 text-xs">
        {direction.angle && (
          <div>
            <p className="text-zinc-600 uppercase tracking-wide font-medium" style={{ fontSize: '10px' }}>Angle</p>
            <p className="text-zinc-400 mt-0.5 line-clamp-2">{direction.angle}</p>
          </div>
        )}
        {direction.target_emotion && (
          <div>
            <p className="text-zinc-600 uppercase tracking-wide font-medium" style={{ fontSize: '10px' }}>Emotion</p>
            <p className="text-zinc-400 mt-0.5">{direction.target_emotion}</p>
          </div>
        )}
        {direction.tension && (
          <div>
            <p className="text-zinc-600 uppercase tracking-wide font-medium" style={{ fontSize: '10px' }}>Tension</p>
            <p className="text-zinc-400 mt-0.5 line-clamp-2">{direction.tension}</p>
          </div>
        )}
        {direction.payoff && (
          <div>
            <p className="text-zinc-600 uppercase tracking-wide font-medium" style={{ fontSize: '10px' }}>Payoff</p>
            <p className="text-zinc-400 mt-0.5 line-clamp-2">{direction.payoff}</p>
          </div>
        )}
        {direction.cta_angle && (
          <div>
            <p className="text-zinc-600 uppercase tracking-wide font-medium" style={{ fontSize: '10px' }}>CTA Angle</p>
            <p className="text-zinc-400 mt-0.5">{direction.cta_angle}</p>
          </div>
        )}
      </div>

      {!direction.selected && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSelect}
          disabled={selecting}
          className="mt-3 h-7 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-950/40 px-3"
        >
          {selecting ? 'Selecting...' : 'Select'}
        </Button>
      )}
    </div>
  )
}

export function StoryDirections({ directions, loading, hasBrief, generatingLock, onSelect, onGenerate }: Props) {
  const [generating, setGenerating] = useState(false)
  const hasDirections = (directions?.length ?? 0) > 0

  async function handleGenerate() {
    setGenerating(true)
    try { await onGenerate() } finally { setGenerating(false) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <span className="text-xs text-zinc-500 flex-1">
          {directions ? `${directions.length} direction${directions.length !== 1 ? 's' : ''}` : ''}
        </span>

        {hasDirections && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerate}
            disabled={generating || generatingLock || !hasBrief}
            className="h-7 text-xs text-zinc-400 hover:text-zinc-100 gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating || generatingLock || !hasBrief}
          title={!hasBrief ? 'Generate a product brief first' : undefined}
          className="h-7 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-1.5 disabled:opacity-40"
        >
          <Sparkles className="w-3 h-3" />
          {generating ? 'Crafting story directions...' : 'Generate Directions'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !hasDirections ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-zinc-700 mb-3" strokeWidth={1.25} />
            <p className="text-zinc-500 text-sm font-medium">No story directions yet</p>
            <p className="text-zinc-600 text-xs mt-1 max-w-xs">
              {hasBrief
                ? 'Generate story directions to explore different narrative angles'
                : 'Generate a product brief first, then create story directions'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {directions!.map((d) => (
              <DirectionCard key={d.id} direction={d} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
