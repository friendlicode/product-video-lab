import { supabase } from '@/lib/supabase'
import type { DbHook } from '@/types/db'

export type SaveHookData = Omit<DbHook, 'id' | 'project_id' | 'story_direction_id' | 'created_at' | 'selected'>

export async function getHooks(storyDirectionId: string): Promise<DbHook[]> {
  const { data, error } = await supabase
    .from('hooks')
    .select('*')
    .eq('story_direction_id', storyDirectionId)
    .order('score', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function selectHook(id: string): Promise<void> {
  const { data: hook, error: fetchErr } = await supabase
    .from('hooks')
    .select('story_direction_id')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  const { error: deselectErr } = await supabase
    .from('hooks')
    .update({ selected: false })
    .eq('story_direction_id', hook.story_direction_id)
  if (deselectErr) throw deselectErr

  const { error: selectErr } = await supabase
    .from('hooks')
    .update({ selected: true })
    .eq('id', id)
  if (selectErr) throw selectErr
}

export async function saveHooks(
  projectId: string,
  storyDirectionId: string,
  hooks: SaveHookData[]
): Promise<DbHook[]> {
  // Remove old hooks for this direction before inserting the new batch.
  // Old hooks are stale once we regenerate — keeping them would leave a
  // previously-selected hook in place and prevent the script from refreshing.
  await supabase
    .from('hooks')
    .delete()
    .eq('story_direction_id', storyDirectionId)

  // Deselect any existing script for this project — it was based on old hooks
  // and is now stale. The user must regenerate the script after regenerating hooks.
  await supabase
    .from('scripts')
    .update({ selected: false })
    .eq('project_id', projectId)

  const { data, error } = await supabase
    .from('hooks')
    .insert(
      hooks.map((h) => ({
        ...h,
        project_id: projectId,
        story_direction_id: storyDirectionId,
        selected: false,
      }))
    )
    .select()

  if (error) throw error

  const result = data ?? []

  // Auto-select the highest-scored hook so the script section can immediately
  // proceed without requiring a manual click.
  if (result.length > 0) {
    const best = result.reduce((top, h) => ((h.score ?? 0) >= (top.score ?? 0) ? h : top), result[0])
    await supabase.from('hooks').update({ selected: true }).eq('id', best.id)
    result.forEach((h) => { h.selected = h.id === best.id })
  }

  return result
}
