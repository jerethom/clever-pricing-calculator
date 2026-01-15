import { memo, useCallback } from 'react'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'
import type { Project, ProjectCostSummary } from '@/types'

interface ProjectItemProps {
  project: Project
  cost: ProjectCostSummary | undefined
  onSelect: (projectId: string) => void
}

const ProjectItem = memo(function ProjectItem({
  project,
  cost,
  onSelect,
}: ProjectItemProps) {
  const handleClick = useCallback(() => {
    onSelect(project.id)
  }, [onSelect, project.id])

  const runtimesCount = project.runtimes.length
  const addonsCount = project.addons.length

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left card bg-base-100 border border-base-300 hover:border-primary/50 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 cursor-pointer"
      aria-label={`Ouvrir le projet ${project.name}`}
    >
      <div className="card-body p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Info projet */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icons.Folder className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                {project.name}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-base-content/60 flex items-center gap-1">
                  <Icons.Server className="w-3 h-3" />
                  {runtimesCount} runtime{runtimesCount !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-base-content/60 flex items-center gap-1">
                  <Icons.Puzzle className="w-3 h-3" />
                  {addonsCount} addon{addonsCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Cout et fleche */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="font-bold text-primary tabular-nums">
                {cost ? formatPrice(cost.totalMonthlyCost) : '...'}
              </p>
              <p className="text-xs text-base-content/50">/mois</p>
            </div>
            <Icons.ChevronRight className="w-5 h-5 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </button>
  )
})

interface OrganizationProjectListProps {
  projects: Project[]
  projectCosts: Map<string, ProjectCostSummary>
  onSelectProject: (projectId: string) => void
  onCreateProject: () => void
}

export const OrganizationProjectList = memo(function OrganizationProjectList({
  projects,
  projectCosts,
  onSelectProject,
  onCreateProject,
}: OrganizationProjectListProps) {
  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Liste des projets"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Icons.Folder className="w-4 h-4 text-primary" />
          Projets
          <span className="badge badge-primary badge-sm">{projects.length}</span>
        </h3>
        <button
          type="button"
          onClick={onCreateProject}
          className="btn btn-primary btn-sm gap-2"
          aria-label="Creer un nouveau projet"
        >
          <Icons.Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau projet</span>
        </button>
      </div>

      {/* Liste des projets */}
      {projects.length > 0 ? (
        <div className="grid gap-3">
          {projects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              cost={projectCosts.get(project.id)}
              onSelect={onSelectProject}
            />
          ))}
        </div>
      ) : (
        <div className="card bg-base-100 border border-base-300 border-dashed">
          <div className="card-body items-center text-center py-12">
            <div className="bg-base-200 rounded-full p-4 mb-4">
              <Icons.Folder className="w-8 h-8 text-base-content/30" />
            </div>
            <h4 className="font-semibold">Aucun projet</h4>
            <p className="text-sm text-base-content/60 max-w-xs">
              Creez votre premier projet pour commencer a estimer vos couts cloud.
            </p>
            <button
              type="button"
              onClick={onCreateProject}
              className="btn btn-primary mt-4 gap-2"
              aria-label="Creer un nouveau projet"
            >
              <Icons.Plus className="w-4 h-4" />
              Creer un projet
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
