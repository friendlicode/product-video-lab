import { useState, useEffect } from 'react'
import { Sparkles, Plus, Trash2, Save } from 'lucide-react'
import type { DbCaptionVersion } from '@/types/db'
import type { CaptionSegment } from '@/types/index'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  versions: DbCaptionVersion[] | null
  loading: boolean
  selectedScriptId: string | null
  selectedStoryboardVersionId: string | null
  onSave: (scriptId: string, storyboardVersionId: string, segments: CaptionSegment[]) => Promise<unknown>
  onGenerate: () => Promise<void>
}

function formatMs(ms: number): string {
  const totalSecs = ms / 1000
  const mins = Math.floor(totalSecs / 60)
  const secs = (totalSecs % 60).toFixed(1)
  return mins > 0 ? `${mins}:${secs.padStart(4, '0')}` : secs
}

function parseMs(val: string): number {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : Math.round(n * 1000)
}

const inputCls =
  'bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500'

export function CaptionsPanel({
  versions,
  loading,
  selectedScriptId,
  selectedStoryboardVersionId,
  onSave,
  onGenerate,
}: Props) {
  const [viewId, setViewId] = useState<string | null>(null)
  const [segments, setSegments] = useState<CaptionSegment[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const latestVersion = versions?.[0] ?? null
  const viewVersion = (viewId ? versions?.find((v) => v.id === viewId) : null) ?? latestVersion

  useEffect(() => {
    if (!viewVersion) { setSegments([]); return }
    setSegments(viewVersion.segments.map((s) => ({ ...s })))
  }, [viewVersion?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (latestVersion && !viewId) setViewId(latestVersion.id)
  }, [latestVersion?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateSegment(i: number, field: keyof CaptionSegment, value: string | number) {
    setSegments((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addSegment() {
    const lastEnd = segments[segments.length - 1]?.end_ms ?? 0
    setSegments((prev) => [...prev, { start_ms: lastEnd, end_ms: lastEnd + 2000, text: '' }])
  }

  function removeSegment(i: number) {
    setSegments((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!selectedScriptId || !selectedStoryboardVersionId) return
    setSaving(true)
    try {
      await onSave(selectedScriptId, selectedStoryboardVersionId, segments)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    try { await onGenerate() } finally { setGenerating(false) }
  }

  const canSave = Boolean(selectedScriptId && selectedStoryboardVersionId)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        {versions && versions.length > 0 ? (
          <Select value={viewId ?? ''} onValueChange={setViewId}>
            <SelectTrigger className="h-7 w-36 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {versions.map((v) => (
                <SelectItem
                  key={v.id}
                  value={v.id}
                  className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
                >
                  v{v.version_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-zinc-600">No caption versions</span>
        )}

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={saving || !canSave}
          title={!canSave ? 'Select a script and storyboard first' : undefined}
          className="h-7 text-xs text-zinc-400 hover:text-zinc-100 gap-1.5 disabled:opacity-40"
        >
          <Save className="w-3 h-3" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Captions'}
        </Button>

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating || !canSave}
          className="h-7 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-1.5 disabled:opacity-40"
        >
          <Sparkles className="w-3 h-3" />
          {generating ? 'Generating...' : 'Generate Captions'}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-4 space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />)}
        </div>
      ) : !viewVersion && segments.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
          <Sparkles className="w-8 h-8 text-zinc-700 mb-3" strokeWidth={1.25} />
          <p className="text-zinc-500 text-sm font-medium">No captions yet</p>
          <p className="text-zinc-600 text-xs mt-1">Generate captions from your script and storyboard</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={addSegment}
            className="mt-4 h-7 text-xs text-zinc-400 hover:text-zinc-100 gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Segment Manually
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Column headers */}
          {segments.length > 0 && (
            <div className="grid grid-cols-[64px_64px_1fr_28px] gap-2 px-1">
              <p className="text-xs text-zinc-600 uppercase tracking-wide" style={{ fontSize: '10px' }}>Start</p>
              <p className="text-xs text-zinc-600 uppercase tracking-wide" style={{ fontSize: '10px' }}>End</p>
              <p className="text-xs text-zinc-600 uppercase tracking-wide" style={{ fontSize: '10px' }}>Text</p>
            </div>
          )}

          {segments.map((seg, i) => (
            <div key={i} className="grid grid-cols-[64px_64px_1fr_28px] gap-2 items-center">
              <input
                type="number"
                value={(seg.start_ms / 1000).toFixed(1)}
                onChange={(e) => updateSegment(i, 'start_ms', parseMs(e.target.value))}
                step={0.1}
                min={0}
                className={`${inputCls} w-full`}
                title={formatMs(seg.start_ms)}
              />
              <input
                type="number"
                value={(seg.end_ms / 1000).toFixed(1)}
                onChange={(e) => updateSegment(i, 'end_ms', parseMs(e.target.value))}
                step={0.1}
                min={0}
                className={`${inputCls} w-full`}
                title={formatMs(seg.end_ms)}
              />
              <input
                type="text"
                value={seg.text}
                onChange={(e) => updateSegment(i, 'text', e.target.value)}
                placeholder="Caption text..."
                className={`${inputCls} w-full`}
              />
              <button
                onClick={() => removeSegment(i)}
                className="text-zinc-700 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <Button
            size="sm"
            variant="ghost"
            onClick={addSegment}
            className="w-full h-7 text-xs text-zinc-600 hover:text-zinc-300 border border-dashed border-zinc-800 hover:border-zinc-700 gap-1.5 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Segment
          </Button>
        </div>
      )}
    </div>
  )
}
