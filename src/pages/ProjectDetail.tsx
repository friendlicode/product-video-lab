import { useParams } from 'react-router-dom'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-100">Project</h1>
      <p className="mt-2 text-sm text-zinc-400">Project ID: {id}</p>
    </div>
  )
}
