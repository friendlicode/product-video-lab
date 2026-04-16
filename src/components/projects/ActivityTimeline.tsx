import {
  FileText,
  Layers,
  Zap,
  Film,
  Mic,
  Video,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Star,
  BookOpen,
  Package,
  Clock,
  ImageIcon,
} from 'lucide-react'
import { useActivityLog } from '@/hooks/useActivityLog'
import { relativeTime } from '@/lib/time'
import type { DbActivityLog } from '@/types/db'

type ActionConfig = {
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  generated_brief:           { label: 'Generated product brief',     Icon: FileText },
  generated_stories:         { label: 'Generated story directions',  Icon: Layers },
  generated_hooks:           { label: 'Generated hooks',             Icon: Zap },
  generated_script:          { label: 'Generated script',            Icon: BookOpen },
  generated_storyboard:      { label: 'Generated storyboard',        Icon: Film },
  generated_captions:        { label: 'Generated captions',          Icon: Mic },
  assembled_render_payload:  { label: 'Assembled render payload',    Icon: Package },
  selected_direction:        { label: 'Selected story direction',    Icon: Star },
  selected_hook:             { label: 'Selected hook',               Icon: Star },
  selected_script:           { label: 'Selected script',             Icon: Star },
  created_render_job:        { label: 'Created render job',          Icon: Video },
  approval_requested:        { label: 'Requested approval',          Icon: CheckCircle2 },
  approval_approved:         { label: 'Approved',                    Icon: CheckCircle2 },
  approval_rejected:         { label: 'Rejected',                    Icon: XCircle },
  approval_revision:         { label: 'Revision requested',          Icon: RotateCcw },
  uploaded_asset:            { label: 'Uploaded asset',              Icon: ImageIcon },
}

function ActivityItem({ entry }: { entry: DbActivityLog }) {
  const config = ACTION_CONFIG[entry.action_type] ?? {
    label: entry.action_type.replace(/_/g, ' '),
    Icon: Clock,
  }
  const { Icon, label } = config

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-zinc-800/60 last:border-0">
      <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
        <Icon className="w-2.5 h-2.5 text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-300 leading-snug">{label}</p>
        {entry.entity_type && (
          <p className="text-xs text-zinc-600 mt-0.5 capitalize">
            {entry.entity_type.replace(/_/g, ' ')}
          </p>
        )}
      </div>
      <span className="text-xs text-zinc-600 shrink-0 mt-0.5">
        {relativeTime(entry.created_at)}
      </span>
    </div>
  )
}

export function ActivityTimeline({ projectId }: { projectId: string }) {
  const { data, loading } = useActivityLog(projectId, 50)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Activity</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {loading ? (
          <div className="space-y-3 pt-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2.5 py-2">
                <div className="w-5 h-5 rounded-full bg-zinc-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="w-7 h-7 text-zinc-700 mb-2" strokeWidth={1.25} />
            <p className="text-xs text-zinc-600">No activity yet</p>
          </div>
        ) : (
          <div>
            {data.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
