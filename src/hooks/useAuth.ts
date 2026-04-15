import { useState, useEffect, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  error: Error | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Hydrate from current session
    supabase.auth.getSession().then(({ data, error: err }) => {
      if (err) setError(err)
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) throw err
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error: err } = await supabase.auth.signOut()
    if (err) throw err
  }, [])

  const getUser = useCallback(async () => {
    const { data, error: err } = await supabase.auth.getUser()
    if (err) throw err
    return data.user
  }, [])

  return { user, session, loading, error, signIn, signOut, getUser }
}
