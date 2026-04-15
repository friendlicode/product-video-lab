import type { ProjectStatus, TargetPlatform, TonePreset, AssetType } from '@/types/index'

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  briefing: { label: 'Briefing', classes: 'bg-blue-950 text-blue-300 border-blue-900' },
  story_selection: { label: 'Story', classes: 'bg-purple-950 text-purple-300 border-purple-900' },
  scripting: { label: 'Scripting', classes: 'bg-indigo-950 text-indigo-300 border-indigo-900' },
  storyboarding: { label: 'Storyboard', classes: 'bg-teal-950 text-teal-300 border-teal-900' },
  render_ready: { label: 'Render Ready', classes: 'bg-amber-950 text-amber-300 border-amber-900' },
  rendering: { label: 'Rendering', classes: 'bg-orange-950 text-orange-300 border-orange-900' },
  review: { label: 'Review', classes: 'bg-yellow-950 text-yellow-300 border-yellow-900' },
  approved: { label: 'Approved', classes: 'bg-green-950 text-green-300 border-green-900' },
  archived: { label: 'Archived', classes: 'bg-zinc-900 text-zinc-600 border-zinc-800' },
}

export const PLATFORM_LABELS: Record<TargetPlatform, string> = {
  linkedin: 'LinkedIn',
  twitter_x: 'Twitter/X',
  youtube_short: 'YouTube Short',
  youtube_long: 'YouTube',
  instagram_reel: 'Instagram Reel',
  tiktok: 'TikTok',
  website: 'Website',
  pitch_deck: 'Pitch Deck',
  other: 'Other',
}

export const PLATFORM_OPTIONS: { value: TargetPlatform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter_x', label: 'Twitter/X' },
  { value: 'youtube_short', label: 'YouTube Short' },
  { value: 'youtube_long', label: 'YouTube (long)' },
  { value: 'instagram_reel', label: 'Instagram Reel' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'website', label: 'Website' },
  { value: 'pitch_deck', label: 'Pitch Deck' },
  { value: 'other', label: 'Other' },
]

export const TONE_LABELS: Record<TonePreset, string> = {
  bold: 'Bold',
  conversational: 'Conversational',
  professional: 'Professional',
  founder_raw: 'Founder Raw',
  hype: 'Hype',
  minimal: 'Minimal',
  storyteller: 'Storyteller',
}

export const TONE_OPTIONS: { value: TonePreset; label: string; description: string }[] = [
  { value: 'bold', label: 'Bold', description: 'Direct, confident, unafraid to make a claim' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly and approachable, like talking to a peer' },
  { value: 'professional', label: 'Professional', description: 'Polished and credible, for enterprise audiences' },
  { value: 'founder_raw', label: 'Founder Raw', description: 'Authentic and unfiltered, straight from the builder' },
  { value: 'hype', label: 'Hype', description: 'High energy and exciting, designed to generate buzz' },
  { value: 'minimal', label: 'Minimal', description: 'Clean and understated, letting the product speak' },
  { value: 'storyteller', label: 'Storyteller', description: 'Narrative-driven with a strong emotional through-line' },
]

export const ASSET_TYPE_CONFIG: Record<AssetType, { label: string; classes: string }> = {
  screenshot: { label: 'Screenshot', classes: 'bg-blue-950 text-blue-300 border-blue-900' },
  demo_video: { label: 'Demo Video', classes: 'bg-purple-950 text-purple-300 border-purple-900' },
  logo: { label: 'Logo', classes: 'bg-amber-950 text-amber-300 border-amber-900' },
  brand_asset: { label: 'Brand', classes: 'bg-teal-950 text-teal-300 border-teal-900' },
  other: { label: 'Other', classes: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
}

export const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'demo_video', label: 'Demo Video' },
  { value: 'logo', label: 'Logo' },
  { value: 'brand_asset', label: 'Brand Asset' },
  { value: 'other', label: 'Other' },
]
