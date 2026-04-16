import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useStoryDirections } from '@/hooks/useStoryDirections'
import { useHooks } from '@/hooks/useHooks'
import { useScripts } from '@/hooks/useScripts'
import { useCaptions } from '@/hooks/useCaptions'
import { useProductBrief } from '@/hooks/useProductBrief'
import type { UpdateScriptData } from '@/services/scripts'
import {
  generateStoryDirections,
  generateHooks,
  generateScript,
  generateStoryboard,
  generateCaptions,
} from '@/services/generation'
import { StoryArcHealth } from '@/components/generation/StoryArcHealth'
import { StoryDirections } from '@/components/generation/StoryDirections'
import { HooksPanel } from '@/components/generation/HooksPanel'
import { ScriptEditor } from '@/components/generation/ScriptEditor'
import { StoryboardEditor } from '@/components/storyboard/StoryboardEditor'
import { CaptionsPanel } from '@/components/generation/CaptionsPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { value: 'directions', label: 'Story Directions' },
  { value: 'hooks', label: 'Hooks' },
  { value: 'script', label: 'Script' },
  { value: 'storyboard', label: 'Storyboard' },
  { value: 'captions', label: 'Captions' },
]

interface Props {
  projectId: string
  onSelectedScriptChange?: (id: string | null) => void
  onActiveStoryboardVersionChange?: (id: string | null) => void
}

export function CenterPanel({ projectId, onSelectedScriptChange, onActiveStoryboardVersionChange }: Props) {
  const [activeStoryboardVersionId, setActiveStoryboardVersionId] = useState<string | null>(null)
  const [anyGenerating, setAnyGenerating] = useState(false)

  // Data hooks
  const { data: directions, loading: dirLoading, select: selectDirection, refetch: refetchDirections } = useStoryDirections(projectId)
  const selectedDirection = directions?.find((d) => d.selected) ?? null

  const { data: hooks, loading: hookLoading, select: selectHook, refetch: refetchHooks } = useHooks(selectedDirection?.id)
  const selectedHook = hooks?.find((h) => h.selected) ?? null

  const { data: scripts, loading: scriptLoading, select: selectScript, update: updateScript, refetch: refetchScripts } = useScripts(projectId)
  const selectedScript = scripts?.find((s) => s.selected) ?? null

  const { data: captionVersions, loading: captionLoading, save: saveCaptions, refetch: refetchCaptions } = useCaptions(projectId)

  const { data: latestBrief } = useProductBrief(projectId)
  const hasBrief = Boolean(latestBrief)

  const narrativeStructure = selectedScript?.narrative_structure ?? null

  // Notify parent when selected script changes
  useEffect(() => {
    onSelectedScriptChange?.(selectedScript?.id ?? null)
  }, [selectedScript?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStoryboardVersionChange(id: string | null) {
    setActiveStoryboardVersionId(id)
    onActiveStoryboardVersionChange?.(id)
  }

  async function handleUpdateScript(id: string, fields: UpdateScriptData) {
    await updateScript(id, fields)
  }

  // ── Generation handlers ────────────────────────────────────────────────────

  async function handleGenerateDirections() {
    if (!latestBrief) {
      toast.error('Generate a product brief first (in the left panel)')
      return
    }
    setAnyGenerating(true)
    try {
      await generateStoryDirections(projectId, latestBrief.id)
      refetchDirections()
      toast.success('Story directions generated!')
    } catch (e) {
      toast.error('Failed to generate directions: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleGenerateHooks() {
    if (!selectedDirection) {
      toast.error('Select a story direction first')
      return
    }
    setAnyGenerating(true)
    try {
      await generateHooks(projectId, selectedDirection.id)
      refetchHooks()
      toast.success('Hooks generated!')
    } catch (e) {
      toast.error('Failed to generate hooks: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleGenerateScript() {
    if (!selectedDirection) {
      toast.error('Select a story direction first')
      return
    }
    if (!selectedHook) {
      toast.error('Select a hook first')
      return
    }
    setAnyGenerating(true)
    try {
      await generateScript(projectId, selectedDirection.id, selectedHook.id)
      refetchScripts()
      toast.success('Script generated!')
    } catch (e) {
      toast.error('Failed to generate script: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleGenerateStoryboard() {
    if (!selectedScript) {
      toast.error('Select a script first')
      return
    }
    setAnyGenerating(true)
    try {
      await generateStoryboard(projectId, selectedScript.id)
      toast.success('Storyboard generated!')
      // StoryboardEditor calls setVersionsTick after onGenerate resolves
    } catch (e) {
      toast.error('Failed to generate storyboard: ' + (e as Error).message)
      throw e // re-throw so StoryboardEditor skips its refetch tick
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleGenerateCaptions() {
    if (!selectedScript) {
      toast.error('Select a script first')
      return
    }
    if (!activeStoryboardVersionId) {
      toast.error('Activate a storyboard version first')
      return
    }
    setAnyGenerating(true)
    try {
      await generateCaptions(projectId, selectedScript.id, activeStoryboardVersionId)
      refetchCaptions()
      toast.success('Captions generated!')
    } catch (e) {
      toast.error('Failed to generate captions: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Story arc health -- shown above tabs */}
      <StoryArcHealth narrativeStructure={narrativeStructure} />

      <Tabs defaultValue="directions" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="shrink-0 w-full rounded-none bg-zinc-950 border-b border-zinc-800 h-10 px-4 gap-0 justify-start">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-300 data-[state=active]:text-zinc-100 data-[state=inactive]:text-zinc-500 data-[state=inactive]:hover:text-zinc-300 bg-transparent px-3 h-full"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="directions" className="h-full mt-0 overflow-hidden">
            <StoryDirections
              directions={directions}
              loading={dirLoading}
              hasBrief={hasBrief}
              generatingLock={anyGenerating}
              onSelect={selectDirection}
              onGenerate={handleGenerateDirections}
            />
          </TabsContent>

          <TabsContent value="hooks" className="h-full mt-0 overflow-hidden">
            <HooksPanel
              hooks={hooks}
              loading={hookLoading}
              selectedDirectionId={selectedDirection?.id}
              generatingLock={anyGenerating}
              onSelect={selectHook}
              onGenerate={handleGenerateHooks}
            />
          </TabsContent>

          <TabsContent value="script" className="h-full mt-0 overflow-hidden">
            <ScriptEditor
              scripts={scripts}
              loading={scriptLoading}
              hasSelectedHook={Boolean(selectedHook)}
              generatingLock={anyGenerating}
              onSelectScript={selectScript}
              onUpdateScript={handleUpdateScript}
              onGenerate={handleGenerateScript}
            />
          </TabsContent>

          <TabsContent value="storyboard" className="h-full mt-0 overflow-hidden">
            <StoryboardEditor
              projectId={projectId}
              selectedScriptId={selectedScript?.id ?? null}
              generatingLock={anyGenerating}
              onGenerate={handleGenerateStoryboard}
              onVersionChange={handleStoryboardVersionChange}
            />
          </TabsContent>

          <TabsContent value="captions" className="h-full mt-0 overflow-hidden">
            <CaptionsPanel
              versions={captionVersions}
              loading={captionLoading}
              selectedScriptId={selectedScript?.id ?? null}
              selectedStoryboardVersionId={activeStoryboardVersionId}
              generatingLock={anyGenerating}
              onSave={saveCaptions}
              onGenerate={handleGenerateCaptions}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
