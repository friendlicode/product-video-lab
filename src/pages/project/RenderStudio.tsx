/**
 * RenderStudio — /projects/:id/render
 *
 * Single-column, stacked collapsible sections:
 *   1. Captions
 *   2. Render (includes music + assemble + job list)
 *   3. Advanced (Approvals, History, Activity)
 *
 * Reads selectedScript and activeStoryboardVersionId from DB — no prop drilling.
 */

import { useState, useEffect, ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useScripts } from '@/hooks/useScripts'
import { useCaptions } from '@/hooks/useCaptions'
import { getStoryboardVersions } from '@/services/storyboards'
import { generateCaptions } from '@/services/generation'
import type { CaptionSegment } from '@/types/index'
import { CaptionsPanel } from '@/components/generation/CaptionsPanel'
import { RenderPanel } from '@/components/render/RenderPanel'
import { ApprovalPanel } from '@/components/projects/ApprovalPanel'
import { VersionHistory } from '@/components/projects/VersionHistory'
import { ActivityTimeline } from '@/components/projects/ActivityTimeline'

// ── Collapsible section wrapper ────────────────────────────────────────────────

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-800/20 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-zinc-800/40 transition-colors"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
        }
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {title}
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-800">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function RenderStudio() {
  const { id } = useParams<{ id: string }>()
  const [anyGenerating, setAnyGenerating] = useState(false)
  const [activeStoryboardVersionId, setActiveStoryboardVersionId] = useState<string | null>(null)

  // Resolve selected script
  const { data: scripts } = useScripts(id)
  const selectedScript = scripts?.find((s) => s.selected) ?? null

  // Resolve active storyboard version from DB (selected=true)
  useEffect(() => {
    if (!id) return
    getStoryboardVersions(id)
      .then((versions) => {
        const selected = versions.find((v) => v.selected)
        setActiveStoryboardVersionId(selected?.id ?? null)
      })
      .catch(() => {/* silent — RenderPanel handles missing version gracefully */})
  }, [id])

  // Captions
  const { data: captionVersions, loading: captionLoading, save: saveCaptions, refetch: refetchCaptions } = useCaptions(id)

  async function handleGenerateCaptions() {
    if (!selectedScript) { toast.error('Select a script first'); return }
    if (!activeStoryboardVersionId) { toast.error('Activate a storyboard version first'); return }
    setAnyGenerating(true)
    try {
      await generateCaptions(id!, selectedScript.id, activeStoryboardVersionId)
      refetchCaptions()
      toast.success('Captions generated!')
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleSaveCaptions(
    scriptId: string,
    storyboardVersionId: string,
    segments: CaptionSegment[]
  ) {
    return saveCaptions(scriptId, storyboardVersionId, segments)
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-900">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

        {/* Missing prereqs banner */}
        {(!selectedScript || !activeStoryboardVersionId) && (
          <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p className="text-sm text-amber-300/80">
              {!selectedScript && 'No script selected — go to Script page to generate one. '}
              {!activeStoryboardVersionId && 'No storyboard version active — go to Storyboard page to generate one.'}
            </p>
          </div>
        )}

        {/* ── 1. Captions ──────────────────────────────────────────── */}
        <Section title="Captions">
          <div className="h-80 overflow-hidden">
            <CaptionsPanel
              versions={captionVersions}
              loading={captionLoading}
              selectedScriptId={selectedScript?.id ?? null}
              selectedStoryboardVersionId={activeStoryboardVersionId}
              generatingLock={anyGenerating}
              onSave={handleSaveCaptions}
              onGenerate={handleGenerateCaptions}
            />
          </div>
        </Section>

        {/* ── 2. Render (music + assemble + job list) ───────────────── */}
        <Section title="Render">
          <div className="min-h-64 overflow-hidden">
            <RenderPanel
              projectId={id!}
              selectedScriptId={selectedScript?.id ?? null}
              selectedStoryboardVersionId={activeStoryboardVersionId}
            />
          </div>
        </Section>

        {/* ── 3. Advanced ───────────────────────────────────────────── */}
        <Section title="Advanced" defaultOpen={false}>
          <div className="divide-y divide-zinc-800">

            {/* Approvals */}
            <div className="px-1 py-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 px-5 py-2">Approvals</p>
              <div className="h-48 overflow-hidden">
                <ApprovalPanel
                  projectId={id!}
                  selectedScriptId={selectedScript?.id ?? null}
                  selectedStoryboardVersionId={activeStoryboardVersionId}
                />
              </div>
            </div>

            {/* Version history */}
            <div className="px-1 py-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 px-5 py-2">Version History</p>
              <div className="h-56 overflow-y-auto">
                <VersionHistory projectId={id!} />
              </div>
            </div>

            {/* Activity */}
            <div className="px-1 py-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 px-5 py-2">Activity</p>
              <div className="h-56 overflow-y-auto">
                <ActivityTimeline projectId={id!} />
              </div>
            </div>
          </div>
        </Section>

        {/* Bottom padding for scroll comfort */}
        <div className="h-8" />
      </div>
    </div>
  )
}
