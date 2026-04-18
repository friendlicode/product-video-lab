/**
 * StoryboardStudio — /projects/:id/storyboard
 *
 * Full-width storyboard editor with a collapsible asset panel on the right.
 * Reads selectedScript from hooks (selected: true), no prop drilling needed.
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Layers, X } from 'lucide-react'
import { useScripts } from '@/hooks/useScripts'
import { generateStoryboard } from '@/services/generation'
import { StoryboardEditor } from '@/components/storyboard/StoryboardEditor'
import { AssetMatchingReview } from '@/components/generation/AssetMatchingReview'
import { Button } from '@/components/ui/button'

export function StoryboardStudio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [assetPanelOpen, setAssetPanelOpen] = useState(false)
  const [anyGenerating, setAnyGenerating] = useState(false)
  const [activeStoryboardVersionId, setActiveStoryboardVersionId] = useState<string | null>(null)

  // Get selected script for storyboard generation
  const { data: scripts } = useScripts(id)
  const selectedScript = scripts?.find((s) => s.selected) ?? null

  async function handleGenerateStoryboard() {
    if (!selectedScript) {
      toast.error('Select a script first (go back to Script page)')
      return
    }
    setAnyGenerating(true)
    try {
      await generateStoryboard(id!, selectedScript.id)
      toast.success('Storyboard generated!')
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message)
      throw e
    } finally {
      setAnyGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Main storyboard area ─────────────────────────────────── */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Storyboard</p>
              {!selectedScript && (
                <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5">
                  Select a script first
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssetPanelOpen((v) => !v)}
              className={`h-8 text-xs gap-1.5 ${assetPanelOpen ? 'text-violet-400 bg-violet-600/10' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              Assets
            </Button>
          </div>

          {/* Storyboard editor fills remaining height */}
          <div className="flex-1 overflow-hidden">
            <StoryboardEditor
              projectId={id!}
              selectedScriptId={selectedScript?.id ?? null}
              generatingLock={anyGenerating}
              onGenerate={handleGenerateStoryboard}
              onVersionChange={setActiveStoryboardVersionId}
            />
          </div>
        </main>

        {/* ── Asset panel (slide-out) ─────────────────────────────── */}
        {assetPanelOpen && (
          <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-950 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Asset Matching</p>
              <button
                onClick={() => setAssetPanelOpen(false)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AssetMatchingReview
                projectId={id!}
                storyboardVersionId={activeStoryboardVersionId}
                onClose={() => setAssetPanelOpen(false)}
              />
            </div>
          </aside>
        )}
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur px-8 py-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {activeStoryboardVersionId
            ? 'Storyboard ready — configure captions, music, and rendering'
            : 'Generate or select a storyboard version to continue'}
        </p>
        <Button
          onClick={() => navigate(`/projects/${id}/render`)}
          disabled={!activeStoryboardVersionId}
          className="bg-violet-600 hover:bg-violet-500 text-white gap-2 px-5 disabled:opacity-40"
        >
          Next: Render
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
