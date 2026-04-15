import { useState, useEffect, useCallback } from 'react'
import type { DbStoryDirection } from '@/types/db'
import {
  getStoryDirections,
  selectStoryDirection,
  saveStoryDirections,
  type SaveStoryDirectionData,
} from '@/services/stories'

export function useStoryDirections(projectId: string | undefined) {
  const [data, setData] = useState<DbStoryDirection[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getStoryDirections(projectId)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, tick])

  const select = useCallback(
    async (id: string) => { await selectStoryDirection(id); refetch() },
    [refetch]
  )

  const save = useCallback(
    async (directions: SaveStoryDirectionData[]) => {
      if (!projectId) throw new Error('No project ID')
      const result = await saveStoryDirections(projectId, directions)
      refetch()
      return result
    },
    [projectId, refetch]
  )

  return { data, loading, error, refetch, select, save }
}
