import { useState, useEffect, useCallback } from 'react'
import type { RenderStatus } from '@/types/index'
import type { DbRenderJob, DbRenderPayload } from '@/types/db'
import {
  getRenderJobs,
  getRenderPayloads,
  createRenderPayload,
  createRenderJob,
  updateRenderJobStatus,
} from '@/services/rendering'

export function useRenderJobs(projectId?: string) {
  const [data, setData] = useState<DbRenderJob[] | null>(null)
  const [payloads, setPayloads] = useState<DbRenderPayload[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const fetches: Promise<unknown>[] = [getRenderJobs(projectId)]
    if (projectId) fetches.push(getRenderPayloads(projectId))

    Promise.all(fetches)
      .then(([jobs, pl]) => {
        if (!cancelled) {
          setData(jobs as DbRenderJob[])
          if (pl) setPayloads(pl as DbRenderPayload[])
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, tick])

  const createPayload = useCallback(
    async (
      pid: string,
      storyboardVersionId: string,
      scriptId: string,
      payload: Record<string, unknown>,
      options?: { aspectRatio?: string; stylePreset?: string }
    ) => {
      const result = await createRenderPayload(pid, storyboardVersionId, scriptId, payload, options)
      refetch()
      return result
    },
    [refetch]
  )

  const createJob = useCallback(
    async (renderPayloadId: string) => {
      const job = await createRenderJob(renderPayloadId)
      refetch()
      return job
    },
    [refetch]
  )

  const updateStatus = useCallback(
    async (
      jobId: string,
      status: RenderStatus,
      extraFields?: {
        progress?: number
        output_url?: string
        thumbnail_url?: string
        error_message?: string
      }
    ) => {
      const job = await updateRenderJobStatus(jobId, status, extraFields)
      refetch()
      return job
    },
    [refetch]
  )

  return { data, payloads, loading, error, refetch, createPayload, createJob, updateStatus }
}
