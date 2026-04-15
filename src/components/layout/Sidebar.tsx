import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, Film, Settings, Clapperboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthContext } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Projects', icon: LayoutGrid, end: true },
  { to: '/render-queue', label: 'Render Queue', icon: Film, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function Sidebar() {
  const { user, dbUser, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const displayName = dbUser?.name ?? user?.email?.split('@')[0] ?? 'User'
  const displayEmail = user?.email ?? ''

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
        <Clapperboard className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-zinc-100 tracking-tight">
          Product Video Lab
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md group">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-zinc-300">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">{displayName}</p>
            <p className="text-xs text-zinc-600 truncate">{displayEmail}</p>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="shrink-0 p-1 text-zinc-600 hover:text-zinc-300 transition-colors rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
