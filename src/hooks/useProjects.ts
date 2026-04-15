import { useState, useEffect, useCallback } from 'react'
import type { DbProject } from '@/types/db'
import {
  getProjects,
  createProject,
  archiveProject,
  unarchiveProject,
  duplicateProject,
  type ProjectFilters,
  type CreateProjectData,
} from '@/services/projects'

export function useProjects(filters?: ProjectFilters) {
  const [data, setData] = useState<DbProject[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getProjects(filters)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [tick]) // eslint-disable-line react-hooks/exhaustive-deps

  const create = useCallback(
    async (input: CreateProjectData) => {
      const project = await createProject(input)
      refetch()
      return project
    },
    [refetch]
  )

  const archive = useCallback(
    async (id: string) => { await archiveProject(id); refetch() },
    [refetch]
  )

  const unarchive = useCallback(
    async (id: string) => { await unarchiveProject(id); refetch() },
    [refetch]
  )

  const duplicate = useCallback(
    async (id: string) => {
      const project = await duplicateProject(id)
      refetch()
      return project
    },
    [refetch]
  )

  return { data, loading, error, refetch, create, archive, unarchive, duplicate }
}
