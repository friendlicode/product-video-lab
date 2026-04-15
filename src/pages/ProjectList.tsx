import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Archive, LayoutGrid } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useAuthContext } from '@/contexts/AuthContext'
import type { ProjectStatus, TargetPlatform, TonePreset } from '@/types/index'
import type { DbProject } from '@/types/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProjectStatus, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  briefing: { label: 'Briefing', classes: 'bg-blue-950 text-blue-300 border-blue-900' },
  story_selection: {
    label: 'Story',
    classes: 'bg-purple-950 text-purple-300 border-purple-900',
  },
  scripting: { label: 'Scripting', classes: 'bg-indigo-950 text-indigo-300 border-indigo-900' },
  storyboarding: { label: 'Storyboard', classes: 'bg-teal-950 text-teal-300 border-teal-900' },
  render_ready: {
    label: 'Render Ready',
    classes: 'bg-amber-950 text-amber-300 border-amber-900',
  },
  rendering: { label: 'Rendering', classes: 'bg-orange-950 text-orange-300 border-orange-900' },
  review: { label: 'Review', classes: 'bg-yellow-950 text-yellow-300 border-yellow-900' },
  approved: { label: 'Approved', classes: 'bg-green-950 text-green-300 border-green-900' },
  archived: { label: 'Archived', classes: 'bg-zinc-900 text-zinc-600 border-zinc-800' },
}

const PLATFORM_LABELS: Record<TargetPlatform, string> = {
  linkedin: 'LinkedIn',
  twitter_x: 'Twitter/X',
  youtube_short: 'YouTube Short',
  youtube_long: 'YouTube',
  instagram_reel: 'Instagram Reel',
  tiktok: 'TikTok',
  website: 'Website',
  pitch_deck: 'Pitch Deck',
  other: 'Other',
}

const TONE_LABELS: Record<TonePreset, string> = {
  bold: 'Bold',
  conversational: 'Conversational',
  professional: 'Professional',
  founder_raw: 'Founder Raw',
  hype: 'Hype',
  minimal: 'Minimal',
  storyteller: 'Storyteller',
}

const STATUS_OPTIONS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'briefing', label: 'Briefing' },
  { value: 'story_selection', label: 'Story' },
  { value: 'scripting', label: 'Scripting' },
  { value: 'storyboarding', label: 'Storyboard' },
  { value: 'render_ready', label: 'Render Ready' },
  { value: 'rendering', label: 'Rendering' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

// ─── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  currentUserId,
  currentUserName,
}: {
  project: DbProject
  currentUserId: string | null
  currentUserName: string | null
}) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[project.status]
  const isArchived = project.status === 'archived'

  const creatorLabel =
    project.created_by === currentUserId ? currentUserName ?? 'You' : null

  return (
    <Card
      onClick={() => navigate(`/projects/${project.id}`)}
      className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all cursor-pointer group ${
        isArchived ? 'opacity-60' : ''
      }`}
    >
      <CardContent className="p-5 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
              {project.product_name}
            </p>
            <p className="text-xs text-zinc-500 truncate mt-0.5">{project.internal_name}</p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${status.classes}`}
          >
            {status.label}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {project.target_platform && (
            <Badge
              variant="outline"
              className="text-xs text-zinc-400 border-zinc-700 bg-zinc-800/50 font-normal"
            >
              {PLATFORM_LABELS[project.target_platform]}
            </Badge>
          )}
          {project.tone_preset && (
            <Badge
              variant="outline"
              className="text-xs text-zinc-500 border-zinc-800 font-normal"
            >
              {TONE_LABELS[project.tone_preset]}
            </Badge>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between text-xs text-zinc-600 pt-1 border-t border-zinc-800">
          <span>{relativeTime(project.updated_at)}</span>
          {creatorLabel && <span>{creatorLabel}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
            <Skeleton className="h-3 w-1/2 bg-zinc-800" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-md bg-zinc-800" />
          <Skeleton className="h-5 w-16 rounded-md bg-zinc-800" />
        </div>
        <div className="flex justify-between pt-1 border-t border-zinc-800">
          <Skeleton className="h-3 w-12 bg-zinc-800" />
          <Skeleton className="h-3 w-16 bg-zinc-800" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function ProjectList() {
  const navigate = useNavigate()
  const { user, dbUser } = useAuthContext()

  // Always fetch with archived so we can toggle client-side
  const { data: allProjects, loading, error } = useProjects({ includeArchived: true })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)

  const projects = useMemo(() => {
    if (!allProjects) return []
    return allProjects.filter((p) => {
      if (!showArchived && p.status === 'archived') return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !p.product_name.toLowerCase().includes(q) &&
          !p.internal_name.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [allProjects, search, statusFilter, showArchived])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Projects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {loading ? '' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          onClick={() => navigate('/projects/new')}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}
        >
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {STATUS_OPTIONS.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={() => setShowArchived((v) => !v)}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors ${
            showArchived
              ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
              : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          Archived
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-md px-4 py-3 mb-6">
          Failed to load projects: {error.message}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState hasFilter={search !== '' || statusFilter !== 'all'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUserId={user?.id ?? null}
              currentUserName={dbUser?.name ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <LayoutGrid className="w-10 h-10 text-zinc-700 mb-4" strokeWidth={1.25} />
      {hasFilter ? (
        <>
          <p className="text-zinc-400 font-medium">No projects match your filters</p>
          <p className="text-zinc-600 text-sm mt-1">Try adjusting your search or filter</p>
        </>
      ) : (
        <>
          <p className="text-zinc-400 font-medium">No projects yet</p>
          <p className="text-zinc-600 text-sm mt-1">Create your first product video project</p>
          <Button
            onClick={() => navigate('/projects/new')}
            className="mt-5 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </>
      )}
    </div>
  )
}
