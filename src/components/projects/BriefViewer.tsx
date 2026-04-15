import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, Code } from 'lucide-react'
import { useProductBrief } from '@/hooks/useProductBrief'
import type { DbProductBrief } from '@/types/db'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── String list display ───────────────────────────────────────────────────────

function StringList({ items }: { items: unknown[] }) {
  if (!items.length) return <p className="text-xs text-zinc-600 italic">None listed</p>
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
          <span className="text-zinc-600 mt-0.5 shrink-0">-</span>
          <span className="leading-relaxed">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Collapsible section ───────────────────────────────────────────────────────

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="border-b border-zinc-800/60 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        {open ? (
          <ChevronDown className="w-3 h-3 text-zinc-600" />
        ) : (
          <ChevronRight className="w-3 h-3 text-zinc-600" />
        )}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

// ─── Text field display ────────────────────────────────────────────────────────

function TextField({ value }: { value: string | null }) {
  if (!value) return <p className="text-xs text-zinc-600 italic">Not set</p>
  return <p className="text-xs text-zinc-400 leading-relaxed">{value}</p>
}

// ─── Brief body ────────────────────────────────────────────────────────────────

function BriefBody({ brief }: { brief: DbProductBrief }) {
  const [showRaw, setShowRaw] = useState(false)

  return (
    <div className="px-4 pb-4 space-y-0">
      <Section title="Audience Summary" defaultOpen>
        <TextField value={brief.audience_summary} />
      </Section>

      <Section title="Problem Summary">
        <TextField value={brief.problem_summary} />
      </Section>

      <Section title="Promise Summary">
        <TextField value={brief.promise_summary} />
      </Section>

      <Section title={`Benefits (${brief.benefits.length})`}>
        <StringList items={brief.benefits} />
      </Section>

      <Section title={`Objections (${brief.objections.length})`}>
        <StringList items={brief.objections} />
      </Section>

      <Section title={`Proof Points (${brief.proof_points.length})`}>
        <StringList items={brief.proof_points} />
      </Section>

      <Section title={`Visual Highlights (${brief.visual_highlights.length})`}>
        <StringList items={brief.visual_highlights} />
      </Section>

      {Object.keys(brief.positioning_notes).length > 0 && (
        <Section title="Positioning Notes">
          <pre className="text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap break-all">
            {JSON.stringify(brief.positioning_notes, null, 2)}
          </pre>
        </Section>
      )}

      {/* Raw JSON */}
      <div className="pt-2">
        <button
          onClick={() => setShowRaw((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <Code className="w-3 h-3" />
          {showRaw ? 'Hide' : 'View'} raw JSON
        </button>
        {showRaw && (
          <pre className="mt-2 text-xs text-zinc-600 bg-zinc-950 rounded-md p-3 overflow-x-auto max-h-64 leading-relaxed">
            {JSON.stringify(brief.raw_json, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BriefViewer({ projectId }: { projectId: string }) {
  const { data: latest, allVersions, loading } = useProductBrief(projectId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sectionOpen, setSectionOpen] = useState(true)

  const displayed: DbProductBrief | null =
    selectedId ? (allVersions.find((b) => b.id === selectedId) ?? latest) : latest

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setSectionOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Product Brief
          {allVersions.length > 0 && (
            <span className="ml-1.5 text-zinc-600 font-normal normal-case">
              (v{displayed?.version_number ?? latest?.version_number})
            </span>
          )}
        </span>
        <span className="text-zinc-500 text-xs">{sectionOpen ? '-' : '+'}</span>
      </button>

      {sectionOpen && (
        <>
          {loading ? (
            <div className="px-4 pb-4 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !latest ? (
            <div className="px-4 pb-6 text-center">
              <Sparkles className="w-7 h-7 text-zinc-700 mx-auto mb-2" strokeWidth={1.25} />
              <p className="text-xs text-zinc-500 mb-3">No brief generated yet</p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-1.5"
                disabled
              >
                <Sparkles className="w-3 h-3" />
                Generate Brief
              </Button>
            </div>
          ) : (
            <>
              {/* Version selector */}
              {allVersions.length > 1 && (
                <div className="px-4 pb-3">
                  <Select
                    value={selectedId ?? latest.id}
                    onValueChange={(v) => setSelectedId(v)}
                  >
                    <SelectTrigger className="h-7 w-full text-xs bg-zinc-900 border-zinc-700 text-zinc-400 focus:ring-zinc-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {allVersions.map((b) => (
                        <SelectItem
                          key={b.id}
                          value={b.id}
                          className="text-zinc-300 text-xs focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          Version {b.version_number}
                          {b.id === latest.id ? ' (latest)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {displayed && <BriefBody brief={displayed} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
