import { useState } from 'react'
import { Sparkles, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import type { DbHook } from '@/types/db'
import { HOOK_TYPE_LABELS } from '@/lib/projectConstants'
import { Button } from '@/components/ui/button'

interface Props {
  hooks: DbHook[] | null
  loading: boolean
  selectedDirectionId: string | undefined
  onSelect: (id: string) => Promise<void>
  onGenerate: () => Promise<void>
}

function HookCard({ hook, onSelect }: { hook: DbHook; onSelect: (id: string) => void }) {
  const [selecting, setSelecting] = useState(false)
  const [rationaleOpen, setRationaleOpen] = useState(false)

  async function handleSelect() {
    setSelecting(true)
    try { await onSelect(hook.id) } finally { setSelecting(false) }
  }

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        hook.selected
          ? 'border-teal-700 bg-teal-950/20 ring-1 ring-teal-800'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start gap-2">
        {hook.selected && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />}

        <div className="flex-1 min-w-0">
          {/* Hook text */}
          <p className="text-sm text-zinc-200 leading-snug">{hook.hook_text}</p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-1.5 py-0.5 rounded border bg-zinc-800 text-zinc-400 border-zinc-700">
              {HOOK_TYPE_LABELS[hook.hook_type]}
            </span>

            {hook.score !== null && (
              <div className="flex items-center gap-1.5">
                {/* Score bar */}
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${(hook.score / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">{hook.score.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Rationale */}
          {hook.rationale && (
            <div className="mt-2">
              <button
                onClick={() => setRationaleOpen((v) => !v)}
                className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {rationaleOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Rationale
              </button>
              {rationaleOpen && (
                <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{hook.rationale}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {!hook.selected && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSelect}
          disabled={selecting}
          className="mt-2 h-7 text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-950/40 px-3"
        >
          {selecting ? 'Selecting...' : 'Select'}
        </Button>
      )}
    </div>
  )
}

export function HooksPanel({ hooks, loading, selectedDirectionId, onSelect, onGenerate }: Props) {
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try { await onGenerate() } finally { setGenerating(false) }
  }

  if (!selectedDirectionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
        <p className="text-zinc-500 text-sm font-medium">No story direction selected</p>
        <p className="text-zinc-600 text-xs mt-1">Select a story direction first to view and generate hooks</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <span className="text-xs text-zinc-500 flex-1">
          {hooks ? `${hooks.length} hook${hooks.length !== 1 ? 's' : ''}` : ''}
        </span>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="h-7 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-1.5"
        >
          <Sparkles className="w-3 h-3" />
          {generating ? 'Generating...' : 'Generate Hooks'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !hooks?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-zinc-700 mb-3" strokeWidth={1.25} />
            <p className="text-zinc-500 text-sm font-medium">No hooks yet</p>
            <p className="text-zinc-600 text-xs mt-1">Generate hooks for your selected story direction</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hooks.map((h) => (
              <HookCard key={h.id} hook={h} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
