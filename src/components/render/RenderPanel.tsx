import { useState, useCallback } from 'react'
import { Sparkles, Play, ChevronDown, ChevronRight, ExternalLink, RotateCcw, Layers, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useRenderJobs } from '@/hooks/useRenderJobs'
import { useScripts } from '@/hooks/useScripts'
import { assembleRenderPayload } from '@/services/generation'
import { validateStoryCompleteness, NARRATIVE_ROLES } from '@/lib/utils'
import { relativeTime } from '@/lib/time'
import type { DbRenderJob, DbRenderPayload } from '@/types/db'
import type { RenderStatus } from '@/types/index'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { MusicSelector } from '@/components/generation/MusicSelector'
import type { SavedMusicCue } from '@/services/music'

const STATUS_CONFIG: Record<
  RenderStatus,
  { label: string; classes: string; animated?: boolean }
> = {
  draft:      { label: 'Draft',      classes: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  queued:     { label: 'Queued',     classes: 'bg-blue-950 text-blue-300 border-blue-800' },
  processing: { label: 'Processing', classes: 'bg-amber-950 text-amber-300 border-amber-800', animated: true },
  completed:  { label: 'Completed',  classes: 'bg-green-950 text-green-300 border-green-800' },
  failed:     { label: 'Failed',     classes: 'bg-red-950 text-red-300 border-red-800' },
  canceled:   { label: 'Canceled',   classes: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
}

function JobCard({
  job,
  onSimulateComplete,
}: {
  job: DbRenderJob
  onSimulateComplete: (jobId: string) => Promise<void>
}) {
  const { label, classes, animated } = STATUS_CONFIG[job.status]
  const [simulating, setSimulating] = useState(false)

  async function handleSimulate() {
    setSimulating(true)
    try {
      await onSimulateComplete(job.id)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded border ${classes} ${animated ? 'animate-pulse' : ''}`}
          >
            {label}
          </span>
          <span className="text-xs text-zinc-600">{job.provider}</span>
        </div>
        <span className="text-xs text-zinc-600 shrink-0">{relativeTime(job.created_at)}</span>
      </div>

      {job.status === 'processing' && job.progress != null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>{job.progress}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {job.status === 'completed' && job.output_url && (
        <a
          href={job.output_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View output
        </a>
      )}

      {job.status === 'failed' && job.error_message && (
        <p className="text-xs text-red-400 leading-relaxed">{job.error_message}</p>
      )}

      {/* Dev-only: simulate completion to test the UI flow */}
      {(job.status === 'queued' || job.status === 'processing') && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSimulate}
          disabled={simulating}
          className="h-6 text-xs text-zinc-600 hover:text-zinc-400 gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          {simulating ? 'Simulating...' : 'Simulate Completion (dev)'}
        </Button>
      )}

      <div className="flex gap-3 text-xs text-zinc-700">
        {job.started_at && <span>Started {relativeTime(job.started_at)}</span>}
        {job.completed_at && <span>Completed {relativeTime(job.completed_at)}</span>}
      </div>
    </div>
  )
}

function PayloadViewer({ payload }: { payload: DbRenderPayload }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-zinc-500" />
          )}
          <span className="text-xs text-zinc-400">Render Payload</span>
        </div>
        <span className="text-xs text-zinc-600">{payload.aspect_ratio}</span>
      </button>

      {open && (
        <pre className="text-xs text-zinc-500 bg-zinc-950 px-3 pb-3 overflow-x-auto max-h-48 leading-relaxed">
          {JSON.stringify(payload.payload, null, 2)}
        </pre>
      )}
    </div>
  )
}

interface Props {
  projectId: string
  selectedScriptId: string | null
  selectedStoryboardVersionId: string | null
}

export function RenderPanel({ projectId, selectedScriptId, selectedStoryboardVersionId }: Props) {
  const { data: jobs, payloads, loading, refetch, createJob, updateStatus } = useRenderJobs(projectId)
  const { data: scripts } = useScripts(projectId)
  const [assembling, setAssembling] = useState(false)
  const [creatingJob, setCreatingJob] = useState(false)
  const [arcWarnOpen, setArcWarnOpen] = useState(false)
  const [_savedCue, setSavedCue] = useState<SavedMusicCue | null>(null)

  const handleCueSelected = useCallback((cue: SavedMusicCue | null) => {
    setSavedCue(cue)
  }, [])

  const latestPayload = payloads?.[0] ?? null
  const canAssemble = Boolean(selectedStoryboardVersionId && selectedScriptId)

  const selectedScript = scripts?.find((s) => s.selected) ?? null
  const validation = validateStoryCompleteness(selectedScript?.narrative_structure ?? null)
  const missingRoles = NARRATIVE_ROLES.filter((r) => !validation.coverage[r].present)

  async function doAssemble() {
    if (!selectedStoryboardVersionId || !selectedScriptId) return
    setAssembling(true)
    try {
      await assembleRenderPayload(projectId, selectedStoryboardVersionId, selectedScriptId)
      refetch()
      toast.success('Render payload assembled!')
    } catch (e) {
      toast.error('Failed to assemble payload: ' + (e as Error).message)
    } finally {
      setAssembling(false)
    }
  }

  function handleAssemble() {
    if (!selectedStoryboardVersionId || !selectedScriptId) return
    if (missingRoles.length > 0) {
      setArcWarnOpen(true)
    } else {
      void doAssemble()
    }
  }

  async function handleCreateJob() {
    if (!latestPayload) return
    setCreatingJob(true)
    try {
      await createJob(latestPayload.id)
      toast.success('Render job queued!')
    } catch (e) {
      toast.error('Failed to create render job: ' + (e as Error).message)
    } finally {
      setCreatingJob(false)
    }
  }

  async function handleSimulateComplete(jobId: string) {
    try {
      await updateStatus(jobId, 'completed', {
        output_url: `https://example.com/render/${jobId}.mp4`,
        progress: 100,
      })
      toast.success('Job marked completed (dev simulation)')
    } catch (e) {
      toast.error('Simulation failed: ' + (e as Error).message)
    }
  }

  return (
    <>
    <Dialog open={arcWarnOpen} onOpenChange={setArcWarnOpen}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Incomplete story arc
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            The following narrative roles are missing from the selected script:
          </DialogDescription>
        </DialogHeader>
        <ul className="text-xs text-amber-400 space-y-1 pl-1">
          {missingRoles.map((r) => (
            <li key={r} className="capitalize">• {r}</li>
          ))}
        </ul>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => setArcWarnOpen(false)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            Cancel
          </Button>
          <Button
            onClick={() => { setArcWarnOpen(false); void doAssemble() }}
            className="bg-amber-600 text-white hover:bg-amber-500"
          >
            Continue anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-zinc-800 space-y-2.5 shrink-0">
        <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Render</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAssemble}
            disabled={assembling || !canAssemble}
            title={!canAssemble ? 'Select a script and activate a storyboard version first' : undefined}
            className="flex-1 h-7 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-1.5 disabled:opacity-40"
          >
            <Sparkles className="w-3 h-3" />
            {assembling ? 'Assembling...' : 'Assemble Payload'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateJob}
            disabled={creatingJob || !latestPayload}
            title={!latestPayload ? 'Assemble a payload first' : undefined}
            className="flex-1 h-7 text-xs border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-1.5 disabled:opacity-40"
          >
            <Play className="w-3 h-3" />
            {creatingJob ? 'Queuing...' : 'Create Job'}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {latestPayload && <PayloadViewer payload={latestPayload} />}

            {/* Music selection — shown after payload is assembled */}
            {latestPayload && (() => {
              const vs = (latestPayload.payload as Record<string, unknown>)?.visual_strategy as Record<string, unknown> | null
              const pacing = vs?.pacing_curve as Array<{ energy_level?: number }> | undefined
              const avgEnergy = pacing?.length
                ? Math.round(pacing.reduce((s, p) => s + (p.energy_level ?? 5), 0) / pacing.length)
                : null
              const mood = (vs?.music_strategy as Record<string, string> | undefined)?.mood ?? null
              return (
                <div className="border border-zinc-800 rounded-xl p-4">
                  <MusicSelector
                    renderPayloadId={latestPayload.id}
                    energyLevel={avgEnergy}
                    mood={mood}
                    durationSeconds={
                      ((latestPayload.payload as Record<string, unknown>)?.scenes as Array<{ duration_seconds?: number }> | undefined)
                        ?.reduce((s, sc) => s + (sc.duration_seconds ?? 3), 0) ?? 30
                    }
                    onCueSelected={handleCueSelected}
                  />
                </div>
              )
            })()}

            {!jobs?.length && !latestPayload ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Layers className="w-7 h-7 text-zinc-700 mb-2" strokeWidth={1.25} />
                <p className="text-xs text-zinc-500 font-medium">No render jobs yet</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Assemble a payload, then create a render job
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs?.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSimulateComplete={handleSimulateComplete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  )
}
