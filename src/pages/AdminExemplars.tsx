import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Star } from 'lucide-react'
import {
  getExemplars,
  toggleExemplarActive,
  updateExemplar,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
  type DbVideoExemplar,
  type ExemplarCategory,
} from '@/services/exemplars'
import { useAuthContext } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── JSON viewer ─────────────────────────────────────────────────────────────
function JsonSection({ label, data }: { label: string; data: unknown }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-zinc-800 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800/40 transition-colors"
      >
        <span className="font-medium text-zinc-300">{label}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <pre className="px-3 pb-3 text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap leading-relaxed bg-zinc-900/60">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Exemplar detail drawer ──────────────────────────────────────────────────
function ExemplarDetail({
  exemplar,
  onClose,
  onUpdated,
}: {
  exemplar: DbVideoExemplar
  onClose: () => void
  onUpdated: (updated: DbVideoExemplar) => void
}) {
  const [editingUrl, setEditingUrl] = useState(false)
  const [urlDraft, setUrlDraft] = useState(exemplar.url)
  const [saving, setSaving] = useState(false)

  async function saveUrl() {
    if (urlDraft === exemplar.url) { setEditingUrl(false); return }
    setSaving(true)
    try {
      const updated = await updateExemplar(exemplar.id, { url: urlDraft })
      onUpdated(updated)
      toast.success('URL updated')
      setEditingUrl(false)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />
      {/* Panel */}
      <div className="w-[520px] h-full bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">{exemplar.brand}</p>
            <h2 className="text-sm font-semibold text-zinc-100 leading-tight">{exemplar.title}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                {CATEGORY_LABELS[exemplar.product_category]}
              </span>
              <span className="text-xs text-zinc-600">{exemplar.duration_seconds}s</span>
              <span className="text-xs text-zinc-600">{exemplar.aspect_ratio}</span>
              {exemplar.quality_score && (
                <span className="flex items-center gap-0.5 text-xs text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  {exemplar.quality_score}/10
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-lg leading-none mt-0.5">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* URL */}
          <div>
            <p className="text-xs text-zinc-500 mb-1.5 font-medium">Reference URL</p>
            {editingUrl ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveUrl()}
                  autoFocus
                />
                <button
                  onClick={saveUrl}
                  disabled={saving}
                  className="px-3 py-1.5 bg-zinc-700 text-zinc-200 text-xs rounded hover:bg-zinc-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setUrlDraft(exemplar.url); setEditingUrl(false) }}
                  className="px-2 py-1.5 text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href={exemplar.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{exemplar.url}</span>
                </a>
                <button
                  onClick={() => setEditingUrl(true)}
                  className="shrink-0 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  edit
                </button>
              </div>
            )}
          </div>

          {/* Hook pattern */}
          {exemplar.hook_pattern && (
            <div>
              <p className="text-xs text-zinc-500 mb-1.5 font-medium">Hook Pattern</p>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 rounded p-3 border border-zinc-800">
                {exemplar.hook_pattern}
              </p>
            </div>
          )}

          {/* Key techniques */}
          {exemplar.key_techniques.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-1.5 font-medium">Key Techniques</p>
              <div className="flex flex-wrap gap-1.5">
                {exemplar.key_techniques.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Curator notes */}
          {exemplar.curator_notes && (
            <div>
              <p className="text-xs text-zinc-500 mb-1.5 font-medium">Curator Notes</p>
              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/60 rounded p-3 border border-zinc-800">
                {exemplar.curator_notes}
              </p>
            </div>
          )}

          {/* JSON sections */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Deep Annotations (injected into AI prompts)</p>
            <JsonSection label="Narrative Structure" data={exemplar.narrative_structure} />
            <JsonSection label="Pacing Curve" data={exemplar.pacing_curve} />
            <JsonSection label="Music Strategy" data={exemplar.music_strategy} />
            <JsonSection label="Visual Language" data={exemplar.visual_language} />
            <JsonSection label="Caption Style" data={exemplar.caption_style} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AdminExemplars() {
  const { dbUser } = useAuthContext()
  const [exemplars, setExemplars] = useState<DbVideoExemplar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<ExemplarCategory | 'all'>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [selected, setSelected] = useState<DbVideoExemplar | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getExemplars({ activeOnly: false })
      setExemplars(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(exemplar: DbVideoExemplar) {
    try {
      await toggleExemplarActive(exemplar.id, !exemplar.is_active)
      setExemplars((prev) =>
        prev.map((e) => (e.id === exemplar.id ? { ...e, is_active: !e.is_active } : e))
      )
      toast.success(exemplar.is_active ? 'Exemplar deactivated' : 'Exemplar activated')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  function handleUpdated(updated: DbVideoExemplar) {
    setExemplars((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setSelected(updated)
  }

  if (dbUser?.role !== 'admin') {
    return (
      <div className="p-6 text-zinc-500 text-sm">
        Admin access required to manage the exemplar library.
      </div>
    )
  }

  const filtered = exemplars
    .filter((e) => showInactive || e.is_active)
    .filter((e) => categoryFilter === 'all' || e.product_category === categoryFilter)

  const categoryCounts = exemplars.reduce<Record<string, number>>((acc, e) => {
    if (showInactive || e.is_active) acc[e.product_category] = (acc[e.product_category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Exemplar Library</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {exemplars.filter((e) => e.is_active).length} active reference videos · injected into AI generation prompts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-zinc-500"
            />
            Show inactive
          </label>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn(
            'text-xs px-3 py-1 rounded-full border transition-colors',
            categoryFilter === 'all'
              ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
              : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
          )}
        >
          All ({filtered.length})
        </button>
        {ALL_CATEGORIES.filter((c) => categoryCounts[c]).map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-colors',
              categoryFilter === c
                ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
            )}
          >
            {CATEGORY_LABELS[c]} ({categoryCounts[c]})
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm p-4 bg-red-950/30 border border-red-900 rounded-lg">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500 text-sm">No exemplars found.</div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-zinc-800/60">
              <tr>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium w-8" />
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Brand / Title</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Category</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Duration</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Score</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Techniques</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((ex) => (
                <tr
                  key={ex.id}
                  className={cn(
                    'hover:bg-zinc-800/30 transition-colors cursor-pointer',
                    !ex.is_active && 'opacity-40'
                  )}
                  onClick={() => setSelected(ex)}
                >
                  <td className="px-4 py-3">
                    <a
                      href={ex.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-600 hover:text-teal-400 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-200 font-medium">{ex.brand}</p>
                    <p className="text-zinc-500 truncate max-w-xs">{ex.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">
                      {CATEGORY_LABELS[ex.product_category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{ex.duration_seconds}s · {ex.aspect_ratio}</td>
                  <td className="px-4 py-3">
                    {ex.quality_score && (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        {ex.quality_score}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {ex.key_techniques.slice(0, 3).map((t) => (
                        <span key={t} className="bg-zinc-800/80 text-zinc-500 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {ex.key_techniques.length > 3 && (
                        <span className="text-zinc-600 text-[10px]">+{ex.key_techniques.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(ex)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      title={ex.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {ex.is_active
                        ? <ToggleRight className="w-4 h-4 text-teal-400" />
                        : <ToggleLeft className="w-4 h-4" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <ExemplarDetail
          exemplar={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
