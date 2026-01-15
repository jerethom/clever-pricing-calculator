import { useProjectStore } from '@/store/projectStore'
import { useAllProjectsCosts } from '@/hooks/useCostCalculation'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const projects = useProjectStore(state => state.projects)
  const activeProjectId = useProjectStore(state => state.activeProjectId)
  const setActiveProject = useProjectStore(state => state.setActiveProject)
  const createProject = useProjectStore(state => state.createProject)
  const projectCosts = useAllProjectsCosts()

  const handleCreateProject = () => {
    const name = `Projet ${projects.length + 1}`
    createProject(name)
    onClose?.()
  }

  const handleSelectProject = (projectId: string) => {
    setActiveProject(projectId)
    onClose?.()
  }

  return (
    <div className="h-full bg-base-200 w-80 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Icons.Folder className="w-5 h-5" />
          Projets
        </h2>
        <button
          className="btn btn-primary btn-sm gap-1"
          onClick={handleCreateProject}
          aria-label="Créer un nouveau projet"
        >
          <Icons.Plus className="w-4 h-4" />
          Nouveau
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-base-300 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Icons.Folder className="w-8 h-8 text-base-content/40" />
            </div>
            <p className="font-medium text-base-content/70">Aucun projet</p>
            <p className="text-sm mt-2 text-base-content/50">
              Créez votre premier projet pour commencer
            </p>
          </div>
        ) : (
          <ul className="menu menu-sm gap-1 p-0">
            {projects.map(project => {
              const cost = projectCosts.get(project.id)
              const isActive = project.id === activeProjectId

              return (
                <li key={project.id}>
                  <button
                    className={`flex justify-between w-full transition-all duration-200 rounded-lg ${
                      isActive
                        ? 'bg-primary text-primary-content font-semibold shadow-md hover:bg-primary'
                        : 'hover:bg-base-300'
                    }`}
                    onClick={() => handleSelectProject(project.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="truncate flex-1 text-left">{project.name}</span>
                    <span
                      className={`badge badge-sm ${
                        isActive ? 'badge-secondary' : 'badge-ghost'
                      }`}
                    >
                      {cost ? formatPrice(cost.totalMonthlyCost) : '...'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-base-300 text-xs text-base-content/50">
        <p>Données sauvegardées localement</p>
      </div>
    </div>
  )
}
