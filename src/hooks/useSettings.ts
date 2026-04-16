import { useState, useCallback } from 'react'
import { getSettings, saveSettings, DEFAULT_SETTINGS, type AppSettings } from '@/lib/settings'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings())

  const update = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS)
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return { settings, update, reset }
}
