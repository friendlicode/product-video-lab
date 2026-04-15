import { useState, useEffect, useCallback } from 'react'
import type { AssetType } from '@/types/index'
import type { DbProjectAsset } from '@/types/db'
import {
  getProjectAssets,
  uploadAsset,
  deleteAsset,
  updateAssetOrder,
} from '@/services/assets'

export function useProjectAssets(projectId: string | undefined) {
  const [data, setData] = useState<DbProjectAsset[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getProjectAssets(projectId)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, tick])

  const upload = useCallback(
    async (file: File, assetType: AssetType, label?: string) => {
      if (!projectId) throw new Error('No project ID')
      const asset = await uploadAsset(projectId, file, assetType, label)
      refetch()
      return asset
    },
    [projectId, refetch]
  )

  const remove = useCallback(
    async (id: string) => { await deleteAsset(id); refetch() },
    [refetch]
  )

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      if (!projectId) return
      await updateAssetOrder(projectId, orderedIds)
      refetch()
    },
    [projectId, refetch]
  )

  return { data, loading, error, refetch, upload, remove, reorder }
}
