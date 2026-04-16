import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RotateCcw, Plus, ChevronDown, ShieldCheck } from 'lucide-react'
import { useApprovals } from '@/hooks/useApprovals'
import { useAuthContext } from '@/contexts/AuthContext'
import { relativeTime } from '@/lib/time'
import type { DbApproval } from '@/types/db'
import type { ApprovalStatus } from '@/types/index'
import { Button } from '@/components/ui/button'

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; classes: string }> = {
  pending:            { label: 'Pending',          classes: 'bg-yellow-950 text-yellow-300 border-yellow-800' },
  approved:           { label: 'Approved',         classes: 'bg-green-950 text-green-300 border-green-800' },
  rejected:           { label: 'Rejected',         classes: 'bg-red-950 text-red-300 border-red-800' },
  revision_requested: { label: 'Revision Needed',  classes: 'bg-orange-950 text-orange-300 border-orange-800' },
}

interface ApprovalCardProps {
  approval: DbApproval
  onUpdate: (id: string, status: ApprovalStatus, notes?: string) => Promise<void>
}

function ApprovalCard({ approval, onUpdate }: ApprovalCardProps) {
  const [notes, setNotes] = useState(approval.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const status = STATUS_CONFIG[approval.status]

  async function handleAction(newStatus: ApprovalStatus) {
    setBusy(true)
    try {
      await onUpdate(approval.id, newStatus, notes.trim() || undefined)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-300 capitalize">
          {approval.version_type.replace(/_/g, ' ')}
        </span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded border shrink-0 ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <p className="text-xs text-zinc-600">{relativeTime(approval.created_at)}</p>

      {approval.notes && approval.status !== 'pending' && (
        <p className="text-xs text-zinc-400 italic leading-relaxed">{approval.notes}</p>
      )}

      {approval.status === 'pending' && (
        <div className="space-y-2 pt-1">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showNotes ? 'rotate-180' : ''}`}
            />
            {showNotes ? 'Hide' : 'Add'} notes
          </button>

          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reviewer notes..."
              className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-300 placeholder-zinc-600 resize-none h-16 focus:outline-none focus:border-zinc-500"
            />
          )}

          <div className="flex gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handleAction('approved')}
              className="h-6 text-xs text-green-400 hover:text-green-300 hover:bg-green-950 gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handleAction('revision_requested')}
              className="h-6 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-950 gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Revision
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => handleAction('rejected')}
              className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-950 gap-1"
            >
              <XCircle className="w-3 h-3" />
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  projectId: string
  selectedScriptId: string | null
  selectedStoryboardVersionId: string | null
}

export function ApprovalPanel({ projectId, selectedScriptId, selectedStoryboardVersionId }: Props) {
  const { data: approvals, loading, create, update } = useApprovals(projectId)
  const { user } = useAuthContext()
  const [requesting, setRequesting] = useState(false)

  async function handleRequestApproval() {
    if (!user) return

    // Prefer storyboard version approval, fall back to script
    const versionType = selectedStoryboardVersionId ? 'storyboard' : selectedScriptId ? 'script' : null
    const versionId = selectedStoryboardVersionId ?? selectedScriptId ?? null

    if (!versionType || !versionId) {
      toast.error('Select a script or storyboard version first')
      return
    }

    setRequesting(true)
    try {
      await create(versionType, versionId, user.id)
      toast.success('Approval requested')
    } catch (e) {
      toast.error('Failed to request approval: ' + (e as Error).message)
    } finally {
      setRequesting(false)
    }
  }

  async function handleUpdate(id: string, status: ApprovalStatus, notes?: string) {
    try {
      await update(id, status, notes)
      const verb =
        status === 'approved' ? 'Approved'
        : status === 'rejected' ? 'Rejected'
        : 'Updated'
      toast.success(verb)
    } catch (e) {
      toast.error('Failed to update approval: ' + (e as Error).message)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Approvals</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRequestApproval}
          disabled={requesting || !user}
          className="h-6 text-xs text-zinc-500 hover:text-zinc-300 gap-1"
        >
          <Plus className="w-3 h-3" />
          Request
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !approvals?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="w-7 h-7 text-zinc-700 mb-2" strokeWidth={1.25} />
            <p className="text-xs text-zinc-500 font-medium">No approvals yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Select a script or storyboard, then request approval
            </p>
          </div>
        ) : (
          approvals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} onUpdate={handleUpdate} />
          ))
        )}
      </div>
    </div>
  )
}
