import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { DbUser } from '@/types/db'

type AuthContextValue = {
  user: User | null
  session: Session | null
  dbUser: DbUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchDbUser(authUser: User): Promise<DbUser | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()
  return data ?? null
}

async function ensureDbUser(authUser: User): Promise<void> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single()

  if (!data) {
    await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email ?? '',
      name:
        (authUser.user_metadata?.full_name as string | undefined) ??
        authUser.email?.split('@')[0] ??
        null,
      role: 'editor',
    })
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const authUser = data.session?.user ?? null
      setSession(data.session)
      setUser(authUser)
      if (authUser) {
        const db = await fetchDbUser(authUser)
        setDbUser(db)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const authUser = newSession?.user ?? null
      setSession(newSession)
      setUser(authUser)
      if (authUser) {
        const db = await fetchDbUser(authUser)
        setDbUser(db)
      } else {
        setDbUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      await ensureDbUser(data.user)
      const db = await fetchDbUser(data.user)
      setDbUser(db)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setDbUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, dbUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
