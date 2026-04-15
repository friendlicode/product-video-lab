import { useState, useEffect, useCallback } from 'react'
import type { DbProductBrief } from '@/types/db'
import {
  getProductBriefs,
  getLatestBrief,
  saveBrief,
  type SaveBriefData,
} from '@/services/briefs'

export function useProductBrief(projectId: string | undefined) {
  const [data, setData] = useState<DbProductBrief | null>(null)
  const [allVersions, setAllVersions] = useState<DbProductBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    Promise.all([getLatestBrief(projectId), getProductBriefs(projectId)])
      .then(([latest, all]) => {
        if (!cancelled) {
          setData(latest)
          setAllVersions(all)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, tick])

  const save = useCallback(
    async (briefData: SaveBriefData) => {
      if (!projectId) throw new Error('No project ID')
      const brief = await saveBrief(projectId, briefData)
      refetch()
      return brief
    },
    [projectId, refetch]
  )

  return { data, allVersions, loading, error, refetch, save }
}
