/**
 * ScriptStudio — /projects/:id/script
 *
 * 2-column layout:
 *   Left sidebar (w-72): project details + assets + brief summary
 *   Main (flex-1): story directions → hooks → script → voiceover
 *   Sticky footer: "Next: Storyboard →" once a script is selected
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { useStoryDirections } from '@/hooks/useStoryDirections'
import { useHooks } from '@/hooks/useHooks'
import { useScripts } from '@/hooks/useScripts'
import { useProductBrief } from '@/hooks/useProductBrief'
import { useSettings } from '@/hooks/useSettings'
import {
  generateStoryDirections,
  generateHooks,
  generateScript,
} from '@/services/generation'
import { generateVoiceover } from '@/services/voiceover'
import type { UpdateScriptData } from '@/services/scripts'
import { StoryDirections } from '@/components/generation/StoryDirections'
import { HooksPanel } from '@/components/generation/HooksPanel'
import { ScriptEditor } from '@/components/generation/ScriptEditor'
import { BriefViewer } from '@/components/projects/BriefViewer'
import { AssetGallery } from '@/components/projects/AssetGallery'
import { ProjectDetailsSection } from '@/components/projects/ProjectDetailsSection'
import { Button } from '@/components/ui/button'

// ── Section header ─────────────────────────────────────────────────────────────

function SectionLabel({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
        {step}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ScriptStudio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [anyGenerating, setAnyGenerating] = useState(false)

  const { data: project, update: updateProject } = useProject(id)

  // Data hooks
  const { data: directions, loading: dirLoading, select: selectDirection, refetch: refetchDirections } = useStoryDirections(id)
  const selectedDirection = directions?.find((d) => d.selected) ?? null

  const { data: hooks, loading: hookLoading, select: selectHook, refetch: refetchHooks } = useHooks(selectedDirection?.id)
  const selectedHook = hooks?.find((h) => h.selected) ?? null

  const { data: scripts, loading: scriptLoading, select: selectScript, update: updateScript, refetch: refetchScripts } = useScripts(id)
  const selectedScript = scripts?.find((s) => s.selected) ?? null

  const { data: latestBrief } = useProductBrief(id)
  const hasBrief = Boolean(latestBrief)

  const { settings } = useSettings()

  // ── Generation handlers ────────────────────────────────────────────────────

  async function handleGenerateDirections() {
    if (!latestBrief) {
      toast.error('Generate a product brief first (in the left panel)')
      return
    }
    setAnyGenerating(true)
    try {
      await generateStoryDirections(id!, latestBrief.id)
      refetchDirections()
      toast.success('Story directions generated!')
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleGenerateHooks() {
    if (!selectedDirection) { toast.error('Select a story direction first'); return }
    setAnyGenerating(true)
    try {
      await generateHooks(id!, selectedDirection.id)
      refetchHooks()
      toast.success('Hooks generated!')
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleGenerateScript() {
    if (!selectedDirection) { toast.error('Select a story direction first'); return }
    if (!selectedHook) { toast.error('Select a hook first'); return }
    setAnyGenerating(true)
    try {
      await generateScript(id!, selectedDirection.id, selectedHook.id)
      refetchScripts()
      toast.success('Script generated!')
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message)
    } finally {
      setAnyGenerating(false)
    }
  }

  async function handleUpdateScript(scriptId: string, fields: UpdateScriptData) {
    await updateScript(scriptId, fields)
  }

  async function handleGenerateVoiceover(scriptId: string, text: string) {
    const voiceId = settings.elevenLabsVoiceId
    if (!voiceId) { toast.error('Pick a voice in Settings first'); return }
    if (!text.trim()) { toast.error('Voiceover script is empty'); return }
    try {
      await generateVoiceover(scriptId, text, voiceId)
      refetchScripts()
      toast.success('Voiceover generated!')
    } catch (e) {
      toast.error('Failed: ' + (e as Error).message)
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 overflow-y-auto flex flex-col">
          {/* Project details */}
          {project && (
            <div className="px-4 pt-5 pb-2 border-b border-zinc-800">
              <ProjectDetailsSection
                project={project as Parameters<typeof ProjectDetailsSection>[0]['project']}
                onUpdate={updateProject}
              />
            </div>
          )}

          {/* Assets */}
          <div className="px-4 py-4 border-b border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Assets</p>
            <AssetGallery projectId={id!} />
          </div>

          {/* Brief summary */}
          <div className="px-4 py-4 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Brief</p>
            <BriefViewer projectId={id!} />
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-8 pb-28">

          {/* Step 1: Story Direction */}
          <section>
            <SectionLabel step={1} label="Story Direction" />
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden" style={{ minHeight: 200 }}>
              <StoryDirections
                directions={directions}
                loading={dirLoading}
                hasBrief={hasBrief}
                generatingLock={anyGenerating}
                onSelect={selectDirection}
                onGenerate={handleGenerateDirections}
              />
            </div>
          </section>

          {/* Step 2: Hook (only shown once a direction exists) */}
          {(directions && directions.length > 0) && (
            <section>
              <SectionLabel step={2} label="Hook" />
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden" style={{ minHeight: 160 }}>
                <HooksPanel
                  hooks={hooks}
                  loading={hookLoading}
                  selectedDirectionId={selectedDirection?.id}
                  generatingLock={anyGenerating}
                  onSelect={selectHook}
                  onGenerate={handleGenerateHooks}
                />
              </div>
            </section>
          )}

          {/* Step 3: Script */}
          {selectedDirection && (
            <section>
              <SectionLabel step={3} label="Script" />
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden" style={{ minHeight: 280 }}>
                <ScriptEditor
                  scripts={scripts}
                  loading={scriptLoading}
                  hasSelectedHook={Boolean(selectedHook)}
                  generatingLock={anyGenerating}
                  onSelectScript={selectScript}
                  onUpdateScript={handleUpdateScript}
                  onGenerate={handleGenerateScript}
                  onGenerateVoiceover={handleGenerateVoiceover}
                />
              </div>
            </section>
          )}

          {/* Empty state if no directions yet */}
          {!anyGenerating && !dirLoading && (!directions || directions.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
              </div>
              <p className="text-zinc-300 font-medium mb-1">Ready to craft your story</p>
              <p className="text-zinc-600 text-sm max-w-xs">
                {hasBrief
                  ? 'Hit "Generate Directions" above to explore narrative angles.'
                  : 'Generate a product brief in the left panel, then come back to create story directions.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────── */}
      {selectedScript && (
        <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur px-8 py-4 flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            Script ready — move on to build your storyboard
          </p>
          <Button
            onClick={() => navigate(`/projects/${id}/storyboard`)}
            className="bg-violet-600 hover:bg-violet-500 text-white gap-2 px-5"
          >
            Next: Storyboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
