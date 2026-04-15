import { useState, useEffect, useCallback } from 'react'
import type { CaptionSegment } from '@/types/index'
import type { DbCaptionVersion } from '@/types/db'
import { getCaptionVersions, saveCaptions } from '@/services/captions'

export function useCaptions(projectId: string | undefined) {
  const [data, setData] = useState<DbCaptionVersion[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getCaptionVersions(projectId)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, tick])

  const save = useCallback(
    async (scriptId: string, storyboardVersionId: string, segments: CaptionSegment[]) => {
      if (!projectId) throw new Error('No project ID')
      const version = await saveCaptions(projectId, scriptId, storyboardVersionId, segments)
      refetch()
      return version
    },
    [projectId, refetch]
  )

  return { data, loading, error, refetch, save }
}
