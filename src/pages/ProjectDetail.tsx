import { useParams, useNavigate } from 'react-router-dom'
import { Copy, Archive, ArchiveRestore, ArrowLeft } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { useProjects } from '@/hooks/useProjects'
import { LeftPanel } from '@/components/projects/LeftPanel'
import { CenterPanel } from '@/components/projects/CenterPanel'
import { STATUS_CONFIG } from '@/lib/projectConstants'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

function ProjectHeader({
  project,
  onDuplicate,
  onArchive,
  onUnarchive,
  busy,
}: {
  project: NonNullable<ReturnType<typeof useProject>['data']>
  onDuplicate: () => void
  onArchive: () => void
  onUnarchive: () => void
  busy: boolean
}) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[project.status]
  const isArchived = project.status === 'archived'

  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800 shrink-0">
      <button
        onClick={() => navigate('/')}
        className="text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-semibold text-zinc-100 truncate">
            {project.product_name}
          </h1>
          <span
            className={`shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${status.classes}`}
          >
            {status.label}
          </span>
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{project.internal_name}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          disabled={busy}
          className="text-zinc-400 hover:text-zinc-100 gap-1.5"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </Button>

        {isArchived ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnarchive}
            disabled={busy}
            className="text-zinc-400 hover:text-zinc-100 gap-1.5"
          >
            <ArchiveRestore className="w-3.5 h-3.5" />
            Unarchive
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onArchive}
            disabled={busy}
            className="text-zinc-400 hover:text-amber-400 gap-1.5"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive
          </Button>
        )}
      </div>
    </header>
  )
}

function LoadingShell() {
  return (
    <div className="flex flex-col h-screen bg-zinc-900">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800">
        <Skeleton className="w-4 h-4 bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48 bg-zinc-800" />
          <Skeleton className="h-3 w-32 bg-zinc-800" />
        </div>
        <Skeleton className="h-8 w-24 bg-zinc-800" />
        <Skeleton className="h-8 w-24 bg-zinc-800" />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-zinc-800 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-zinc-800" />
          ))}
        </div>
        <div className="flex-1" />
        <div className="w-90 border-l border-zinc-800" />
      </div>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <p className="text-4xl font-semibold text-zinc-700 mb-3">404</p>
      <p className="text-zinc-400 font-medium">Project not found</p>
      <p className="text-zinc-600 text-sm mt-1">
        This project may have been deleted or you may not have access.
      </p>
      <Button
        onClick={() => navigate('/')}
        className="mt-6 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
      >
        Back to Projects
      </Button>
    </div>
  )
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, loading, error, refetch } = useProject(id)
  const { duplicate, archive, unarchive } = useProjects()

  async function handleDuplicate() {
    if (!id) return
    const newProject = await duplicate(id)
    navigate(`/projects/${newProject.id}`)
  }

  async function handleArchive() {
    if (!id) return
    await archive(id)
    refetch()
  }

  async function handleUnarchive() {
    if (!id) return
    await unarchive(id)
    refetch()
  }

  if (loading) return <LoadingShell />
  if (error || !project) return <NotFound />

  return (
    <div className="flex flex-col h-screen bg-zinc-900">
      <ProjectHeader
        project={project}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        busy={false}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-80 shrink-0 border-r border-zinc-800 overflow-y-auto">
          <LeftPanel projectId={id!} project={project} onProjectUpdate={refetch} />
        </div>

        {/* Center panel */}
        <div className="flex-1 overflow-hidden">
          <CenterPanel projectId={id!} />
        </div>

        {/* Right panel */}
        <div className="w-[360px] shrink-0 border-l border-zinc-800 overflow-y-auto flex items-center justify-center">
          <p className="text-zinc-700 text-sm">Activity + approvals -- coming in Phase 6</p>
        </div>
      </div>
    </div>
  )
}
