import { useState, useEffect } from 'react'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useScripts } from '@/hooks/useScripts'
import { getStoryboardVersions, getStoryboardWithScenes } from '@/services/storyboards'
import type { DbScript, DbStoryboardVersion, DbStoryboardScene } from '@/types/db'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Word-level diff ──────────────────────────────────────────────────────────

type DiffPart = { text: string; type: 'common' | 'added' | 'removed' }

function wordDiff(a: string, b: string): DiffPart[] {
  if (!a && !b) return []
  if (!a) return [{ text: b, type: 'added' }]
  if (!b) return [{ text: a, type: 'removed' }]

  const aW = a.split(/(\s+)/)
  const bW = b.split(/(\s+)/)
  const m = aW.length
  const n = bW.length

  // LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[])
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = aW[i - 1] === bW[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack
  const parts: DiffPart[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aW[i - 1] === bW[j - 1]) {
      parts.unshift({ text: aW[i - 1], type: 'common' })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      parts.unshift({ text: bW[j - 1], type: 'added' })
      j--
    } else {
      parts.unshift({ text: aW[i - 1], type: 'removed' })
      i--
    }
  }
  return parts
}

function DiffText({ a, b }: { a: string; b: string }) {
  const parts = wordDiff(a || '', b || '')
  if (parts.length === 0) return <span className="text-zinc-600 italic">Empty</span>
  return (
    <span className="leading-relaxed">
      {parts.map((p, i) =>
        p.type === 'common' ? (
          <span key={i}>{p.text}</span>
        ) : p.type === 'added' ? (
          <span key={i} className="bg-green-900/60 text-green-300 rounded-sm px-0.5">{p.text}</span>
        ) : (
          <span key={i} className="bg-red-900/60 text-red-300 line-through rounded-sm px-0.5">{p.text}</span>
        )
      )}
    </span>
  )
}

// ─── Script comparison ────────────────────────────────────────────────────────

const NARRATIVE_KEYS = ['hook', 'problem', 'shift', 'proof', 'payoff', 'cta'] as const

function ScriptCompare({ a, b }: { a: DbScript; b: DbScript }) {
  const sections = [
    { key: 'full_script', label: 'Full Script', aVal: a.full_script ?? '', bVal: b.full_script ?? '' },
    { key: 'voiceover_script', label: 'Voiceover', aVal: a.voiceover_script ?? '', bVal: b.voiceover_script ?? '' },
    { key: 'cta_script', label: 'CTA', aVal: a.cta_script ?? '', bVal: b.cta_script ?? '' },
    ...NARRATIVE_KEYS.map((k) => ({
      key: `ns_${k}`,
      label: k.charAt(0).toUpperCase() + k.slice(1),
      aVal: a.narrative_structure[k] ?? '',
      bVal: b.narrative_structure[k] ?? '',
    })),
  ]

  return (
    <div className="space-y-4">
      {sections.map((sec) => (
        <div key={sec.key}>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
            {sec.label}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 rounded p-2.5 text-xs text-zinc-400 leading-relaxed">
              {sec.aVal || <span className="text-zinc-600 italic">Empty</span>}
            </div>
            <div className="bg-zinc-900 rounded p-2.5 text-xs leading-relaxed">
              <DiffText a={sec.aVal} b={sec.bVal} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Storyboard comparison ────────────────────────────────────────────────────

type SceneStatus = 'common' | 'added' | 'removed' | 'changed'

function storyboardDiff(
  aScenes: DbStoryboardScene[],
  bScenes: DbStoryboardScene[]
): Array<{ aScene: DbStoryboardScene | null; bScene: DbStoryboardScene | null; status: SceneStatus }> {
  const result: Array<{ aScene: DbStoryboardScene | null; bScene: DbStoryboardScene | null; status: SceneStatus }> = []
  const aByIndex = new Map(aScenes.map((s) => [s.scene_index, s]))
  const bByIndex = new Map(bScenes.map((s) => [s.scene_index, s]))
  const allIndexes = new Set([...aScenes.map((s) => s.scene_index), ...bScenes.map((s) => s.scene_index)])

  for (const idx of Array.from(allIndexes).sort((a, b) => a - b)) {
    const aScene = aByIndex.get(idx) ?? null
    const bScene = bByIndex.get(idx) ?? null
    let status: SceneStatus = 'common'
    if (!aScene) status = 'added'
    else if (!bScene) status = 'removed'
    else if (
      aScene.visual_instruction !== bScene.visual_instruction ||
      aScene.voiceover_line !== bScene.voiceover_line ||
      aScene.on_screen_text !== bScene.on_screen_text
    ) status = 'changed'
    result.push({ aScene, bScene, status })
  }
  return result
}

const SCENE_STATUS_STYLES: Record<SceneStatus, string> = {
  common:  'border-zinc-800',
  added:   'border-green-800 bg-green-950/30',
  removed: 'border-red-800 bg-red-950/30',
  changed: 'border-amber-800 bg-amber-950/20',
}

function SceneBlock({ scene, status }: { scene: DbStoryboardScene | null; status: SceneStatus }) {
  if (!scene) {
    return (
      <div className={`rounded border p-2.5 flex items-center justify-center ${SCENE_STATUS_STYLES[status]}`}>
        {status === 'removed'
          ? <Minus className="w-4 h-4 text-red-500" />
          : <Plus className="w-4 h-4 text-green-500" />}
      </div>
    )
  }
  return (
    <div className={`rounded border p-2.5 space-y-1 ${SCENE_STATUS_STYLES[status]}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-zinc-500">Scene {scene.scene_index + 1}</span>
        <span className="text-xs text-zinc-600">{scene.scene_type.replace(/_/g, ' ')}</span>
      </div>
      {scene.visual_instruction && (
        <p className="text-xs text-zinc-400 leading-snug">{scene.visual_instruction}</p>
      )}
      {scene.voiceover_line && (
        <p className="text-xs text-zinc-600 italic leading-snug">{scene.voiceover_line}</p>
      )}
    </div>
  )
}

function StoryboardCompare({
  aId,
  bId,
}: {
  aId: string
  bId: string
}) {
  const [aScenes, setAScenes] = useState<DbStoryboardScene[]>([])
  const [bScenes, setBScenes] = useState<DbStoryboardScene[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getStoryboardWithScenes(aId), getStoryboardWithScenes(bId)])
      .then(([a, b]) => {
        setAScenes(a.storyboard_scenes)
        setBScenes(b.storyboard_scenes)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [aId, bId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 bg-zinc-800 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  const diff = storyboardDiff(aScenes, bScenes)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 mb-1">
        <p className="text-xs text-zinc-500 font-medium">Version A</p>
        <p className="text-xs text-zinc-500 font-medium">Version B</p>
      </div>
      {diff.map(({ aScene, bScene, status }, i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          <SceneBlock scene={aScene} status={status === 'added' ? 'removed' : status} />
          <SceneBlock scene={bScene} status={status === 'removed' ? 'added' : status} />
        </div>
      ))}
      {diff.length === 0 && (
        <p className="text-xs text-zinc-600 text-center py-8">No scenes to compare</p>
      )}
    </div>
  )
}

// ─── Main VersionCompare component ───────────────────────────────────────────

type CompareType = 'script' | 'storyboard'

interface Props {
  projectId: string
  onBack: () => void
}

export function VersionCompare({ projectId, onBack }: Props) {
  const [compareType, setCompareType] = useState<CompareType>('script')
  const [versionAId, setVersionAId] = useState<string>('')
  const [versionBId, setVersionBId] = useState<string>('')
  const [storyboardVersions, setStoryboardVersions] = useState<DbStoryboardVersion[]>([])

  const { data: scripts } = useScripts(projectId)

  useEffect(() => {
    getStoryboardVersions(projectId)
      .then(setStoryboardVersions)
      .catch(console.error)
  }, [projectId])

  // Reset selections when type changes
  useEffect(() => {
    setVersionAId('')
    setVersionBId('')
  }, [compareType])

  const scriptOptions = scripts ?? []
  const sbOptions = storyboardVersions

  const scriptA = scriptOptions.find((s) => s.id === versionAId) ?? null
  const scriptB = scriptOptions.find((s) => s.id === versionBId) ?? null
  const canCompare = Boolean(versionAId && versionBId && versionAId !== versionBId)

  function versionLabel(item: DbScript | DbStoryboardVersion) {
    return `v${item.version_number} - ${item.title}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to history
        </button>
        <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Compare Versions
        </p>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-zinc-800 space-y-2.5 shrink-0">
        {/* Type selector */}
        <div className="flex gap-1.5">
          {(['script', 'storyboard'] as CompareType[]).map((t) => (
            <button
              key={t}
              onClick={() => setCompareType(t)}
              className={`text-xs px-3 py-1 rounded border transition-colors capitalize ${
                compareType === t
                  ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Version selectors */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-zinc-600 mb-1">Version A</p>
            <Select value={versionAId || 'none'} onValueChange={(v) => setVersionAId(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="none" className="text-zinc-500 text-xs focus:bg-zinc-800">Select...</SelectItem>
                {(compareType === 'script' ? scriptOptions : sbOptions).map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                    disabled={item.id === versionBId}
                    className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    {versionLabel(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-zinc-600 mb-1">Version B</p>
            <Select value={versionBId || 'none'} onValueChange={(v) => setVersionBId(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="none" className="text-zinc-500 text-xs focus:bg-zinc-800">Select...</SelectItem>
                {(compareType === 'script' ? scriptOptions : sbOptions).map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                    disabled={item.id === versionAId}
                    className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    {versionLabel(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Comparison body */}
      <div className="flex-1 overflow-y-auto p-4">
        {!canCompare ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs text-zinc-600">
              Select two different versions to compare
            </p>
          </div>
        ) : compareType === 'script' && scriptA && scriptB ? (
          <ScriptCompare a={scriptA} b={scriptB} />
        ) : compareType === 'storyboard' ? (
          <StoryboardCompare aId={versionAId} bId={versionBId} />
        ) : null}
      </div>
    </div>
  )
}
