import { useState, useEffect, useCallback } from 'react'
import type { DbHook } from '@/types/db'
import {
  getHooks,
  selectHook,
  saveHooks,
  type SaveHookData,
} from '@/services/hooks'

export function useHooks(storyDirectionId: string | undefined) {
  const [data, setData] = useState<DbHook[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!storyDirectionId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getHooks(storyDirectionId)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [storyDirectionId, tick])

  const select = useCallback(
    async (id: string) => { await selectHook(id); refetch() },
    [refetch]
  )

  const save = useCallback(
    async (projectId: string, hooks: SaveHookData[]) => {
      if (!storyDirectionId) throw new Error('No story direction ID')
      const result = await saveHooks(projectId, storyDirectionId, hooks)
      refetch()
      return result
    },
    [storyDirectionId, refetch]
  )

  return { data, loading, error, refetch, select, save }
}
