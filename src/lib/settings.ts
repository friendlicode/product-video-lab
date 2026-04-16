import type { TonePreset, TargetPlatform } from '@/types/index'

export const SETTINGS_KEY = 'vpl_settings'

export type AppSettings = {
  // Generation defaults
  defaultTone: TonePreset | ''
  defaultPlatform: TargetPlatform | ''
  defaultAspectRatio: '9:16' | '1:1' | '16:9' | '4:5'
  // AI configuration
  openAiApiKey: string
  highStakesModel: 'gpt-4o' | 'gpt-4o-mini'
  lightweightModel: 'gpt-4o-mini' | 'gpt-4o'
  temperature: number
  // Voiceover (placeholder)
  voiceoverProvider: 'elevenlabs' | 'openai_tts' | 'none'
  voiceoverApiKey: string
  voicePreset: string
  // ElevenLabs voice id used by the generate-voiceover Edge Function.
  elevenLabsVoiceId: string
  // Render (placeholder)
  renderProvider: 'remotion' | 'custom_worker' | 'none'
  workerUrl: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTone: '',
  defaultPlatform: '',
  defaultAspectRatio: '9:16',
  openAiApiKey: '',
  highStakesModel: 'gpt-4o',
  lightweightModel: 'gpt-4o-mini',
  temperature: 0.7,
  voiceoverProvider: 'elevenlabs',
  voiceoverApiKey: '',
  voicePreset: '',
  elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  renderProvider: 'remotion',
  workerUrl: '',
}

/** Synchronous read from localStorage, safe to call outside React. */
export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return { ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as Partial<AppSettings>) }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
