import { supabase } from '@/lib/supabase'
import type { RenderStatus } from '@/types/index'
import type { DbRenderPayload, DbRenderJob } from '@/types/db'

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

export async function createRenderPayload(
  projectId: string,
  storyboardVersionId: string,
  scriptId: string,
  payload: Record<string, unknown>,
  options?: { aspectRatio?: string; stylePreset?: string }
): Promise<DbRenderPayload> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('render_payloads')
    .insert({
      project_id: projectId,
      storyboard_version_id: storyboardVersionId,
      script_id: scriptId,
      payload,
      aspect_ratio: options?.aspectRatio ?? '9:16',
      style_preset: options?.stylePreset ?? null,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getRenderPayloads(projectId: string): Promise<DbRenderPayload[]> {
  const { data, error } = await supabase
    .from('render_payloads')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createRenderJob(
  renderPayloadId: string,
  createdBy?: string
): Promise<DbRenderJob> {
  const userId = createdBy ?? (await getCurrentUserId())

  // Resolve the project_id from the payload
  const { data: payload, error: payloadErr } = await supabase
    .from('render_payloads')
    .select('project_id')
    .eq('id', renderPayloadId)
    .single()
  if (payloadErr) throw payloadErr

  const { data, error } = await supabase
    .from('render_jobs')
    .insert({
      project_id: payload.project_id,
      render_payload_id: renderPayloadId,
      provider: 'remotion',
      status: 'queued' as RenderStatus,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  // Advance project status
  await supabase
    .from('projects')
    .update({ status: 'rendering' })
    .eq('id', payload.project_id)
    .in('status', ['render_ready', 'storyboarding'])

  return data
}

export async function getRenderJobs(projectId?: string): Promise<DbRenderJob[]> {
  let query = supabase
    .from('render_jobs')
    .select('*')
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function updateRenderJobStatus(
  jobId: string,
  status: RenderStatus,
  extraFields?: {
    progress?: number
    output_url?: string
    thumbnail_url?: string
    error_message?: string
    started_at?: string
    completed_at?: string
  }
): Promise<DbRenderJob> {
  const update: Record<string, unknown> = { status, ...extraFields }

  if (status === 'processing' && !extraFields?.started_at) {
    update.started_at = new Date().toISOString()
  }
  if ((status === 'completed' || status === 'failed') && !extraFields?.completed_at) {
    update.completed_at = new Date().toISOString()
  }
  if (status === 'completed') {
    update.progress = 100
  }

  const { data, error } = await supabase
    .from('render_jobs')
    .update(update)
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw error

  // Advance project to review when completed
  if (status === 'completed') {
    await supabase
      .from('projects')
      .update({ status: 'review' })
      .eq('id', data.project_id)
      .eq('status', 'rendering')
  }

  return data
}
