import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import type { TargetPlatform, TonePreset } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// ─── Option lists ──────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS: { value: TargetPlatform; label: string; emoji: string }[] = [
  { value: 'linkedin',       label: 'LinkedIn',       emoji: '💼' },
  { value: 'instagram_reel', label: 'Instagram',      emoji: '📸' },
  { value: 'youtube_short',  label: 'YouTube Short',  emoji: '▶️' },
  { value: 'youtube_long',   label: 'YouTube',        emoji: '🎬' },
  { value: 'tiktok',         label: 'TikTok',         emoji: '🎵' },
  { value: 'twitter_x',      label: 'Twitter/X',      emoji: '𝕏' },
  { value: 'website',        label: 'Website',        emoji: '🌐' },
  { value: 'pitch_deck',     label: 'Pitch Deck',     emoji: '📊' },
]

const TONE_OPTIONS: { value: TonePreset; label: string; description: string }[] = [
  { value: 'bold',          label: 'Bold',         description: 'Direct and confident' },
  { value: 'conversational',label: 'Casual',       description: 'Friendly and approachable' },
  { value: 'professional',  label: 'Professional', description: 'Polished, enterprise feel' },
  { value: 'founder_raw',   label: 'Founder',      description: 'Authentic, straight from the builder' },
  { value: 'hype',          label: 'Hype',         description: 'High energy and exciting' },
  { value: 'minimal',       label: 'Minimal',      description: 'Clean, let the product speak' },
  { value: 'storyteller',   label: 'Storyteller',  description: 'Narrative-driven with emotional arc' },
]

// ─── Chip button ───────────────────────────────────────────────────────────────

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
        ${selected
          ? 'border-violet-600 bg-violet-600/15 text-violet-300 ring-1 ring-violet-600/40'
          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
        }
      `}
    >
      {children}
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const inputCls =
  'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600'
const textareaCls =
  'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600 resize-none'

export function NewProject() {
  const navigate = useNavigate()
  const { create } = useProjects()

  // Required
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')

  // Chip selectors
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform | ''>('')
  const [tonePreset, setTonePreset] = useState<TonePreset | ''>('')

  // More options
  const [moreOpen, setMoreOpen] = useState(false)
  const [targetAudience, setTargetAudience] = useState('')
  const [cta, setCta] = useState('')
  const [desiredOutcome, setDesiredOutcome] = useState('')
  const [internalNameOverride, setInternalNameOverride] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!productName.trim()) {
      setNameError('Product name is required')
      return
    }
    setNameError('')
    setLoading(true)

    const autoInternalName = `${productName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

    try {
      const project = await create({
        internal_name: internalNameOverride.trim() || autoInternalName,
        product_name: productName.trim(),
        product_description: productDescription.trim() || undefined,
        target_audience: targetAudience.trim() || undefined,
        target_platform: targetPlatform || undefined,
        desired_outcome: desiredOutcome.trim() || undefined,
        tone_preset: tonePreset || undefined,
        cta: cta.trim() || undefined,
      })
      navigate(`/projects/${project.id}/script`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-zinc-900 flex items-start justify-center pt-12 px-4 pb-16">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">New Project</h1>
            <p className="text-sm text-zinc-500 mt-0.5">What are you making a video about?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Product name — required */}
          <div className="space-y-1.5">
            <Label htmlFor="product_name" className="text-zinc-300 text-sm">
              Product Name <span className="text-violet-500">*</span>
            </Label>
            <Input
              id="product_name"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value)
                if (nameError) setNameError('')
              }}
              placeholder="e.g. Acme Analytics"
              className={inputCls}
              autoFocus
            />
            {nameError && <p className="text-xs text-red-400">{nameError}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-zinc-300 text-sm">Description</Label>
            <Textarea
              id="description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="What does it do? What problem does it solve?"
              rows={3}
              className={textareaCls}
            />
          </div>

          {/* Platform chips */}
          <div className="space-y-2.5">
            <Label className="text-zinc-300 text-sm">Platform</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <Chip
                  key={p.value}
                  selected={targetPlatform === p.value}
                  onClick={() => setTargetPlatform(targetPlatform === p.value ? '' : p.value)}
                >
                  <span className="mr-1.5">{p.emoji}</span>{p.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Tone chips */}
          <div className="space-y-2.5">
            <Label className="text-zinc-300 text-sm">Tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => (
                <Chip
                  key={t.value}
                  selected={tonePreset === t.value}
                  onClick={() => setTonePreset(tonePreset === t.value ? '' : t.value)}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
            {tonePreset && (
              <p className="text-xs text-zinc-500 mt-1">
                {TONE_OPTIONS.find((t) => t.value === tonePreset)?.description}
              </p>
            )}
          </div>

          {/* More options accordion */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
            >
              {moreOpen
                ? <ChevronDown className="w-4 h-4 text-zinc-600" />
                : <ChevronRight className="w-4 h-4 text-zinc-600" />
              }
              More options
              <span className="text-xs text-zinc-600 ml-1">audience, CTA, internal name</span>
            </button>

            {moreOpen && (
              <div className="border-t border-zinc-800 px-4 py-4 space-y-4 bg-zinc-800/20">
                <div className="space-y-1.5">
                  <Label htmlFor="audience" className="text-zinc-300 text-sm">Target Audience</Label>
                  <Textarea
                    id="audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Who is this for? e.g. startup founders, enterprise CTOs..."
                    rows={2}
                    className={textareaCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cta" className="text-zinc-300 text-sm">Call to Action</Label>
                  <Input
                    id="cta"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder='e.g. "Start free trial" or "Book a demo"'
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="outcome" className="text-zinc-300 text-sm">Desired Outcome</Label>
                  <Textarea
                    id="outcome"
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="What should viewers do or feel after watching?"
                    rows={2}
                    className={textareaCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="internal_name" className="text-zinc-300 text-sm">
                    Internal Name
                    <span className="text-zinc-600 ml-2 font-normal text-xs">(auto-generated if left blank)</span>
                  </Label>
                  <Input
                    id="internal_name"
                    value={internalNameOverride}
                    onChange={(e) => setInternalNameOverride(e.target.value)}
                    placeholder={
                      productName
                        ? `${productName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
                        : 'e.g. acme-analytics-q3-launch'
                    }
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-white px-6"
            >
              {loading ? 'Creating...' : 'Create Project →'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-zinc-500 hover:text-zinc-200"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
