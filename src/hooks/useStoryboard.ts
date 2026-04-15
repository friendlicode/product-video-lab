import { useState, useEffect, useCallback } from 'react'
import type { DbStoryboardVersionWithScenes } from '@/types/db'
import {
  getStoryboardWithScenes,
  selectStoryboard,
  saveStoryboard,
  updateScene,
  reorderScenes,
  deleteScene,
  duplicateScene,
  type SaveStoryboardData,
  type SaveSceneData,
  type UpdateSceneData,
} from '@/services/storyboards'

export function useStoryboard(storyboardVersionId: string | undefined) {
  const [data, setData] = useState<DbStoryboardVersionWithScenes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!storyboardVersionId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getStoryboardWithScenes(storyboardVersionId)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [storyboardVersionId, tick])

  const select = useCallback(
    async (id: string) => { await selectStoryboard(id); refetch() },
    [refetch]
  )

  const save = useCallback(
    async (
      projectId: string,
      scriptId: string,
      sbData: SaveStoryboardData,
      scenes: SaveSceneData[]
    ) => {
      const result = await saveStoryboard(projectId, scriptId, sbData, scenes)
      refetch()
      return result
    },
    [refetch]
  )

  const updateSceneData = useCallback(
    async (sceneId: string, fields: UpdateSceneData) => {
      const scene = await updateScene(sceneId, fields)
      refetch()
      return scene
    },
    [refetch]
  )

  const reorder = useCallback(
    async (orderedSceneIds: string[]) => {
      if (!storyboardVersionId) return
      await reorderScenes(storyboardVersionId, orderedSceneIds)
      refetch()
    },
    [storyboardVersionId, refetch]
  )

  const remove = useCallback(
    async (sceneId: string) => { await deleteScene(sceneId); refetch() },
    [refetch]
  )

  const duplicate = useCallback(
    async (sceneId: string) => {
      const scene = await duplicateScene(sceneId)
      refetch()
      return scene
    },
    [refetch]
  )

  return { data, loading, error, refetch, select, save, updateScene: updateSceneData, reorder, remove, duplicate }
}
