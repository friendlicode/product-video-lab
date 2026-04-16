import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RenderPanel } from '@/components/render/RenderPanel'
import { ApprovalPanel } from './ApprovalPanel'
import { VersionHistory } from './VersionHistory'
import { ActivityTimeline } from './ActivityTimeline'

interface Props {
  projectId: string
  selectedScriptId: string | null
  activeStoryboardVersionId: string | null
}

const TABS = [
  { value: 'render',    label: 'Render' },
  { value: 'approvals', label: 'Approvals' },
  { value: 'history',   label: 'History' },
  { value: 'activity',  label: 'Activity' },
]

export function RightPanel({ projectId, selectedScriptId, activeStoryboardVersionId }: Props) {
  return (
    <Tabs defaultValue="render" className="flex flex-col h-full">
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
        <TabsContent value="render" className="h-full mt-0 overflow-hidden">
          <RenderPanel
            projectId={projectId}
            selectedScriptId={selectedScriptId}
            selectedStoryboardVersionId={activeStoryboardVersionId}
          />
        </TabsContent>

        <TabsContent value="approvals" className="h-full mt-0 overflow-hidden">
          <ApprovalPanel
            projectId={projectId}
            selectedScriptId={selectedScriptId}
            selectedStoryboardVersionId={activeStoryboardVersionId}
          />
        </TabsContent>

        <TabsContent value="history" className="h-full mt-0 overflow-hidden">
          <VersionHistory projectId={projectId} />
        </TabsContent>

        <TabsContent value="activity" className="h-full mt-0 overflow-hidden">
          <ActivityTimeline projectId={projectId} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
