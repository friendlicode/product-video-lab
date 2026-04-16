import { useState } from 'react'
import { Eye, EyeOff, RotateCcw } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { TONE_OPTIONS, PLATFORM_OPTIONS } from '@/lib/projectConstants'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-800/30">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4 space-y-5">{children}</div>
    </div>
  )
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        {description && <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0 w-56">{children}</div>
    </div>
  )
}

function ApiKeyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'sk-...'}
        className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-2 pr-8 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
      >
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

export function Settings() {
  const { settings, update, reset } = useSettings()
  const [saved, setSaved] = useState(false)

  function handleUpdate<K extends keyof typeof settings>(key: K, value: typeof settings[K]) {
    update({ [key]: value })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
          <p className="text-xs text-zinc-500 mt-0.5">App configuration and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-teal-400">Saved</span>}
          <Button
            size="sm"
            variant="ghost"
            onClick={reset}
            className="h-7 text-xs text-zinc-600 hover:text-zinc-300 gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset to defaults
          </Button>
        </div>
      </div>

      {/* Generation Defaults */}
      <SectionCard
        title="Generation Defaults"
        description="Applied to new projects when no value is specified."
      >
        <SettingsRow label="Default tone preset">
          <Select
            value={settings.defaultTone || 'none'}
            onValueChange={(v) => handleUpdate('defaultTone', v === 'none' ? '' : v as typeof settings.defaultTone)}
          >
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="none" className="text-zinc-400 text-xs focus:bg-zinc-800">
                None (project default)
              </SelectItem>
              {TONE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Default target platform">
          <Select
            value={settings.defaultPlatform || 'none'}
            onValueChange={(v) => handleUpdate('defaultPlatform', v === 'none' ? '' : v as typeof settings.defaultPlatform)}
          >
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="none" className="text-zinc-400 text-xs focus:bg-zinc-800">
                None (project default)
              </SelectItem>
              {PLATFORM_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Default aspect ratio">
          <Select
            value={settings.defaultAspectRatio}
            onValueChange={(v) => handleUpdate('defaultAspectRatio', v as typeof settings.defaultAspectRatio)}
          >
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {(['9:16', '1:1', '16:9', '4:5'] as const).map((r) => (
                <SelectItem key={r} value={r} className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SectionCard>

      {/* AI Configuration */}
      <SectionCard
        title="AI Configuration"
        description="Controls which models and keys are used for generation."
      >
        <SettingsRow
          label="OpenAI API key"
          description="Overrides the VITE_OPENAI_API_KEY env variable. Stored locally in your browser."
        >
          <ApiKeyInput
            value={settings.openAiApiKey}
            onChange={(v) => handleUpdate('openAiApiKey', v)}
          />
        </SettingsRow>

        <SettingsRow
          label="High-stakes model"
          description="Used for briefs, story directions, and scripts."
        >
          <Select
            value={settings.highStakesModel}
            onValueChange={(v) => handleUpdate('highStakesModel', v as typeof settings.highStakesModel)}
          >
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="gpt-4o" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">gpt-4o</SelectItem>
              <SelectItem value="gpt-4o-mini" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">gpt-4o-mini</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Lightweight model"
          description="Used for hooks, storyboards, and captions."
        >
          <Select
            value={settings.lightweightModel}
            onValueChange={(v) => handleUpdate('lightweightModel', v as typeof settings.lightweightModel)}
          >
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="gpt-4o-mini" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">gpt-4o-mini</SelectItem>
              <SelectItem value="gpt-4o" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">gpt-4o</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow
          label="Temperature"
          description={`Controls creativity vs. consistency. Current: ${settings.temperature.toFixed(1)}`}
        >
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => handleUpdate('temperature', parseFloat(e.target.value))}
              className="flex-1 accent-zinc-300"
            />
            <span className="text-xs text-zinc-400 w-6 text-right">
              {settings.temperature.toFixed(1)}
            </span>
          </div>
        </SettingsRow>
      </SectionCard>

      {/* Voiceover Provider */}
      <SectionCard title="Voiceover Provider">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-500 mb-3">
          Voiceover integration coming soon
        </div>

        <SettingsRow label="Provider">
          <Select
            value={settings.voiceoverProvider}
            onValueChange={(v) => handleUpdate('voiceoverProvider', v as typeof settings.voiceoverProvider)}
          >
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600 opacity-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="none" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">None</SelectItem>
              <SelectItem value="elevenlabs" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">ElevenLabs</SelectItem>
              <SelectItem value="openai_tts" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">OpenAI TTS</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="API key">
          <ApiKeyInput
            value={settings.voiceoverApiKey}
            onChange={(v) => handleUpdate('voiceoverApiKey', v)}
            placeholder="API key..."
          />
        </SettingsRow>

        <SettingsRow label="Voice preset">
          <Select value={settings.voicePreset || 'default'} onValueChange={() => {}}>
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600 opacity-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="default" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">Default</SelectItem>
              <SelectItem value="narrator" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">Narrator</SelectItem>
              <SelectItem value="energetic" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">Energetic</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SectionCard>

      {/* Render Provider */}
      <SectionCard title="Render Provider">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded text-xs text-zinc-500 mb-3">
          Render worker integration coming soon
        </div>

        <SettingsRow label="Provider">
          <Select
            value={settings.renderProvider}
            onValueChange={(v) => handleUpdate('renderProvider', v as typeof settings.renderProvider)}
          >
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600 opacity-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="remotion" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">Remotion</SelectItem>
              <SelectItem value="custom_worker" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">Custom Worker</SelectItem>
              <SelectItem value="none" className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100">None</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Worker URL" description="Endpoint for your custom render worker.">
          <input
            type="url"
            value={settings.workerUrl}
            onChange={(e) => handleUpdate('workerUrl', e.target.value)}
            placeholder="https://your-worker.example.com"
            className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 opacity-50"
          />
        </SettingsRow>
      </SectionCard>

    </div>
  )
}
