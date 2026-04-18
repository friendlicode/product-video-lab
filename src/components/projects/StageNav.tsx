/**
 * StageNav — horizontal 3-step progress bar for the project pipeline.
 * Shown below the project header in ProjectDetail layout.
 * Steps: Script → Storyboard → Render
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'

interface Step {
  key: string
  label: string
  path: string
}

const STEPS: Step[] = [
  { key: 'script',      label: 'Script',      path: 'script' },
  { key: 'storyboard',  label: 'Storyboard',  path: 'storyboard' },
  { key: 'render',      label: 'Render',      path: 'render' },
]

interface Props {
  projectId: string
  /** Index (0-based) of the last completed step — optional, for future use */
  completedUpTo?: number
}

export function StageNav({ projectId, completedUpTo = -1 }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Determine active step from the URL
  const activeIndex = STEPS.findIndex((s) => pathname.includes(`/${s.path}`))

  return (
    <div className="shrink-0 flex items-center justify-center gap-0 px-8 py-3 border-b border-zinc-800 bg-zinc-950">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex
        const isComplete = i <= completedUpTo

        return (
          <div key={step.key} className="flex items-center">
            {/* Step */}
            <button
              onClick={() => navigate(`/projects/${projectId}/${step.path}`)}
              className="flex items-center gap-2.5 group"
            >
              {/* Circle */}
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                  transition-all duration-200 shrink-0
                  ${isActive
                    ? 'bg-violet-600 text-white ring-4 ring-violet-600/20'
                    : isComplete
                    ? 'bg-zinc-700 text-zinc-300'
                    : 'bg-zinc-800 border border-zinc-700 text-zinc-600 group-hover:border-zinc-500 group-hover:text-zinc-400'
                  }
                `}
              >
                {isComplete ? <Check size={11} strokeWidth={2.5} /> : i + 1}
              </div>

              {/* Label */}
              <span
                className={`
                  text-sm font-medium transition-colors
                  ${isActive
                    ? 'text-zinc-100'
                    : isComplete
                    ? 'text-zinc-400'
                    : 'text-zinc-600 group-hover:text-zinc-400'
                  }
                `}
              >
                {step.label}
              </span>
            </button>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={`
                  mx-4 h-px w-16
                  ${i < activeIndex ? 'bg-violet-600/40' : 'bg-zinc-800'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
