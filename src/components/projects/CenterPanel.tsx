import { useState } from 'react'
import { useStoryDirections } from '@/hooks/useStoryDirections'
import { useHooks } from '@/hooks/useHooks'
import { useScripts } from '@/hooks/useScripts'
import { useCaptions } from '@/hooks/useCaptions'
import { useProductBrief } from '@/hooks/useProductBrief'
import type { UpdateScriptData } from '@/services/scripts'
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

function placeholder(label: string) {
  return async () => {
    console.log(`generation not yet implemented: ${label}`)
  }
}

interface Props {
  projectId: string
}

export function CenterPanel({ projectId }: Props) {
  const [activeStoryboardVersionId, setActiveStoryboardVersionId] = useState<string | null>(null)

  // Data hooks
  const { data: directions, loading: dirLoading, select: selectDirection } = useStoryDirections(projectId)
  const selectedDirection = directions?.find((d) => d.selected) ?? null

  const { data: hooks, loading: hookLoading, select: selectHook } = useHooks(selectedDirection?.id)
  const selectedHook = hooks?.find((h) => h.selected) ?? null

  const { data: scripts, loading: scriptLoading, select: selectScript, update: updateScript } = useScripts(projectId)
  const selectedScript = scripts?.find((s) => s.selected) ?? null

  const { data: captionVersions, loading: captionLoading, save: saveCaptions } = useCaptions(projectId)

  const { data: latestBrief } = useProductBrief(projectId)
  const hasBrief = Boolean(latestBrief)

  // Narrative structure for StoryArcHealth -- prefer storyboard scenes (handled inside StoryboardEditor)
  // At the panel level, show script coverage when not on Storyboard tab
  const narrativeStructure = selectedScript?.narrative_structure ?? null

  async function handleUpdateScript(id: string, fields: UpdateScriptData) {
    await updateScript(id, fields)
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
              onSelect={selectDirection}
              onGenerate={placeholder('story directions')}
            />
          </TabsContent>

          <TabsContent value="hooks" className="h-full mt-0 overflow-hidden">
            <HooksPanel
              hooks={hooks}
              loading={hookLoading}
              selectedDirectionId={selectedDirection?.id}
              onSelect={selectHook}
              onGenerate={placeholder('hooks')}
            />
          </TabsContent>

          <TabsContent value="script" className="h-full mt-0 overflow-hidden">
            <ScriptEditor
              scripts={scripts}
              loading={scriptLoading}
              hasSelectedHook={Boolean(selectedHook)}
              onSelectScript={selectScript}
              onUpdateScript={handleUpdateScript}
              onGenerate={placeholder('script')}
            />
          </TabsContent>

          <TabsContent value="storyboard" className="h-full mt-0 overflow-hidden">
            <StoryboardEditor
              projectId={projectId}
              selectedScriptId={selectedScript?.id ?? null}
              onGenerate={placeholder('storyboard')}
              onVersionChange={setActiveStoryboardVersionId}
            />
          </TabsContent>

          <TabsContent value="captions" className="h-full mt-0 overflow-hidden">
            <CaptionsPanel
              versions={captionVersions}
              loading={captionLoading}
              selectedScriptId={selectedScript?.id ?? null}
              selectedStoryboardVersionId={activeStoryboardVersionId}
              onSave={saveCaptions}
              onGenerate={placeholder('captions')}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
