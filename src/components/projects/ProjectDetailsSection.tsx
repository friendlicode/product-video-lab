import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import type { DbProjectWithCounts } from '@/types/db'
import type { TargetPlatform, TonePreset } from '@/types/index'
import type { UpdateProjectData } from '@/services/projects'
import {
  PLATFORM_OPTIONS,
  PLATFORM_LABELS,
  TONE_OPTIONS,
  TONE_LABELS,
} from '@/lib/projectConstants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Editable text field ───────────────────────────────────────────────────────

function EditableText({
  value,
  placeholder,
  multiline,
  onSave,
}: {
  value: string | null
  placeholder: string
  multiline?: boolean
  onSave: (v: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value ?? '')
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setLocal(value ?? '')
  }, [value, editing])

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  const commit = useCallback(() => {
    const trimmed = local.trim()
    onSave(trimmed || null)
    setEditing(false)
  }, [local, onSave])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setLocal(value ?? '')
      setEditing(false)
    }
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      commit()
    }
  }

  const cls =
    'w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none'

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          rows={3}
          className={cls}
        />
      )
    }
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cls}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group/field w-full text-left flex items-start gap-1.5"
    >
      <span className={`flex-1 text-xs leading-relaxed ${value ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
        {value || placeholder}
      </span>
      <Pencil className="w-3 h-3 text-zinc-700 group-hover/field:text-zinc-500 shrink-0 mt-0.5 transition-colors" />
    </button>
  )
}

// ─── Editable select field ─────────────────────────────────────────────────────

function EditableSelect<T extends string>({
  value,
  placeholder,
  options,
  displayLabel,
  onSave,
}: {
  value: T | null
  placeholder: string
  options: { value: T; label: string }[]
  displayLabel: (v: T) => string
  onSave: (v: T | null) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full">
      {open ? (
        <Select
          value={value ?? '__none__'}
          onValueChange={(v) => {
            onSave(v === '__none__' ? null : (v as T))
            setOpen(false)
          }}
          open
          onOpenChange={(o) => { if (!o) setOpen(false) }}
        >
          <SelectTrigger className="h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 focus:ring-zinc-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="__none__" className="text-zinc-500 text-xs focus:bg-zinc-800 focus:text-zinc-400">
              {placeholder}
            </SelectItem>
            {options.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group/field w-full text-left flex items-start gap-1.5"
        >
          <span className={`flex-1 text-xs ${value ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
            {value ? displayLabel(value) : placeholder}
          </span>
          <Pencil className="w-3 h-3 text-zinc-700 group-hover/field:text-zinc-500 shrink-0 mt-0.5 transition-colors" />
        </button>
      )}
    </div>
  )
}

// ─── Row wrapper ───────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function ProjectDetailsSection({
  project,
  onUpdate,
}: {
  project: DbProjectWithCounts
  onUpdate: (fields: UpdateProjectData) => Promise<unknown>
}) {
  const [open, setOpen] = useState(true)

  const save = useCallback(
    (fields: UpdateProjectData) => onUpdate(fields),
    [onUpdate]
  )

  return (
    <div className="border-b border-zinc-800">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Project Details
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <FieldRow label="Product Name">
            <EditableText
              value={project.product_name}
              placeholder="Product name"
              onSave={(v) => save({ product_name: v ?? '' })}
            />
          </FieldRow>

          <FieldRow label="Description">
            <EditableText
              value={project.product_description}
              placeholder="Click to add description"
              multiline
              onSave={(v) => save({ product_description: v ?? undefined })}
            />
          </FieldRow>

          <FieldRow label="Target Audience">
            <EditableText
              value={project.target_audience}
              placeholder="Click to add target audience"
              multiline
              onSave={(v) => save({ target_audience: v ?? undefined })}
            />
          </FieldRow>

          <FieldRow label="Platform">
            <EditableSelect<TargetPlatform>
              value={project.target_platform}
              placeholder="Select platform"
              options={PLATFORM_OPTIONS}
              displayLabel={(v) => PLATFORM_LABELS[v]}
              onSave={(v) => save({ target_platform: v ?? undefined })}
            />
          </FieldRow>

          <FieldRow label="Desired Outcome">
            <EditableText
              value={project.desired_outcome}
              placeholder="Click to add desired outcome"
              multiline
              onSave={(v) => save({ desired_outcome: v ?? undefined })}
            />
          </FieldRow>

          <FieldRow label="Tone">
            <EditableSelect<TonePreset>
              value={project.tone_preset}
              placeholder="Select tone"
              options={TONE_OPTIONS}
              displayLabel={(v) => TONE_LABELS[v]}
              onSave={(v) => save({ tone_preset: v ?? undefined })}
            />
          </FieldRow>

          <FieldRow label="CTA">
            <EditableText
              value={project.cta}
              placeholder="Click to add call to action"
              onSave={(v) => save({ cta: v ?? undefined })}
            />
          </FieldRow>
        </div>
      )}
    </div>
  )
}
