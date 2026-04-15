import { useState, useEffect, useCallback } from 'react'
import type { ApprovalStatus } from '@/types/index'
import type { DbApproval } from '@/types/db'
import { getApprovals, createApproval, updateApproval } from '@/services/approvals'

export function useApprovals(projectId: string | undefined) {
  const [data, setData] = useState<DbApproval[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!projectId) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    getApprovals(projectId)
      .then((result) => {
        if (!cancelled) { setData(result); setError(null) }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [projectId, tick])

  const create = useCallback(
    async (versionType: string, versionId: string, reviewerId: string) => {
      if (!projectId) throw new Error('No project ID')
      const approval = await createApproval(projectId, versionType, versionId, reviewerId)
      refetch()
      return approval
    },
    [projectId, refetch]
  )

  const update = useCallback(
    async (id: string, status: ApprovalStatus, notes?: string) => {
      const approval = await updateApproval(id, status, notes)
      refetch()
      return approval
    },
    [refetch]
  )

  return { data, loading, error, refetch, create, update }
}
