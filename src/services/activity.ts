import { supabase } from '@/lib/supabase'
import type { DbActivityLog } from '@/types/db'

export async function logActivity(
  projectId: string,
  userId: string | null,
  actionType: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    project_id: projectId,
    user_id: userId,
    action_type: actionType,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: metadata ?? {},
  })
  // Non-fatal -- log but do not throw so callers are not disrupted
  if (error) console.error('[activity] logActivity failed:', error.message)
}

export async function getActivityLog(
  projectId: string,
  limit = 50
): Promise<DbActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
