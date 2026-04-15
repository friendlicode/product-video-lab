import { supabase } from '@/lib/supabase'
import type { ApprovalStatus } from '@/types/index'
import type { DbApproval } from '@/types/db'

export async function getApprovals(projectId: string): Promise<DbApproval[]> {
  const { data, error } = await supabase
    .from('approvals')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createApproval(
  projectId: string,
  versionType: string,
  versionId: string,
  reviewerId: string
): Promise<DbApproval> {
  const { data, error } = await supabase
    .from('approvals')
    .insert({
      project_id: projectId,
      version_type: versionType,
      version_id: versionId,
      status: 'pending' as ApprovalStatus,
      reviewer_id: reviewerId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateApproval(
  id: string,
  status: ApprovalStatus,
  notes?: string
): Promise<DbApproval> {
  const { data, error } = await supabase
    .from('approvals')
    .update({ status, notes: notes ?? null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Advance project status when approved
  if (status === 'approved') {
    await supabase
      .from('projects')
      .update({ status: 'approved' })
      .eq('id', data.project_id)
      .eq('status', 'review')
  }

  return data
}
