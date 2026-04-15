import { supabase } from '@/lib/supabase'
import type { ProjectStatus, TargetPlatform, TonePreset } from '@/types/index'
import type { DbProject, DbProjectWithCounts } from '@/types/db'
import { logActivity } from './activity'

export type ProjectFilters = {
  status?: ProjectStatus
  search?: string
  includeArchived?: boolean
}

export type CreateProjectData = {
  internal_name: string
  product_name: string
  product_description?: string
  target_audience?: string
  target_platform?: TargetPlatform
  desired_outcome?: string
  tone_preset?: TonePreset
  cta?: string
}

export type UpdateProjectData = Partial<CreateProjectData & { status: ProjectStatus }>

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

export async function getProjects(filters?: ProjectFilters): Promise<DbProject[]> {
  let query = supabase.from('projects').select('*')

  if (!filters?.includeArchived) {
    query = query.is('archived_at', null)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `internal_name.ilike.%${filters.search}%,product_name.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query.order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getProject(id: string): Promise<DbProjectWithCounts> {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `*,
      asset_count:project_assets(count),
      brief_count:product_briefs(count),
      direction_count:story_directions(count),
      script_count:scripts(count),
      render_job_count:render_jobs(count)`
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DbProjectWithCounts
}

export async function createProject(data: CreateProjectData): Promise<DbProject> {
  const userId = await getCurrentUserId()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, created_by: userId, status: 'draft' })
    .select()
    .single()

  if (error) throw error

  await logActivity(project.id, userId, 'project.created', 'project', project.id, {
    initial_status: 'draft',
  })

  return project
}

export async function updateProject(id: string, data: UpdateProjectData): Promise<DbProject> {
  const { data: project, error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return project
}

export async function archiveProject(id: string): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString(), status: 'archived' })
    .eq('id', id)

  if (error) throw error
  await logActivity(id, userId, 'project.archived', 'project', id)
}

export async function unarchiveProject(id: string): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('projects')
    .update({ archived_at: null, status: 'draft' })
    .eq('id', id)

  if (error) throw error
  await logActivity(id, userId, 'project.unarchived', 'project', id)
}

export async function duplicateProject(id: string): Promise<DbProject> {
  const userId = await getCurrentUserId()

  const { data: original, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (projErr) throw projErr

  const { data: newProject, error: createErr } = await supabase
    .from('projects')
    .insert({
      internal_name: `${original.internal_name} (Copy)`,
      product_name: original.product_name,
      product_description: original.product_description,
      target_audience: original.target_audience,
      target_platform: original.target_platform,
      desired_outcome: original.desired_outcome,
      tone_preset: original.tone_preset,
      cta: original.cta,
      status: 'draft' as ProjectStatus,
      created_by: userId,
    })
    .select()
    .single()
  if (createErr) throw createErr

  const newId = newProject.id

  // briefs
  const { data: briefs } = await supabase
    .from('product_briefs')
    .select('*')
    .eq('project_id', id)
  if (briefs?.length) {
    await supabase.from('product_briefs').insert(
      briefs.map(({ id: _id, created_at: _ca, ...rest }) => ({ ...rest, project_id: newId }))
    )
  }

  // story_directions
  const { data: directions } = await supabase
    .from('story_directions')
    .select('*')
    .eq('project_id', id)
  const dirMap = new Map<string, string>()
  for (const { id: oldId, created_at: _ca, ...rest } of directions ?? []) {
    const { data: nd, error: e } = await supabase
      .from('story_directions')
      .insert({ ...rest, project_id: newId })
      .select('id')
      .single()
    if (e) throw e
    dirMap.set(oldId, nd.id)
  }

  // hooks
  const { data: hooks } = await supabase.from('hooks').select('*').eq('project_id', id)
  const hookMap = new Map<string, string>()
  for (const { id: oldId, created_at: _ca, ...rest } of hooks ?? []) {
    const { data: nh, error: e } = await supabase
      .from('hooks')
      .insert({
        ...rest,
        project_id: newId,
        story_direction_id: dirMap.get(rest.story_direction_id) ?? rest.story_direction_id,
      })
      .select('id')
      .single()
    if (e) throw e
    hookMap.set(oldId, nh.id)
  }

  // scripts
  const { data: scripts } = await supabase.from('scripts').select('*').eq('project_id', id)
  const scriptMap = new Map<string, string>()
  for (const { id: oldId, created_at: _ca, ...rest } of scripts ?? []) {
    const { data: ns, error: e } = await supabase
      .from('scripts')
      .insert({
        ...rest,
        project_id: newId,
        story_direction_id: dirMap.get(rest.story_direction_id) ?? rest.story_direction_id,
        selected_hook_id: rest.selected_hook_id
          ? (hookMap.get(rest.selected_hook_id) ?? rest.selected_hook_id)
          : null,
      })
      .select('id')
      .single()
    if (e) throw e
    scriptMap.set(oldId, ns.id)
  }

  // storyboard_versions
  const { data: sbVersions } = await supabase
    .from('storyboard_versions')
    .select('*')
    .eq('project_id', id)
  const sbvMap = new Map<string, string>()
  for (const { id: oldId, created_at: _ca, ...rest } of sbVersions ?? []) {
    const { data: nv, error: e } = await supabase
      .from('storyboard_versions')
      .insert({
        ...rest,
        project_id: newId,
        script_id: scriptMap.get(rest.script_id) ?? rest.script_id,
      })
      .select('id')
      .single()
    if (e) throw e
    sbvMap.set(oldId, nv.id)
  }

  // storyboard_scenes
  for (const [oldVid, newVid] of sbvMap) {
    const { data: scenes } = await supabase
      .from('storyboard_scenes')
      .select('*')
      .eq('storyboard_version_id', oldVid)
    if (scenes?.length) {
      const { error: e } = await supabase.from('storyboard_scenes').insert(
        scenes.map(({ id: _id, created_at: _ca, updated_at: _ua, ...rest }) => ({
          ...rest,
          storyboard_version_id: newVid,
        }))
      )
      if (e) throw e
    }
  }

  // caption_versions
  const { data: captions } = await supabase
    .from('caption_versions')
    .select('*')
    .eq('project_id', id)
  if (captions?.length) {
    const { error: e } = await supabase.from('caption_versions').insert(
      captions.map(({ id: _id, created_at: _ca, ...rest }) => ({
        ...rest,
        project_id: newId,
        script_id: scriptMap.get(rest.script_id) ?? rest.script_id,
        storyboard_version_id:
          sbvMap.get(rest.storyboard_version_id) ?? rest.storyboard_version_id,
      }))
    )
    if (e) throw e
  }

  await logActivity(newId, userId, 'project.duplicated', 'project', newId, {
    source_project_id: id,
  })

  return newProject
}
