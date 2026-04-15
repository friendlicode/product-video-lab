import { useState, useEffect, useCallback } from 'react'
import type { DbActivityLog } from '@/types/db'
import { getActivityLog, logActivity } from '@/services/activity'

export function useActivityLog(projectId: string | undefined, limit = 50) {
  const [data, setData] = useState<DbActivityLog[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getActivityLog(projectId, limit)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, limit, tick])

  const log = useCallback(
    async (
      userId: string | null,
      actionType: string,
      entityType?: string,
      entityId?: string,
      metadata?: Record<string, unknown>
    ) => {
      if (!projectId) return
      await logActivity(projectId, userId, actionType, entityType, entityId, metadata)
      refetch()
    },
    [projectId, refetch]
  )

  return { data, loading, error, refetch, log }
}
