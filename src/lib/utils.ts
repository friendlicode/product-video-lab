import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { NarrativeRole, StoryValidation } from '@/types/index'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const NARRATIVE_ROLES: NarrativeRole[] = [
  'hook', 'problem', 'shift', 'proof', 'payoff', 'cta',
]

export function validateStoryCompleteness(
  narrativeStructure: Record<string, string> | null,
  scenes?: Array<{ narrative_role: NarrativeRole }>
): StoryValidation {
  const coverage = {} as StoryValidation['coverage']

  for (const role of NARRATIVE_ROLES) {
    let present = false
    if (scenes && scenes.length > 0) {
      present = scenes.some((s) => s.narrative_role === role)
    } else if (narrativeStructure) {
      const text = narrativeStructure[role]
      present = Boolean(text && text.trim().length > 0)
    }
    coverage[role] = { present, strength: present ? 'strong' : 'missing' }
  }

  const missing = NARRATIVE_ROLES.filter((r) => !coverage[r].present)

  return {
    isComplete: missing.length === 0,
    coverage,
    warnings: missing.length > 0 ? [`Missing: ${missing.join(', ')}`] : [],
  }
}
