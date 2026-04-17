import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
      'Add them to your .env.local file.'
  )
}

// Workaround for Supabase auth navigator.locks bug.
// The browser's navigator.locks API can get into a state where lock requests
// steal from each other, breaking the entire auth session. We replace the
// locking mechanism with a simple in-memory queue that never touches
// navigator.locks. This is safe for a single-user internal tool.
const _locks: Record<string, Promise<unknown>> = {}

function memoryLock(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<unknown>
): Promise<unknown> {
  const prev = _locks[name] ?? Promise.resolve()
  const next = prev.then(() => fn()).catch(() => fn())
  _locks[name] = next.then(
    () => { delete _locks[name] },
    () => { delete _locks[name] }
  )
  return next
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'placeholder',
  {
    auth: {
      lock: memoryLock,
    },
  }
)
