import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { ProjectList } from '@/pages/ProjectList'
import { NewProject } from '@/pages/NewProject'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { RenderQueue } from '@/pages/RenderQueue'
import { Settings } from '@/pages/Settings'

function ProtectedRoute() {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'bg-zinc-900 border border-zinc-700 text-zinc-100',
            description: 'text-zinc-400',
            error: 'bg-zinc-900 border-red-800 text-zinc-100',
            success: 'bg-zinc-900 border-teal-800 text-zinc-100',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<ProjectList />} />
              <Route path="projects/new" element={<NewProject />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="render-queue" element={<RenderQueue />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
