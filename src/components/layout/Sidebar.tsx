import {
  useSelector,
  useProjectActions,
  selectProjects,
  selectActiveProjectId,
} from '@/store'
import { useAllProjectsCosts } from '@/hooks/useCostCalculation'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const projects = useSelector(selectProjects)
  const activeProjectId = useSelector(selectActiveProjectId)
  const { setActiveProject, createProject } = useProjectActions()
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
    <div className="h-full bg-[#13172e] w-80 flex flex-col">
      {/* Header de la sidebar */}
      <div className="px-5 py-[1.8rem] border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Projets
          </h2>
          <span className="text-xs text-white/50 tabular-nums">
            {projects.length} projet{projects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Liste des projets */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {projects.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto mb-5 bg-white/5 border border-white/10 flex items-center justify-center">
              <Icons.Folder className="w-7 h-7 text-white/40" />
            </div>
            <p className="font-medium text-white/80 text-sm">Aucun projet</p>
            <p className="text-xs mt-2 text-white/50 leading-relaxed">
              Créez votre premier projet pour estimer vos coûts
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {projects.map(project => {
              const cost = projectCosts.get(project.id)
              const isActive = project.id === activeProjectId

              return (
                <li key={project.id}>
                  <button
                    className={`
                      group relative w-full text-left px-3 py-2.5 cursor-pointer
                      transition-all duration-150 ease-out
                      ${isActive
                        ? 'bg-[#5754aa] border-l-2 border-l-white'
                        : 'border-l-2 border-l-transparent hover:bg-white/5 hover:border-l-white/30'
                      }
                    `}
                    onClick={() => handleSelectProject(project.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Icons.Folder
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                          }`}
                        />
                        <span
                          className={`truncate text-sm transition-colors ${
                            isActive
                              ? 'text-white font-medium'
                              : 'text-white/70 group-hover:text-white/90'
                          }`}
                        >
                          {project.name}
                        </span>
                      </div>
                      <span
                        className={`
                          text-xs tabular-nums font-medium flex-shrink-0 px-2 py-0.5
                          transition-colors
                          ${isActive
                            ? 'text-white bg-white/20'
                            : 'text-white/50 group-hover:text-white/70'
                          }
                        `}
                      >
                        {cost ? formatPrice(cost.totalMonthlyCost) : '...'}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Bouton nouveau projet */}
      <div className="px-3 pb-3">
        <button
          className="
            w-full flex items-center justify-center gap-2 cursor-pointer
            px-4 py-2.5 text-sm font-medium
            bg-[#5754aa] hover:bg-[#6563b8] active:bg-[#4a4899]
            text-white transition-colors duration-150
          "
          onClick={handleCreateProject}
          aria-label="Créer un nouveau projet"
        >
          <Icons.Plus className="w-4 h-4" />
          Nouveau projet
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <p className="text-xs text-white/50">Sauvegarde locale active</p>
      </div>
    </div>
  )
}
