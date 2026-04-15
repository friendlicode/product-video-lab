import { supabase } from '@/lib/supabase'
import type { DbProductBrief } from '@/types/db'

export type SaveBriefData = Omit<DbProductBrief, 'id' | 'project_id' | 'version_number' | 'created_at'>

export async function getProductBriefs(projectId: string): Promise<DbProductBrief[]> {
  const { data, error } = await supabase
    .from('product_briefs')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getLatestBrief(projectId: string): Promise<DbProductBrief | null> {
  const { data, error } = await supabase
    .from('product_briefs')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function saveBrief(
  projectId: string,
  data: SaveBriefData
): Promise<DbProductBrief> {
  const latest = await getLatestBrief(projectId)
  const nextVersion = (latest?.version_number ?? 0) + 1

  const { data: brief, error } = await supabase
    .from('product_briefs')
    .insert({ ...data, project_id: projectId, version_number: nextVersion })
    .select()
    .single()

  if (error) throw error

  // Advance project status from draft -> briefing
  await supabase
    .from('projects')
    .update({ status: 'briefing' })
    .eq('id', projectId)
    .eq('status', 'draft')

  return brief
}
