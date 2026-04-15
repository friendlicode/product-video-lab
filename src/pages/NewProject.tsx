import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import type { TargetPlatform, TonePreset } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Option lists ──────────────────────────────────────────────────────────────

const PLATFORM_OPTIONS: { value: TargetPlatform; label: string }[] = [
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

const TONE_OPTIONS: { value: TonePreset; label: string; description: string }[] = [
  { value: 'bold', label: 'Bold', description: 'Direct, confident, unafraid to make a claim' },
  {
    value: 'conversational',
    label: 'Conversational',
    description: 'Friendly and approachable, like talking to a peer',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and credible, for enterprise audiences',
  },
  {
    value: 'founder_raw',
    label: 'Founder Raw',
    description: 'Authentic and unfiltered, straight from the builder',
  },
  {
    value: 'hype',
    label: 'Hype',
    description: 'High energy and exciting, designed to generate buzz',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean and understated, letting the product speak',
  },
  {
    value: 'storyteller',
    label: 'Storyteller',
    description: 'Narrative-driven with a strong emotional through-line',
  },
]

// ─── Form field helpers ────────────────────────────────────────────────────────

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-zinc-300 text-sm">
        {label}
        {required && <span className="text-zinc-600 ml-1">*</span>}
      </Label>
      {children}
    </div>
  )
}

const inputCls =
  'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600'
const textareaCls =
  'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-600 resize-none'

// ─── Page ──────────────────────────────────────────────────────────────────────

export function NewProject() {
  const navigate = useNavigate()
  const { create } = useProjects()

  const [internalName, setInternalName] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform | ''>('')
  const [desiredOutcome, setDesiredOutcome] = useState('')
  const [tonePreset, setTonePreset] = useState<TonePreset | ''>('')
  const [cta, setCta] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate() {
    const errors: Record<string, string> = {}
    if (!internalName.trim()) errors.internal_name = 'Internal name is required'
    if (!productName.trim()) errors.product_name = 'Product name is required'
    return errors
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)

    try {
      const project = await create({
        internal_name: internalName.trim(),
        product_name: productName.trim(),
        product_description: productDescription.trim() || undefined,
        target_audience: targetAudience.trim() || undefined,
        target_platform: targetPlatform || undefined,
        desired_outcome: desiredOutcome.trim() || undefined,
        tone_preset: tonePreset || undefined,
        cta: cta.trim() || undefined,
      })
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">New Project</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Set up a new product video project</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core identity */}
        <div className="space-y-4 pb-6 border-b border-zinc-800">
          <Field id="internal_name" label="Internal Name" required>
            <Input
              id="internal_name"
              value={internalName}
              onChange={(e) => {
                setInternalName(e.target.value)
                if (fieldErrors.internal_name) setFieldErrors((f) => ({ ...f, internal_name: '' }))
              }}
              placeholder="e.g. ProspectZero Q3 Launch"
              className={inputCls}
            />
            {fieldErrors.internal_name && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.internal_name}</p>
            )}
          </Field>

          <Field id="product_name" label="Product Name" required>
            <Input
              id="product_name"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value)
                if (fieldErrors.product_name) setFieldErrors((f) => ({ ...f, product_name: '' }))
              }}
              placeholder="e.g. ProspectZero"
              className={inputCls}
            />
            {fieldErrors.product_name && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.product_name}</p>
            )}
          </Field>

          <Field id="product_description" label="Product Description">
            <Textarea
              id="product_description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="What does this product do? What problem does it solve?"
              rows={3}
              className={textareaCls}
            />
          </Field>
        </div>

        {/* Audience and distribution */}
        <div className="space-y-4 pb-6 border-b border-zinc-800">
          <Field id="target_audience" label="Target Audience">
            <Textarea
              id="target_audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Who is this video for? Describe your ideal viewer."
              rows={2}
              className={textareaCls}
            />
          </Field>

          <Field id="target_platform" label="Target Platform">
            <Select
              value={targetPlatform}
              onValueChange={(v) => setTargetPlatform(v as TargetPlatform)}
            >
              <SelectTrigger
                id="target_platform"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600"
              >
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {PLATFORM_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field id="desired_outcome" label="Desired Outcome">
            <Textarea
              id="desired_outcome"
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder="What should viewers do or feel after watching?"
              rows={2}
              className={textareaCls}
            />
          </Field>
        </div>

        {/* Style */}
        <div className="space-y-4 pb-6 border-b border-zinc-800">
          <Field id="tone_preset" label="Tone Preset">
            <Select
              value={tonePreset}
              onValueChange={(v) => setTonePreset(v as TonePreset)}
            >
              <SelectTrigger
                id="tone_preset"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 focus:ring-zinc-600"
              >
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {TONE_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    <div>
                      <span className="font-medium">{o.label}</span>
                      <span className="text-zinc-500 ml-2 text-xs">{o.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field id="cta" label="Call to Action">
            <Input
              id="cta"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder='e.g. "Start free trial" or "Book a demo"'
              className={inputCls}
            />
          </Field>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
