import { useRef, useState, useCallback } from 'react'
import { Upload, Video, Image as ImageIcon, Trash2, GripVertical, Plus } from 'lucide-react'
import { useProjectAssets } from '@/hooks/useProjectAssets'
import type { AssetType } from '@/types/index'
import type { DbProjectAsset } from '@/types/db'
import { ASSET_TYPE_CONFIG, ASSET_TYPE_OPTIONS } from '@/lib/projectConstants'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isImage(asset: DbProjectAsset): boolean {
  return asset.mime_type?.startsWith('image/') ?? false
}

// ─── Asset thumbnail ───────────────────────────────────────────────────────────

function AssetThumbnail({
  asset,
  dragging,
  dragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onClick,
  onDelete,
}: {
  asset: DbProjectAsset
  dragging: boolean
  dragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  onDelete: () => void
}) {
  const cfg = ASSET_TYPE_CONFIG[asset.asset_type]
  const img = isImage(asset)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={`relative group rounded-md overflow-hidden border cursor-grab active:cursor-grabbing transition-all ${
        dragOver
          ? 'border-zinc-500 ring-1 ring-zinc-500 scale-105'
          : dragging
          ? 'border-zinc-700 opacity-40'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Thumbnail */}
      <div
        className="aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden"
        onClick={onClick}
      >
        {img ? (
          <img
            src={asset.file_url}
            alt={asset.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Video className="w-6 h-6 text-zinc-600" strokeWidth={1.5} />
        )}
      </div>

      {/* Info */}
      <div className="p-2 bg-zinc-900">
        <p className="text-xs text-zinc-400 truncate leading-tight">{asset.file_name}</p>
        <div className="flex items-center justify-between mt-1">
          <span
            className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border font-medium ${cfg.classes}`}
            style={{ fontSize: '10px' }}
          >
            {cfg.label}
          </span>
          {asset.file_size && (
            <span className="text-zinc-600" style={{ fontSize: '10px' }}>
              {formatBytes(asset.file_size)}
            </span>
          )}
        </div>
      </div>

      {/* Drag handle */}
      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-zinc-400 drop-shadow-md" />
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950/80 rounded p-0.5 text-zinc-400 hover:text-red-400"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  asset,
  onClose,
}: {
  asset: DbProjectAsset | null
  onClose: () => void
}) {
  if (!asset) return null
  const img = isImage(asset)
  const cfg = ASSET_TYPE_CONFIG[asset.asset_type]

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-zinc-800">
          <DialogTitle className="text-sm text-zinc-200 font-medium truncate">
            {asset.file_name}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-zinc-900 flex items-center justify-center min-h-64 max-h-[70vh] overflow-hidden">
          {img ? (
            <img
              src={asset.file_url}
              alt={asset.file_name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <Video className="w-10 h-10 text-zinc-600" strokeWidth={1.25} />
              <a
                href={asset.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
              >
                Open video in new tab
              </a>
            </div>
          )}
        </div>

        <div className="px-4 py-3 flex items-center gap-3 border-t border-zinc-800">
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${cfg.classes}`}>
            {cfg.label}
          </span>
          {asset.file_size && (
            <span className="text-xs text-zinc-600">{formatBytes(asset.file_size)}</span>
          )}
          {asset.width && asset.height && (
            <span className="text-xs text-zinc-600">{asset.width} x {asset.height}px</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete confirmation ────────────────────────────────────────────────────────

function DeleteConfirm({
  asset,
  onConfirm,
  onCancel,
}: {
  asset: DbProjectAsset | null
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!asset) return null
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-sm text-zinc-200">Delete asset?</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-zinc-400 mt-1">
          <span className="font-medium text-zinc-300">{asset.file_name}</span> will be permanently deleted from storage.
        </p>
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-zinc-400">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className="bg-red-900 hover:bg-red-800 text-red-100"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AssetGallery({ projectId }: { projectId: string }) {
  const { data: assets, loading, upload, remove, reorder } = useProjectAssets(projectId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<AssetType>('screenshot')
  const [dragActive, setDragActive] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [previewAsset, setPreviewAsset] = useState<DbProjectAsset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DbProjectAsset | null>(null)
  const [sectionOpen, setSectionOpen] = useState(true)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          await upload(file, uploadType)
        }
      } finally {
        setUploading(false)
      }
    },
    [upload, uploadType]
  )

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleItemDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    if (dragIndex === null || dragIndex === dropIdx || !assets) return
    const newOrder = [...assets]
    const [moved] = newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIdx, 0, moved)
    reorder(newOrder.map((a) => a.id))
    setDragIndex(null)
    setDragOverIndex(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="border-b border-zinc-800">
      {/* Header */}
      <button
        onClick={() => setSectionOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          Assets
          {assets?.length ? (
            <span className="ml-1.5 text-zinc-600 font-normal normal-case">
              ({assets.length})
            </span>
          ) : null}
        </span>
        <span className="text-zinc-500 text-xs">{sectionOpen ? '-' : '+'}</span>
      </button>

      {sectionOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Upload controls */}
          <div className="flex items-center gap-2">
            <Select value={uploadType} onValueChange={(v) => setUploadType(v as AssetType)}>
              <SelectTrigger className="h-7 flex-1 text-xs bg-zinc-900 border-zinc-700 text-zinc-400 focus:ring-zinc-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {ASSET_TYPE_OPTIONS.map((o) => (
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

            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-7 text-xs border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 gap-1.5"
            >
              {uploading ? (
                <>
                  <div className="w-3 h-3 border border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                  Uploading
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3" />
                  Upload
                </>
              )}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-md border-2 border-dashed text-center py-4 transition-colors cursor-pointer ${
              dragActive
                ? 'border-zinc-500 bg-zinc-800/40'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="w-4 h-4 text-zinc-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-600">
              {dragActive ? 'Drop to upload' : 'Drag and drop files here'}
            </p>
          </div>

          {/* Asset grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-zinc-800 rounded-md animate-pulse" />
              ))}
            </div>
          ) : !assets?.length ? (
            <div className="py-6 text-center">
              <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" strokeWidth={1.25} />
              <p className="text-xs text-zinc-600">
                Upload screenshots and demo clips to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {assets.map((asset, i) => (
                <AssetThumbnail
                  key={asset.id}
                  asset={asset}
                  dragging={dragIndex === i}
                  dragOver={dragOverIndex === i}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i) }}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                  onDrop={(e) => handleItemDrop(e, i)}
                  onClick={() => setPreviewAsset(asset)}
                  onDelete={() => setDeleteTarget(asset)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <PreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
      <DeleteConfirm
        asset={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
