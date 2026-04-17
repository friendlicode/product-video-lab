import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
      'Add them to your .env.local file.'
  )
}

// Workaround for Supabase auth "lock not released within 5000ms" bug.
// When the browser force-quits or a tab crashes, navigator.locks can leave
// orphaned locks that cause the app to hang on next load. Clearing stale
// lock metadata from localStorage before initializing prevents the hang.
try {
  const keys = Object.keys(localStorage)
  for (const key of keys) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token-code-verifier')) {
      localStorage.removeItem(key)
    }
  }
} catch {
  // localStorage unavailable (private browsing edge cases)
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'placeholder'
)
