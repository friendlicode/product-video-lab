import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  PlusCircle,
  Film,
  Settings,
  Clapperboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Projects', icon: LayoutGrid, end: true },
  { to: '/projects/new', label: 'New Project', icon: PlusCircle, end: true },
  { to: '/render-queue', label: 'Render Queue', icon: Film, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function Sidebar() {
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

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">v0.1.0 -- internal</p>
      </div>
    </aside>
  )
}
