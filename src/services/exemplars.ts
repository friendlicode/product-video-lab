import { supabase } from '@/lib/supabase'

export type ExemplarCategory =
  | 'b2b_saas'
  | 'consumer'
  | 'devtools'
  | 'ai_app'
  | 'fintech'
  | 'productivity'
  | 'hardware'
  | 'creative_tool'
  | 'other'

export type DbVideoExemplar = {
  id: string
  title: string
  brand: string | null
  url: string
  source_notes: string | null
  product_category: ExemplarCategory
  duration_seconds: number
  aspect_ratio: string
  hook_pattern: string | null
  narrative_structure: unknown[]
  pacing_curve: Record<string, unknown>
  music_strategy: Record<string, unknown>
  visual_language: Record<string, unknown>
  caption_style: Record<string, unknown>
  key_techniques: string[]
  curator_notes: string | null
  quality_score: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type UpdateExemplarData = Partial<
  Pick<
    DbVideoExemplar,
    | 'title'
    | 'brand'
    | 'url'
    | 'source_notes'
    | 'product_category'
    | 'duration_seconds'
    | 'aspect_ratio'
    | 'hook_pattern'
    | 'narrative_structure'
    | 'pacing_curve'
    | 'music_strategy'
    | 'visual_language'
    | 'caption_style'
    | 'key_techniques'
    | 'curator_notes'
    | 'quality_score'
    | 'is_active'
  >
>

export async function getExemplars(
  opts: { category?: ExemplarCategory; activeOnly?: boolean } = {}
): Promise<DbVideoExemplar[]> {
  let q = supabase.from('video_exemplars').select('*')

  if (opts.activeOnly !== false) q = q.eq('is_active', true)
  if (opts.category) q = q.eq('product_category', opts.category)

  const { data, error } = await q.order('quality_score', { ascending: false })
  if (error) throw error
  return (data ?? []) as DbVideoExemplar[]
}

export async function getExemplarsByCategory(
  categories: ExemplarCategory[],
  limit = 3
): Promise<DbVideoExemplar[]> {
  const { data, error } = await supabase
    .from('video_exemplars')
    .select('*')
    .in('product_category', categories)
    .eq('is_active', true)
    .order('quality_score', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as DbVideoExemplar[]
}

export async function updateExemplar(
  id: string,
  updates: UpdateExemplarData
): Promise<DbVideoExemplar> {
  const { data, error } = await supabase
    .from('video_exemplars')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbVideoExemplar
}

export async function toggleExemplarActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('video_exemplars')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

export const CATEGORY_LABELS: Record<ExemplarCategory, string> = {
  b2b_saas: 'B2B SaaS',
  consumer: 'Consumer',
  devtools: 'Dev Tools',
  ai_app: 'AI App',
  fintech: 'Fintech',
  productivity: 'Productivity',
  hardware: 'Hardware',
  creative_tool: 'Creative Tool',
  other: 'Other',
}

export const ALL_CATEGORIES: ExemplarCategory[] = [
  'b2b_saas',
  'consumer',
  'devtools',
  'ai_app',
  'fintech',
  'productivity',
  'hardware',
  'creative_tool',
  'other',
]
