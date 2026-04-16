import { useState, useEffect } from 'react'
import { FileText, Layers, BookOpen, Film, History, GitCompare } from 'lucide-react'
import { useProductBrief } from '@/hooks/useProductBrief'
import { useStoryDirections } from '@/hooks/useStoryDirections'
import { useScripts } from '@/hooks/useScripts'
import { getStoryboardVersions } from '@/services/storyboards'
import { relativeTime } from '@/lib/time'
import { VersionCompare } from './VersionCompare'
import type { DbStoryboardVersion } from '@/types/db'

type EntryType = 'brief' | 'direction' | 'script' | 'storyboard'

type VersionEntry = {
  id: string
  type: EntryType
  label: string
  version: number
  generated_by: string
  created_at: string
  selected?: boolean
}

const TYPE_CONFIG: Record<EntryType, {
  Icon: React.ComponentType<{ className?: string }>
  color: string
  badge: string
}> = {
  brief:      { Icon: FileText,  color: 'text-blue-400',   badge: 'Brief' },
  direction:  { Icon: Layers,    color: 'text-purple-400', badge: 'Direction' },
  script:     { Icon: BookOpen,  color: 'text-indigo-400', badge: 'Script' },
  storyboard: { Icon: Film,      color: 'text-teal-400',   badge: 'Storyboard' },
}

export function VersionHistory({ projectId }: { projectId: string }) {
  const [comparing, setComparing] = useState(false)
  const { allVersions: briefs } = useProductBrief(projectId)
  const { data: directions } = useStoryDirections(projectId)
  const { data: scripts } = useScripts(projectId)
  const [storyboardVersions, setStoryboardVersions] = useState<DbStoryboardVersion[]>([])

  useEffect(() => {
    getStoryboardVersions(projectId)
      .then(setStoryboardVersions)
      .catch(console.error)
  }, [projectId])

  const entries: VersionEntry[] = [
    ...briefs.map((b) => ({
      id: b.id,
      type: 'brief' as const,
      label: 'Product Brief',
      version: b.version_number,
      generated_by: b.generated_by,
      created_at: b.created_at,
    })),
    ...(directions ?? []).map((d) => ({
      id: d.id,
      type: 'direction' as const,
      label: d.title,
      version: d.version_number,
      generated_by: d.generated_by,
      created_at: d.created_at,
      selected: d.selected,
    })),
    ...(scripts ?? []).map((s) => ({
      id: s.id,
      type: 'script' as const,
      label: s.title,
      version: s.version_number,
      generated_by: s.generated_by,
      created_at: s.created_at,
      selected: s.selected,
    })),
    ...storyboardVersions.map((v) => ({
      id: v.id,
      type: 'storyboard' as const,
      label: v.title,
      version: v.version_number,
      generated_by: v.generated_by,
      created_at: v.created_at,
      selected: v.selected,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (comparing) {
    return <VersionCompare projectId={projectId} onBack={() => setComparing(false)} />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0 flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Version History
        </p>
        <button
          onClick={() => setComparing(true)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <GitCompare className="w-3 h-3" />
          Compare
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="w-7 h-7 text-zinc-700 mb-2" strokeWidth={1.25} />
            <p className="text-xs text-zinc-600">No versions yet</p>
          </div>
        ) : (
          <div className="py-2">
            {entries.map((entry) => {
              const { Icon, color, badge } = TYPE_CONFIG[entry.type]
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-2.5 py-2.5 border-b border-zinc-800/60 last:border-0"
                >
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-zinc-300 truncate">{entry.label}</span>
                      {entry.selected && (
                        <span className="text-xs text-teal-400 shrink-0">active</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-zinc-600">{badge} v{entry.version}</span>
                      <span className="text-zinc-700 text-xs">·</span>
                      <span className="text-xs text-zinc-600">{entry.generated_by}</span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0 mt-0.5">
                    {relativeTime(entry.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
