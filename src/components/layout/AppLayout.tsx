import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { Sidebar } from './Sidebar'

function NetworkBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-950 border-b border-red-800 text-red-300 text-xs shrink-0">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      No internet connection — changes may not save
    </div>
  )
}

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900 text-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <NetworkBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
