import { useState } from 'react'
import { useParams, useNavigate, Outlet } from 'react-router-dom'
import { Copy, Archive, ArchiveRestore, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useProject } from '@/hooks/useProject'
import { useProjects } from '@/hooks/useProjects'
import { StageNav } from '@/components/projects/StageNav'
import { STATUS_CONFIG } from '@/lib/projectConstants'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

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
    <header className="flex items-center gap-4 px-6 py-3.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
      <button
        onClick={() => navigate('/')}
        className="text-zinc-500 hover:text-zinc-300 transition-colors"
        title="Back to projects"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-zinc-100 truncate">
            {project.product_name}
          </h1>
          <span
            className={`shrink-0 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${status.classes}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDuplicate}
          disabled={busy}
          className="h-8 text-xs text-zinc-400 hover:text-zinc-100 gap-1.5 px-3"
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
            className="h-8 text-xs text-zinc-400 hover:text-zinc-100 gap-1.5 px-3"
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
            className="h-8 text-xs text-zinc-400 hover:text-amber-400 gap-1.5 px-3"
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
    <div className="flex flex-col h-screen bg-zinc-950">
      <header className="flex items-center gap-4 px-6 py-3.5 border-b border-zinc-800">
        <Skeleton className="w-4 h-4 bg-zinc-800" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-40 bg-zinc-800" />
        </div>
        <Skeleton className="h-8 w-24 bg-zinc-800" />
      </header>
      {/* StageNav skeleton */}
      <div className="flex items-center justify-center gap-0 px-8 py-3 border-b border-zinc-800">
        <Skeleton className="h-8 w-64 bg-zinc-800 rounded-full" />
      </div>
      <div className="flex-1 p-8 space-y-4">
        <Skeleton className="h-32 w-full bg-zinc-800 rounded-xl" />
        <Skeleton className="h-48 w-full bg-zinc-800 rounded-xl" />
      </div>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-zinc-950">
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

  const [busy, setBusy] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  async function handleDuplicate() {
    if (!id) return
    setBusy(true)
    try {
      const newProject = await duplicate(id)
      toast.success('Project duplicated')
      navigate(`/projects/${newProject.id}`)
    } catch (e) {
      toast.error('Failed to duplicate: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleArchiveConfirm() {
    if (!id) return
    setArchiveOpen(false)
    setBusy(true)
    try {
      await archive(id)
      toast.success('Project archived')
      navigate('/')
    } catch (e) {
      toast.error('Failed to archive: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function handleUnarchive() {
    if (!id) return
    setBusy(true)
    try {
      await unarchive(id)
      refetch()
      toast.success('Project unarchived')
    } catch (e) {
      toast.error('Failed to unarchive: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingShell />
  if (error || !project) return <NotFound />

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <ProjectHeader
        project={project}
        onDuplicate={handleDuplicate}
        onArchive={() => setArchiveOpen(true)}
        onUnarchive={handleUnarchive}
        busy={busy}
      />

      <StageNav projectId={id!} />

      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Archive confirmation dialog */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Archive this project?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              It will be hidden from the main project list. You can unarchive it at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setArchiveOpen(false)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchiveConfirm}
              className="bg-amber-600 text-white hover:bg-amber-500"
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
