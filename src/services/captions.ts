import { supabase } from '@/lib/supabase'
import type { CaptionSegment } from '@/types/index'
import type { DbCaptionVersion } from '@/types/db'

export async function getCaptionVersions(projectId: string): Promise<DbCaptionVersion[]> {
  const { data, error } = await supabase
    .from('caption_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function saveCaptions(
  projectId: string,
  scriptId: string,
  storyboardVersionId: string,
  segments: CaptionSegment[]
): Promise<DbCaptionVersion> {
  const { count } = await supabase
    .from('caption_versions')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('script_id', scriptId)

  const { data, error } = await supabase
    .from('caption_versions')
    .insert({
      project_id: projectId,
      script_id: scriptId,
      storyboard_version_id: storyboardVersionId,
      version_number: (count ?? 0) + 1,
      segments,
      raw_json: {},
    })
    .select()
    .single()

  if (error) throw error
  return data
}
