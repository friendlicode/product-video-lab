import { supabase } from '@/lib/supabase'
import type { DbScript } from '@/types/db'

export type SaveScriptData = Omit<
  DbScript,
  'id' | 'project_id' | 'created_at' | 'selected' | 'version_number' | 'voice_id' | 'audio_url'
>
export type UpdateScriptData = Partial<Pick<DbScript,
  'title' | 'full_script' | 'voiceover_script' | 'cta_script' |
  'narrative_structure' | 'duration_target_seconds' | 'selected_hook_id'
>>

export async function getScripts(projectId: string): Promise<DbScript[]> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getScript(id: string): Promise<DbScript> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function selectScript(id: string): Promise<void> {
  const { data: script, error: fetchErr } = await supabase
    .from('scripts')
    .select('project_id')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  const { error: deselectErr } = await supabase
    .from('scripts')
    .update({ selected: false })
    .eq('project_id', script.project_id)
  if (deselectErr) throw deselectErr

  const { error: selectErr } = await supabase
    .from('scripts')
    .update({ selected: true })
    .eq('id', id)
  if (selectErr) throw selectErr

  await supabase
    .from('projects')
    .update({ status: 'storyboarding' })
    .eq('id', script.project_id)
    .in('status', ['scripting', 'story_selection', 'briefing'])
}

export async function saveScript(
  projectId: string,
  data: SaveScriptData
): Promise<DbScript> {
  // Auto-increment version within the same story_direction
  const { count } = await supabase
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('story_direction_id', data.story_direction_id)

  const { data: script, error } = await supabase
    .from('scripts')
    .insert({ ...data, project_id: projectId, selected: false, version_number: (count ?? 0) + 1 })
    .select()
    .single()

  if (error) throw error
  return script
}

export async function updateScript(id: string, data: UpdateScriptData): Promise<DbScript> {
  const { data: script, error } = await supabase
    .from('scripts')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return script
}
