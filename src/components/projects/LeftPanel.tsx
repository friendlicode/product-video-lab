import type { DbProjectWithCounts } from '@/types/db'
import type { UpdateProjectData } from '@/services/projects'
import { ProjectDetailsSection } from './ProjectDetailsSection'
import { AssetGallery } from './AssetGallery'
import { BriefViewer } from './BriefViewer'

export function LeftPanel({
  projectId,
  project,
  onProjectUpdate,
}: {
  projectId: string
  project: DbProjectWithCounts
  onProjectUpdate: () => void
}) {
  async function handleUpdate(fields: UpdateProjectData) {
    const { updateProject } = await import('@/services/projects')
    await updateProject(projectId, fields)
    onProjectUpdate()
  }

  return (
    <div className="flex flex-col">
      <ProjectDetailsSection project={project} onUpdate={handleUpdate} />
      <AssetGallery projectId={projectId} />
      <BriefViewer projectId={projectId} />
    </div>
  )
}
