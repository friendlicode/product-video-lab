import { validateStoryCompleteness, NARRATIVE_ROLES } from '@/lib/utils'
import { ROLE_CONFIG } from '@/lib/projectConstants'
import type { NarrativeRole } from '@/types/index'

interface Props {
  narrativeStructure: Record<string, string> | null
  scenes?: Array<{ narrative_role: NarrativeRole }>
}

export function StoryArcHealth({ narrativeStructure, scenes }: Props) {
  const validation = validateStoryCompleteness(narrativeStructure, scenes)
  const presentCount = NARRATIVE_ROLES.filter((r) => validation.coverage[r].present).length

  return (
    <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 space-y-2.5">
      {/* Role bars */}
      <div className="flex gap-1">
        {NARRATIVE_ROLES.map((role) => {
          const cfg = ROLE_CONFIG[role]
          const present = validation.coverage[role].present
          return (
            <div key={role} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  present ? cfg.bg : 'bg-zinc-800'
                }`}
              />
              <span
                className={`text-center leading-none ${
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

      {/* Summary */}
      <div className="flex items-center gap-2">
        {validation.isComplete ? (
          <span className="text-xs text-green-400 font-medium">Story complete</span>
        ) : (
          <>
            <span className="text-xs text-zinc-500">
              Story coverage:{' '}
              <span className={presentCount >= 4 ? 'text-zinc-300' : 'text-zinc-500'}>
                {presentCount}/6 roles
              </span>
            </span>
            {validation.warnings.length > 0 && (
              <span className="text-xs text-amber-600">{validation.warnings[0]}</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
