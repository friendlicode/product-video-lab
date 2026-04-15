import { supabase } from '@/lib/supabase'
import type { AssetType } from '@/types/index'
import type { DbProjectAsset } from '@/types/db'

const BUCKET = 'project-assets'

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

export async function getProjectAssets(projectId: string): Promise<DbProjectAsset[]> {
  const { data, error } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function uploadAsset(
  projectId: string,
  file: File,
  assetType: AssetType,
  label?: string
): Promise<DbProjectAsset> {
  const userId = await getCurrentUserId()
  const ext = file.name.split('.').pop() ?? ''
  const fileName = `${crypto.randomUUID()}.${ext}`
  const filePath = `${projectId}/${fileName}`

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: file.type, upsert: false })
  if (uploadErr) throw uploadErr

  const { data: signed, error: urlErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 31_536_000)
  if (urlErr) throw urlErr

  let width: number | null = null
  let height: number | null = null
  if (file.type.startsWith('image/')) {
    try {
      const dims = await readImageDimensions(file)
      width = dims.width
      height = dims.height
    } catch {
      // non-fatal
    }
  }

  const { count } = await supabase
    .from('project_assets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const { data: asset, error: insertErr } = await supabase
    .from('project_assets')
    .insert({
      project_id: projectId,
      asset_type: assetType,
      file_path: filePath,
      file_url: signed.signedUrl,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      width,
      height,
      duration_ms: null,
      metadata: label ? { label } : {},
      sort_order: count ?? 0,
      created_by: userId,
    })
    .select()
    .single()

  if (insertErr) throw insertErr
  return asset
}

export async function deleteAsset(id: string): Promise<void> {
  const { data: asset, error: fetchErr } = await supabase
    .from('project_assets')
    .select('file_path')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  const { error: storageErr } = await supabase.storage.from(BUCKET).remove([asset.file_path])
  if (storageErr) console.error('[assets] storage delete failed:', storageErr.message)

  const { error } = await supabase.from('project_assets').delete().eq('id', id)
  if (error) throw error
}

export async function updateAssetOrder(
  projectId: string,
  orderedIds: string[]
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('project_assets')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('project_id', projectId)
        .then(({ error }) => {
          if (error) throw error
        })
    )
  )
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image dimensions'))
    }
    img.src = url
  })
}
