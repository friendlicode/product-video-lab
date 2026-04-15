import { useState, useEffect } from 'react'
import { Sparkles, Save } from 'lucide-react'
import type { DbScript } from '@/types/db'
import type { NarrativeRole } from '@/types/index'
import { NARRATIVE_ROLES } from '@/lib/utils'
import { ROLE_CONFIG } from '@/lib/projectConstants'
import type { UpdateScriptData } from '@/services/scripts'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  scripts: DbScript[] | null
  loading: boolean
  hasSelectedHook: boolean
  onSelectScript: (id: string) => Promise<void>
  onUpdateScript: (id: string, fields: UpdateScriptData) => Promise<unknown>
  onGenerate: () => Promise<void>
}

const textareaCls =
  'w-full bg-zinc-800 border border-zinc-700 rounded px-2.5 py-2 text-xs text-zinc-200 resize-none focus:outline-none focus:border-zinc-500 leading-relaxed placeholder:text-zinc-600'

export function ScriptEditor({
  scripts,
  loading,
  hasSelectedHook,
  onSelectScript,
  onUpdateScript,
  onGenerate,
}: Props) {
  const [viewId, setViewId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Local editable state
  const [narrative, setNarrative] = useState<Record<string, string>>({})
  const [voiceover, setVoiceover] = useState('')
  const [ctaScript, setCtaScript] = useState('')
  const [duration, setDuration] = useState<string>('')

  const selectedScript = scripts?.find((s) => s.selected) ?? null
  const viewScript = (viewId ? scripts?.find((s) => s.id === viewId) : null) ?? selectedScript

  // Sync local state when viewed script changes
  useEffect(() => {
    if (!viewScript) {
      setNarrative({})
      setVoiceover('')
      setCtaScript('')
      setDuration('')
      return
    }
    setNarrative({ ...viewScript.narrative_structure })
    setVoiceover(viewScript.voiceover_script ?? '')
    setCtaScript(viewScript.cta_script ?? '')
    setDuration(viewScript.duration_target_seconds?.toString() ?? '')
  }, [viewScript?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialise viewId to selected script
  useEffect(() => {
    if (selectedScript && !viewId) setViewId(selectedScript.id)
  }, [selectedScript?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!viewScript) return
    setSaving(true)
    try {
      await onUpdateScript(viewScript.id, {
        narrative_structure: narrative,
        voiceover_script: voiceover || null,
        cta_script: ctaScript || null,
        duration_target_seconds: duration ? Number(duration) : null,
      })
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

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-zinc-800 rounded animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        {scripts && scripts.length > 0 ? (
          <Select value={viewId ?? ''} onValueChange={(v) => setViewId(v)}>
            <SelectTrigger className="h-7 w-48 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {scripts.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
                >
                  v{s.version_number} {s.title}
                  {s.selected ? ' (active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-zinc-600 flex-1">No scripts</span>
        )}

        <div className="flex-1" />

        {viewScript && !viewScript.selected && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelectScript(viewScript.id)}
            className="h-7 text-xs text-teal-400 hover:text-teal-300"
          >
            Set Active
          </Button>
        )}

        {viewScript && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={saving}
            className="h-7 text-xs text-zinc-400 hover:text-zinc-100 gap-1.5"
          >
            <Save className="w-3 h-3" />
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating || !hasSelectedHook}
          title={!hasSelectedHook ? 'Select a hook first' : undefined}
          className="h-7 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-1.5 disabled:opacity-40"
        >
          <Sparkles className="w-3 h-3" />
          {generating ? 'Generating...' : 'Generate Script'}
        </Button>
      </div>

      {/* Content */}
      {!viewScript ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
          <Sparkles className="w-8 h-8 text-zinc-700 mb-3" strokeWidth={1.25} />
          <p className="text-zinc-500 text-sm font-medium">No script yet</p>
          <p className="text-zinc-600 text-xs mt-1">Select a hook, then generate a script</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Narrative sections */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Narrative Structure
            </p>
            {NARRATIVE_ROLES.map((role: NarrativeRole) => {
              const cfg = ROLE_CONFIG[role]
              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                    <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <textarea
                    value={narrative[role] ?? ''}
                    onChange={(e) =>
                      setNarrative((prev) => ({ ...prev, [role]: e.target.value }))
                    }
                    rows={3}
                    placeholder={`${cfg.label} content...`}
                    className={textareaCls}
                  />
                </div>
              )
            })}
          </div>

          {/* Voiceover */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Voiceover Script
            </p>
            <textarea
              value={voiceover}
              onChange={(e) => setVoiceover(e.target.value)}
              rows={5}
              placeholder="Full voiceover script..."
              className={textareaCls}
            />
          </div>

          {/* CTA Script */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              CTA Script
            </p>
            <textarea
              value={ctaScript}
              onChange={(e) => setCtaScript(e.target.value)}
              rows={2}
              placeholder="Call to action script..."
              className={textareaCls}
            />
          </div>

          {/* Full script (read-only) */}
          {viewScript.full_script && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                Full Script (assembled)
              </p>
              <pre className="text-xs text-zinc-500 bg-zinc-950 rounded p-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {viewScript.full_script}
              </pre>
            </div>
          )}

          {/* Duration */}
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Duration Target
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={0}
                max={600}
                placeholder="60"
                className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
              <span className="text-xs text-zinc-600">seconds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
