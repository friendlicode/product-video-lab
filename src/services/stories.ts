import { supabase } from '@/lib/supabase'
import type { DbStoryDirection } from '@/types/db'

export type SaveStoryDirectionData = Omit<
  DbStoryDirection,
  'id' | 'project_id' | 'created_at' | 'selected'
>

export async function getStoryDirections(projectId: string): Promise<DbStoryDirection[]> {
  const { data, error } = await supabase
    .from('story_directions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function selectStoryDirection(id: string): Promise<void> {
  const { data: direction, error: fetchErr } = await supabase
    .from('story_directions')
    .select('project_id')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  const { error: deselectErr } = await supabase
    .from('story_directions')
    .update({ selected: false })
    .eq('project_id', direction.project_id)
  if (deselectErr) throw deselectErr

  const { error: selectErr } = await supabase
    .from('story_directions')
    .update({ selected: true })
    .eq('id', id)
  if (selectErr) throw selectErr

  await supabase
    .from('projects')
    .update({ status: 'scripting' })
    .eq('id', direction.project_id)
    .in('status', ['briefing', 'story_selection'])
}

export async function saveStoryDirections(
  projectId: string,
  directions: SaveStoryDirectionData[]
): Promise<DbStoryDirection[]> {
  // Deselect all existing directions so the new batch becomes the active set.
  // We don't delete old versions — they live on in VersionHistory — but we
  // clear the selection flag so the UI switches to the fresh generation.
  await supabase
    .from('story_directions')
    .update({ selected: false })
    .eq('project_id', projectId)

  const { data, error } = await supabase
    .from('story_directions')
    .insert(directions.map((d) => ({ ...d, project_id: projectId, selected: false })))
    .select()

  if (error) throw error

  const result = data ?? []

  // Auto-select the first new direction so the hooks panel immediately
  // re-fetches for the new direction ID.
  if (result.length > 0) {
    await supabase
      .from('story_directions')
      .update({ selected: true })
      .eq('id', result[0].id)
    result[0] = { ...result[0], selected: true }
  }

  await supabase
    .from('projects')
    .update({ status: 'story_selection' })
    .eq('id', projectId)
    .eq('status', 'briefing')

  return result
}
