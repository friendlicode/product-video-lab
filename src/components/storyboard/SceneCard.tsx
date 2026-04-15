import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Copy, Trash2, Image as ImageIcon } from 'lucide-react'
import type { DbStoryboardScene, DbProjectAsset } from '@/types/db'
import type { NarrativeRole, SceneType } from '@/types/index'
import type { UpdateSceneData } from '@/services/storyboards'
import { ROLE_CONFIG, SCENE_TYPE_OPTIONS, TRANSITION_OPTIONS } from '@/lib/projectConstants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NARRATIVE_ROLE_OPTIONS: { value: NarrativeRole; label: string }[] = [
  { value: 'hook', label: 'Hook' },
  { value: 'problem', label: 'Problem' },
  { value: 'shift', label: 'Shift' },
  { value: 'proof', label: 'Proof' },
  { value: 'payoff', label: 'Payoff' },
  { value: 'cta', label: 'CTA' },
]

const textareaCls =
  'w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 resize-none focus:outline-none focus:border-zinc-500 leading-relaxed placeholder:text-zinc-600'

const inputCls =
  'bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500'

interface Props {
  scene: DbStoryboardScene
  assets: DbProjectAsset[]
  isFirst: boolean
  isLast: boolean
  onUpdate: (sceneId: string, fields: UpdateSceneData) => Promise<unknown>
  onDelete: (sceneId: string) => Promise<void>
  onDuplicate: (sceneId: string) => Promise<void>
  onMoveUp: (sceneId: string) => void
  onMoveDown: (sceneId: string) => void
}

export function SceneCard({
  scene,
  assets,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: Props) {
  const roleCfg = ROLE_CONFIG[scene.narrative_role]

  // Local state - sync when scene ID changes (different scene)
  const [onScreenText, setOnScreenText] = useState(scene.on_screen_text ?? '')
  const [voiceoverLine, setVoiceoverLine] = useState(scene.voiceover_line ?? '')
  const [captionText, setCaptionText] = useState(scene.caption_text ?? '')
  const [motionType, setMotionType] = useState(scene.motion_type ?? '')
  const [duration, setDuration] = useState(scene.duration_seconds.toString())

  useEffect(() => {
    setOnScreenText(scene.on_screen_text ?? '')
    setVoiceoverLine(scene.voiceover_line ?? '')
    setCaptionText(scene.caption_text ?? '')
    setMotionType(scene.motion_type ?? '')
    setDuration(scene.duration_seconds.toString())
  }, [scene.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function save(fields: UpdateSceneData) {
    onUpdate(scene.id, fields).catch(console.error)
  }

  const linkedAsset = assets.find((a) => a.id === scene.asset_id)

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800">
        {/* Index */}
        <span className="text-xs font-mono text-zinc-600 w-5 shrink-0 text-center">
          {scene.scene_index + 1}
        </span>

        {/* Role */}
        <Select
          value={scene.narrative_role}
          onValueChange={(v) => save({ narrative_role: v as NarrativeRole })}
        >
          <SelectTrigger
            className={`h-6 w-24 text-xs border px-2 focus:ring-0 ${roleCfg.dim} ${roleCfg.text} ${roleCfg.border}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {NARRATIVE_ROLE_OPTIONS.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="text-xs text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Scene type */}
        <Select
          value={scene.scene_type}
          onValueChange={(v) => save({ scene_type: v as SceneType })}
        >
          <SelectTrigger className="h-6 flex-1 text-xs bg-zinc-800 border-zinc-700 text-zinc-400 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {SCENE_TYPE_OPTIONS.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="text-xs text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Duration */}
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onBlur={() => save({ duration_seconds: parseFloat(duration) || 3 })}
            min={1}
            max={60}
            step={0.5}
            className={`${inputCls} w-12`}
          />
          <span className="text-zinc-600 text-xs">s</span>
        </div>

        {/* Transition */}
        <Select
          value={scene.transition_type}
          onValueChange={(v) => save({ transition_type: v })}
        >
          <SelectTrigger className="h-6 w-20 text-xs bg-zinc-800 border-zinc-700 text-zinc-400 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {TRANSITION_OPTIONS.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="text-xs text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Move / action buttons */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            onClick={() => onMoveUp(scene.id)}
            disabled={isFirst}
            className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMoveDown(scene.id)}
            disabled={isLast}
            className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDuplicate(scene.id)}
            className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(scene.id)}
            className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        {/* Asset + motion row */}
        <div className="flex items-center gap-3">
          {/* Asset thumbnail */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-12 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
              {linkedAsset?.mime_type?.startsWith('image/') ? (
                <img
                  src={linkedAsset.file_url}
                  alt={linkedAsset.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
              )}
            </div>
            <Select
              value={scene.asset_id ?? '__none__'}
              onValueChange={(v) => save({ asset_id: v === '__none__' ? null : v })}
            >
              <SelectTrigger className="h-7 flex-1 text-xs bg-zinc-800 border-zinc-700 text-zinc-400 focus:ring-0">
                <SelectValue placeholder="No asset" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 max-h-48">
                <SelectItem value="__none__" className="text-xs text-zinc-500 focus:bg-zinc-800">
                  No asset
                </SelectItem>
                {assets.map((a) => (
                  <SelectItem
                    key={a.id}
                    value={a.id}
                    className="text-xs text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    {a.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motion type */}
          <div className="flex items-center gap-1.5 w-36 shrink-0">
            <span className="text-zinc-600 shrink-0" style={{ fontSize: '10px' }}>Motion</span>
            <input
              type="text"
              value={motionType}
              onChange={(e) => setMotionType(e.target.value)}
              onBlur={() => save({ motion_type: motionType || null })}
              placeholder="static"
              className={`${inputCls} flex-1`}
            />
          </div>
        </div>

        {/* On-screen text */}
        <div>
          <p className="text-zinc-600 mb-1" style={{ fontSize: '10px' }}>ON-SCREEN TEXT</p>
          <textarea
            value={onScreenText}
            onChange={(e) => setOnScreenText(e.target.value)}
            onBlur={() => save({ on_screen_text: onScreenText || null })}
            rows={2}
            placeholder="Text displayed on screen..."
            className={textareaCls}
          />
        </div>

        {/* Voiceover */}
        <div>
          <p className="text-zinc-600 mb-1" style={{ fontSize: '10px' }}>VOICEOVER</p>
          <textarea
            value={voiceoverLine}
            onChange={(e) => setVoiceoverLine(e.target.value)}
            onBlur={() => save({ voiceover_line: voiceoverLine || null })}
            rows={2}
            placeholder="Voiceover line..."
            className={textareaCls}
          />
        </div>

        {/* Caption */}
        <div>
          <p className="text-zinc-600 mb-1" style={{ fontSize: '10px' }}>CAPTION</p>
          <textarea
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            onBlur={() => save({ caption_text: captionText || null })}
            rows={1}
            placeholder="Caption text..."
            className={textareaCls}
          />
        </div>
      </div>
    </div>
  )
}
