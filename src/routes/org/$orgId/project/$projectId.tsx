import { createFileRoute, Outlet, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { ProjectHeader, ProjectTabs } from '@/components/project'
import { Icons } from '@/components/ui'

const ProjectNotFound = () => (
  <div className="flex flex-col items-center justify-center h-96 text-center">
    <div className="bg-base-200 rounded-full p-6 mb-6">
      <Icons.Folder className="w-16 h-16 text-base-content/30" />
    </div>
    <h2 className="text-2xl font-bold mb-2">Projet non trouve</h2>
    <p className="text-base-content/70 max-w-md">
      Le projet que vous cherchez n'existe pas ou a ete supprime.
    </p>
  </div>
)

export const Route = createFileRoute('/org/$orgId/project/$projectId')({
  beforeLoad: ({ params: { orgId, projectId } }) => {
    const project = useProjectStore.getState().projects.find(p => p.id === projectId)
    if (!project || project.organizationId !== orgId) throw notFound()
  },
  component: function ProjectLayout() {
    const { orgId, projectId } = Route.useParams()
    const setActiveProject = useProjectStore(state => state.setActiveProject)
    const project = useProjectStore(state => state.projects.find(p => p.id === projectId))

    useEffect(() => {
      setActiveProject(projectId)
    }, [projectId, setActiveProject])

    if (!project) return <ProjectNotFound />

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <ProjectHeader project={project} />
        <ProjectTabs project={project} orgId={orgId} />
        <div className="mt-2">
          <Outlet />
        </div>
      </div>
    )
  },
  notFoundComponent: ProjectNotFound,
})
