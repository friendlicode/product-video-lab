import { useState, useEffect, useCallback } from 'react'
import type { DbScript } from '@/types/db'
import {
  getScripts,
  getScript,
  selectScript,
  saveScript,
  updateScript,
  type SaveScriptData,
  type UpdateScriptData,
} from '@/services/scripts'

export function useScripts(projectId: string | undefined) {
  const [data, setData] = useState<DbScript[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getScripts(projectId)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, tick])

  const fetch = useCallback((id: string) => getScript(id), [])

  const select = useCallback(
    async (id: string) => { await selectScript(id); refetch() },
    [refetch]
  )

  const save = useCallback(
    async (scriptData: SaveScriptData) => {
      if (!projectId) throw new Error('No project ID')
      const script = await saveScript(projectId, scriptData)
      refetch()
      return script
    },
    [projectId, refetch]
  )

  const update = useCallback(
    async (id: string, fields: UpdateScriptData) => {
      const script = await updateScript(id, fields)
      refetch()
      return script
    },
    [refetch]
  )

  return { data, loading, error, refetch, fetch, select, save, update }
}
