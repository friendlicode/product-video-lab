import { supabase } from '@/lib/supabase'
import type { DbStoryboardVersion, DbStoryboardScene, DbStoryboardVersionWithScenes } from '@/types/db'

export type SaveStoryboardData = Omit<DbStoryboardVersion, 'id' | 'project_id' | 'script_id' | 'created_at' | 'selected' | 'version_number'>
export type SaveSceneData = Omit<DbStoryboardScene, 'id' | 'storyboard_version_id' | 'created_at' | 'updated_at'>
export type UpdateSceneData = Partial<Omit<DbStoryboardScene, 'id' | 'storyboard_version_id' | 'created_at' | 'updated_at'>>

export async function getStoryboardVersions(projectId: string): Promise<DbStoryboardVersion[]> {
  const { data, error } = await supabase
    .from('storyboard_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getStoryboardWithScenes(
  storyboardVersionId: string
): Promise<DbStoryboardVersionWithScenes> {
  const { data, error } = await supabase
    .from('storyboard_versions')
    .select('*, storyboard_scenes(*)')
    .eq('id', storyboardVersionId)
    .single()

  if (error) throw error

  const result = data as DbStoryboardVersionWithScenes
  result.storyboard_scenes = result.storyboard_scenes.sort(
    (a, b) => a.scene_index - b.scene_index
  )
  return result
}

export async function selectStoryboard(id: string): Promise<void> {
  const { data: sb, error: fetchErr } = await supabase
    .from('storyboard_versions')
    .select('project_id')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  const { error: deselectErr } = await supabase
    .from('storyboard_versions')
    .update({ selected: false })
    .eq('project_id', sb.project_id)
  if (deselectErr) throw deselectErr

  const { error: selectErr } = await supabase
    .from('storyboard_versions')
    .update({ selected: true })
    .eq('id', id)
  if (selectErr) throw selectErr

  await supabase
    .from('projects')
    .update({ status: 'render_ready' })
    .eq('id', sb.project_id)
    .in('status', ['storyboarding', 'scripting'])
}

export async function saveStoryboard(
  projectId: string,
  scriptId: string,
  data: SaveStoryboardData,
  scenes: SaveSceneData[]
): Promise<DbStoryboardVersionWithScenes> {
  const { count } = await supabase
    .from('storyboard_versions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('script_id', scriptId)

  const { data: sbv, error: sbvErr } = await supabase
    .from('storyboard_versions')
    .insert({
      ...data,
      project_id: projectId,
      script_id: scriptId,
      selected: false,
      version_number: (count ?? 0) + 1,
    })
    .select()
    .single()
  if (sbvErr) throw sbvErr

  const { data: insertedScenes, error: scenesErr } = await supabase
    .from('storyboard_scenes')
    .insert(
      scenes.map((s) => ({ ...s, storyboard_version_id: sbv.id }))
    )
    .select()

  if (scenesErr) throw scenesErr

  return {
    ...sbv,
    storyboard_scenes: (insertedScenes ?? []).sort((a, b) => a.scene_index - b.scene_index),
  }
}

export async function updateScene(
  sceneId: string,
  data: UpdateSceneData
): Promise<DbStoryboardScene> {
  const { data: scene, error } = await supabase
    .from('storyboard_scenes')
    .update(data)
    .eq('id', sceneId)
    .select()
    .single()

  if (error) throw error
  return scene
}

export async function reorderScenes(
  storyboardVersionId: string,
  orderedSceneIds: string[]
): Promise<void> {
  await Promise.all(
    orderedSceneIds.map((id, index) =>
      supabase
        .from('storyboard_scenes')
        .update({ scene_index: index })
        .eq('id', id)
        .eq('storyboard_version_id', storyboardVersionId)
        .then(({ error }) => {
          if (error) throw error
        })
    )
  )
}

export async function deleteScene(sceneId: string): Promise<void> {
  const { error } = await supabase.from('storyboard_scenes').delete().eq('id', sceneId)
  if (error) throw error
}

export async function duplicateScene(sceneId: string): Promise<DbStoryboardScene> {
  const { data: original, error: fetchErr } = await supabase
    .from('storyboard_scenes')
    .select('*')
    .eq('id', sceneId)
    .single()
  if (fetchErr) throw fetchErr

  const insertIndex = original.scene_index + 1

  // Shift all scenes at or after insertIndex up by 1
  const { data: allScenes, error: allErr } = await supabase
    .from('storyboard_scenes')
    .select('id, scene_index')
    .eq('storyboard_version_id', original.storyboard_version_id)
    .gte('scene_index', insertIndex)
  if (allErr) throw allErr

  await Promise.all(
    (allScenes ?? []).map((s) =>
      supabase
        .from('storyboard_scenes')
        .update({ scene_index: s.scene_index + 1 })
        .eq('id', s.id)
        .then(({ error }) => {
          if (error) throw error
        })
    )
  )

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original
  const { data: newScene, error: insertErr } = await supabase
    .from('storyboard_scenes')
    .insert({ ...rest, scene_index: insertIndex })
    .select()
    .single()
  if (insertErr) throw insertErr

  return newScene
}
