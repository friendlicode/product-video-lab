import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, RefreshCw, Layers } from 'lucide-react'
import { getRenderJobsWithProject, type DbRenderJobWithProject } from '@/services/rendering'
import { relativeTime } from '@/lib/time'
import type { RenderStatus } from '@/types/index'

const STATUS_CONFIG: Record<RenderStatus, { label: string; classes: string; animated?: boolean }> = {
  draft:      { label: 'Draft',      classes: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  queued:     { label: 'Queued',     classes: 'bg-blue-950 text-blue-300 border-blue-800' },
  processing: { label: 'Processing', classes: 'bg-amber-950 text-amber-300 border-amber-800', animated: true },
  completed:  { label: 'Completed',  classes: 'bg-green-950 text-green-300 border-green-800' },
  failed:     { label: 'Failed',     classes: 'bg-red-950 text-red-300 border-red-800' },
  canceled:   { label: 'Canceled',   classes: 'bg-zinc-800 text-zinc-500 border-zinc-700' },
}

const ALL_STATUSES: RenderStatus[] = ['queued', 'processing', 'completed', 'failed', 'canceled', 'draft']

function StatusBadge({ status }: { status: RenderStatus }) {
  const { label, classes, animated } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded border ${classes} ${animated ? 'animate-pulse' : ''}`}>
      {label}
    </span>
  )
}

function ProgressBar({ progress }: { progress: number | null }) {
  if (progress == null) return null
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-xs text-zinc-500">{progress}%</span>
    </div>
  )
}

export function RenderQueue() {
  const [jobs, setJobs] = useState<DbRenderJobWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<RenderStatus | 'all'>('all')
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const loadJobs = useCallback(async () => {
    try {
      const data = await getRenderJobsWithProject()
      setJobs(data)
      setError(null)
      setLastRefreshed(new Date())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 30_000)
    return () => clearInterval(interval)
  }, [loadJobs])

  const filtered = statusFilter === 'all'
    ? jobs
    : jobs.filter((j) => j.status === statusFilter)

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Render Queue</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            All render jobs across all projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            Updated {relativeTime(lastRefreshed.toISOString())}
          </span>
          <button
            onClick={loadJobs}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            statusFilter === 'all'
              ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
              : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          All ({jobs.length})
        </button>
        {ALL_STATUSES.map((s) => {
          const count = jobs.filter((j) => j.status === s).length
          if (count === 0) return null
          const { label } = STATUS_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="w-10 h-10 text-zinc-700 mb-3" strokeWidth={1.25} />
          <p className="text-zinc-500 font-medium">No render jobs yet</p>
          <p className="text-zinc-600 text-sm mt-1">
            Render jobs will appear here once you create them from a project.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-800/60">
              <tr>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Project</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Provider</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Progress</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Output</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Created</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Started</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    {job.project ? (
                      <Link
                        to={`/projects/${job.project.id}`}
                        className="text-zinc-300 hover:text-zinc-100 transition-colors"
                      >
                        {job.project.product_name}
                        <span className="block text-zinc-600">{job.project.internal_name}</span>
                      </Link>
                    ) : (
                      <span className="text-zinc-600">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                    {job.error_message && (
                      <p className="text-red-400 mt-1 max-w-48 truncate" title={job.error_message}>
                        {job.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{job.provider}</td>
                  <td className="px-4 py-3">
                    {job.status === 'processing' ? (
                      <ProgressBar progress={job.progress} />
                    ) : job.status === 'completed' ? (
                      <span className="text-zinc-600">100%</span>
                    ) : (
                      <span className="text-zinc-700">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {job.output_url ? (
                      <a
                        href={job.output_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                    ) : (
                      <span className="text-zinc-700">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{relativeTime(job.created_at)}</td>
                  <td className="px-4 py-3 text-zinc-500">{relativeTime(job.started_at) || '-'}</td>
                  <td className="px-4 py-3 text-zinc-500">{relativeTime(job.completed_at) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
