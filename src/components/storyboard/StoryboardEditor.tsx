import { useState, useEffect } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { useStoryboard } from '@/hooks/useStoryboard'
import { useProjectAssets } from '@/hooks/useProjectAssets'
import { getStoryboardVersions, addScene } from '@/services/storyboards'
import type { DbStoryboardVersion } from '@/types/db'
import type { NarrativeRole } from '@/types/index'
import { StoryArcHealth } from '@/components/generation/StoryArcHealth'
import { SceneCard } from './SceneCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  projectId: string
  selectedScriptId: string | null
  generatingLock?: boolean
  onGenerate: () => Promise<void>
  onVersionChange?: (versionId: string | null) => void
}

export function StoryboardEditor({
  projectId,
  selectedScriptId,
  generatingLock,
  onGenerate,
  onVersionChange,
}: Props) {
  const [versions, setVersions] = useState<DbStoryboardVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [versionsLoading, setVersionsLoading] = useState(true)
  const [versionsTick, setVersionsTick] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [addingScene, setAddingScene] = useState(false)
  const [selecting, setSelecting] = useState(false)

  const {
    data: storyboard,
    loading: sceneLoading,
    updateScene,
    reorder,
    remove,
    duplicate,
    select: selectVersion,
  } = useStoryboard(selectedVersionId ?? undefined)

  const { data: assets } = useProjectAssets(projectId)

  // Fetch storyboard versions list
  useEffect(() => {
    setVersionsLoading(true)
    getStoryboardVersions(projectId)
      .then((v) => {
        setVersions(v)
        const active = v.find((ver) => ver.selected) ?? v[0] ?? null
        const newId = active?.id ?? null
        setSelectedVersionId(newId)
        onVersionChange?.(newId)
      })
      .catch(console.error)
      .finally(() => setVersionsLoading(false))
  }, [projectId, versionsTick]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleVersionChange(id: string) {
    setSelectedVersionId(id)
    onVersionChange?.(id)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      await onGenerate()
      setVersionsTick((t) => t + 1)
    } catch {
      // Error already surfaced via toast in the caller
    } finally {
      setGenerating(false)
    }
  }

  async function handleAddScene() {
    if (!selectedVersionId) return
    setAddingScene(true)
    try {
      const scenes = storyboard?.storyboard_scenes ?? []
      const afterIndex = scenes.length > 0
        ? Math.max(...scenes.map((s) => s.scene_index))
        : -1
      await addScene(selectedVersionId, afterIndex)
      setVersionsTick((t) => t + 1)
    } catch (e) {
      console.error(e)
    } finally {
      setAddingScene(false)
    }
  }

  async function handleSelectActive() {
    if (!selectedVersionId) return
    setSelecting(true)
    try {
      await selectVersion(selectedVersionId)
      setVersionsTick((t) => t + 1)
    } finally {
      setSelecting(false)
    }
  }

  function handleMoveUp(sceneId: string) {
    const scenes = storyboard?.storyboard_scenes ?? []
    const idx = scenes.findIndex((s) => s.id === sceneId)
    if (idx <= 0) return
    const ordered = [...scenes]
    ;[ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]]
    reorder(ordered.map((s) => s.id)).catch(console.error)
  }

  function handleMoveDown(sceneId: string) {
    const scenes = storyboard?.storyboard_scenes ?? []
    const idx = scenes.findIndex((s) => s.id === sceneId)
    if (idx < 0 || idx >= scenes.length - 1) return
    const ordered = [...scenes]
    ;[ordered[idx], ordered[idx + 1]] = [ordered[idx + 1], ordered[idx]]
    reorder(ordered.map((s) => s.id)).catch(console.error)
  }

  const scenes = storyboard?.storyboard_scenes ?? []
  const selectedVersion = versions.find((v) => v.id === selectedVersionId)
  const isActive = selectedVersion?.selected ?? false

  return (
    <div className="flex flex-col h-full">
      {/* Mini arc health */}
      {scenes.length > 0 && (
        <StoryArcHealth
          narrativeStructure={null}
          scenes={scenes as Array<{ narrative_role: NarrativeRole }>}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        {versionsLoading ? (
          <div className="h-7 w-40 bg-zinc-800 rounded animate-pulse" />
        ) : versions.length > 0 ? (
          <Select
            value={selectedVersionId ?? ''}
            onValueChange={handleVersionChange}
          >
            <SelectTrigger className="h-7 w-44 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {versions.map((v) => (
                <SelectItem
                  key={v.id}
                  value={v.id}
                  className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
                >
                  v{v.version_number} {v.title}
                  {v.selected ? ' (active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-zinc-600">No storyboard versions</span>
        )}

        <div className="flex-1" />

        {selectedVersionId && !isActive && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSelectActive}
            disabled={selecting}
            className="h-7 text-xs text-teal-400 hover:text-teal-300"
          >
            {selecting ? 'Setting...' : 'Set Active'}
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating || generatingLock || !selectedScriptId}
          title={!selectedScriptId ? 'Select a script first' : undefined}
          className="h-7 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-1.5 disabled:opacity-40"
        >
          <Sparkles className="w-3 h-3" />
          {generating ? 'Building storyboard...' : 'Generate Storyboard'}
        </Button>
      </div>

      {/* Scene list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sceneLoading || versionsLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !selectedVersionId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-zinc-700 mb-3" strokeWidth={1.25} />
            <p className="text-zinc-500 text-sm font-medium">No storyboard yet</p>
            <p className="text-zinc-600 text-xs mt-1">
              {selectedScriptId
                ? 'Generate a storyboard from your script'
                : 'Select a script first, then generate a storyboard'}
            </p>
          </div>
        ) : scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-zinc-500 text-sm font-medium">No scenes yet</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddScene}
              disabled={addingScene}
              className="mt-3 h-7 text-xs text-zinc-400 hover:text-zinc-100 gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Add First Scene
            </Button>
          </div>
        ) : (
          <>
            {scenes.map((scene, i) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                assets={assets ?? []}
                isFirst={i === 0}
                isLast={i === scenes.length - 1}
                onUpdate={updateScene}
                onDelete={async (id) => { await remove(id) }}
                onDuplicate={async (id) => { await duplicate(id) }}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))}

            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddScene}
              disabled={addingScene}
              className="w-full h-8 text-xs text-zinc-600 hover:text-zinc-300 border border-dashed border-zinc-800 hover:border-zinc-700 gap-1.5"
            >
              <Plus className="w-3 h-3" />
              {addingScene ? 'Adding...' : 'Add Scene'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
