import { validateStoryCompleteness, NARRATIVE_ROLES } from '@/lib/utils'
import { ROLE_CONFIG } from '@/lib/projectConstants'
import type { NarrativeRole } from '@/types/index'

interface Props {
  narrativeStructure: Record<string, string> | null
  scenes?: Array<{ narrative_role: NarrativeRole }>
}

const RING_RADIUS = 10
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function scoreColor(score: number): { stroke: string; text: string } {
  if (score === 100) return { stroke: '#4ade80', text: 'text-green-400' }
  if (score >= 67)   return { stroke: '#facc15', text: 'text-yellow-400' }
  if (score >= 33)   return { stroke: '#f97316', text: 'text-amber-500' }
  return               { stroke: '#ef4444',  text: 'text-red-500' }
}

export function StoryArcHealth({ narrativeStructure, scenes }: Props) {
  const validation = validateStoryCompleteness(narrativeStructure, scenes)
  const presentCount = NARRATIVE_ROLES.filter((r) => validation.coverage[r].present).length
  const score = Math.round((presentCount / NARRATIVE_ROLES.length) * 100)
  const { stroke, text: scoreText } = scoreColor(score)
  const ringDash = (score / 100) * RING_CIRCUMFERENCE

  return (
    <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800">
      <div className="flex items-center gap-3">
        {/* Story Score ring */}
        <div className="relative shrink-0 w-8 h-8" title={`Story score: ${score}%`}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r={RING_RADIUS} fill="none" stroke="#27272a" strokeWidth="3" />
            <circle
              cx="16"
              cy="16"
              r={RING_RADIUS}
              fill="none"
              stroke={stroke}
              strokeWidth="3"
              strokeDasharray={`${ringDash} ${RING_CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
              className="transition-all duration-500"
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center font-medium leading-none ${scoreText}`}
            style={{ fontSize: '7px' }}
          >
            {score}%
          </span>
        </div>

        {/* Role bars */}
        <div className="flex gap-1 flex-1">
          {NARRATIVE_ROLES.map((role) => {
            const cfg = ROLE_CONFIG[role]
            const present = validation.coverage[role].present
            return (
              <div key={role} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
                    present ? cfg.bg : 'bg-zinc-800'
                  }`}
                />
                <span
                  className={`text-center leading-none transition-colors duration-300 ${
                    present ? cfg.text : 'text-zinc-700'
                  }`}
                  style={{ fontSize: '9px' }}
                >
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Status label */}
        <div className="shrink-0 text-right">
          {validation.isComplete ? (
            <span className="text-xs text-green-400 font-medium">Complete</span>
          ) : (
            <span className="text-xs text-zinc-600">
              {presentCount}/{NARRATIVE_ROLES.length}
            </span>
          )}
        </div>
      </div>

      {/* Missing roles warning */}
      {!validation.isComplete && validation.warnings.length > 0 && (
        <p className="text-xs text-amber-600 mt-1.5 pl-11">
          {validation.warnings[0]}
        </p>
      )}
    </div>
  )
}
