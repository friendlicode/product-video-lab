import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProjectList } from '@/pages/ProjectList'
import { NewProject } from '@/pages/NewProject'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { RenderQueue } from '@/pages/RenderQueue'
import { Settings } from '@/pages/Settings'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ProjectList />} />
          <Route path="projects/new" element={<NewProject />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="render-queue" element={<RenderQueue />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
