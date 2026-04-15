import { useState, useEffect, useCallback } from 'react'
import type { DbProjectWithCounts } from '@/types/db'
import {
  getProject,
  updateProject,
  type UpdateProjectData,
} from '@/services/projects'

export function useProject(id: string | undefined) {
  const [data, setData] = useState<DbProjectWithCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!id) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getProject(id)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id, tick])

  const update = useCallback(
    async (fields: UpdateProjectData) => {
      if (!id) return
      const project = await updateProject(id, fields)
      refetch()
      return project
    },
    [id, refetch]
  )

  return { data, loading, error, refetch, update }
}
