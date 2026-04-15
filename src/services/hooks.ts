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
  return data ?? []
}
