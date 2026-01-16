import { memo, useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'
import type { Project, ProjectCostSummary } from '@/types'

type SortOption = 'name-asc' | 'cost-desc' | 'cost-asc'

interface CostBreakdownBarProps {
  runtimesCost: number
  addonsCost: number
  total: number
}

const CostBreakdownBar = memo(function CostBreakdownBar({
  runtimesCost,
  addonsCost,
  total,
}: CostBreakdownBarProps) {
  const runtimesPercent = total > 0 ? (runtimesCost / total) * 100 : 0
  const addonsPercent = total > 0 ? (addonsCost / total) * 100 : 0

  if (total === 0) {
    return (
      <div className="h-1.5 bg-base-200 rounded-full" aria-hidden="true" />
    )
  }

  return (
    <div
      className="h-1.5 bg-base-200 rounded-full overflow-hidden flex"
      role="img"
      aria-label={`Repartition: Runtimes ${runtimesPercent.toFixed(0)}%, Addons ${addonsPercent.toFixed(0)}%`}
    >
      {runtimesPercent > 0 && (
        <div
          className="bg-primary h-full"
          style={{ width: `${runtimesPercent}%` }}
        />
      )}
      {addonsPercent > 0 && (
        <div
          className="bg-secondary h-full"
          style={{ width: `${addonsPercent}%` }}
        />
      )}
    </div>
  )
})

interface ProjectItemProps {
  project: Project
  cost: ProjectCostSummary | undefined
  orgId: string
}

const ProjectItem = memo(function ProjectItem({
  project,
  cost,
  orgId,
}: ProjectItemProps) {
  const { runtimes, addons } = project
  const hasCost = cost && cost.totalMonthlyCost > 0

  return (
    <Link
      to="/org/$orgId/project/$projectId/runtimes"
      params={{ orgId, projectId: project.id }}
      className="block w-full text-left card bg-base-100 border border-base-300 hover:border-primary/50 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 cursor-pointer"
      aria-label={`Ouvrir le projet ${project.name}`}
    >
      <div className="card-body p-4">
        <div className="flex items-center justify-between gap-3">
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
                  {runtimes.length} runtime{runtimes.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-base-content/60 flex items-center gap-1">
                  <Icons.Puzzle className="w-3 h-3" />
                  {addons.length} addon{addons.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

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

        {hasCost && (
          <div className="mt-3 pt-3 border-t border-base-200">
            <CostBreakdownBar
              runtimesCost={cost.runtimesCost}
              addonsCost={cost.addonsCost}
              total={cost.totalMonthlyCost}
            />
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-base-content/60">Runtimes:</span>
                  <span className="font-medium text-primary">{formatPrice(cost.runtimesCost)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" aria-hidden="true" />
                  <span className="text-base-content/60">Addons:</span>
                  <span className="font-medium text-secondary">{formatPrice(cost.addonsCost)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
})

interface OrganizationProjectListProps {
  projects: Project[]
  projectCosts: Map<string, ProjectCostSummary>
  orgId: string
  onCreateProject: () => void
}

export const OrganizationProjectList = memo(function OrganizationProjectList({
  projects,
  projectCosts,
  orgId,
  onCreateProject,
}: OrganizationProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')

  // Filtrer et trier les projets
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'cost-desc') {
          const costA = projectCosts.get(a.id)?.totalMonthlyCost ?? 0
          const costB = projectCosts.get(b.id)?.totalMonthlyCost ?? 0
          return costB - costA
        }
        if (sortBy === 'cost-asc') {
          const costA = projectCosts.get(a.id)?.totalMonthlyCost ?? 0
          const costB = projectCosts.get(b.id)?.totalMonthlyCost ?? 0
          return costA - costB
        }
        return a.name.localeCompare(b.name)
      })
  }, [projects, searchQuery, sortBy, projectCosts])

  const showFilters = projects.length > 1

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

      {/* Barre de recherche et tri */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              className="input input-bordered input-sm w-full pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Rechercher un projet"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                onClick={() => setSearchQuery('')}
                aria-label="Effacer la recherche"
              >
                <Icons.X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tri */}
          <select
            className="select select-bordered select-sm min-w-[160px]"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            aria-label="Trier les projets"
          >
            <option value="name-asc">Nom A-Z</option>
            <option value="cost-desc">Cout decroissant</option>
            <option value="cost-asc">Cout croissant</option>
          </select>
        </div>
      )}

      {/* Indicateur de filtrage */}
      {searchQuery && (
        <p className="text-sm text-base-content/60">
          {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} trouve{filteredProjects.length !== 1 ? 's' : ''}
          {filteredProjects.length !== projects.length && ` sur ${projects.length}`}
        </p>
      )}

      {/* Liste des projets */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-3">
          {filteredProjects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              cost={projectCosts.get(project.id)}
              orgId={orgId}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center py-8">
            <Icons.Search className="w-8 h-8 text-base-content/30 mb-2" />
            <h4 className="font-semibold">Aucun projet trouve</h4>
            <p className="text-sm text-base-content/60">
              Aucun projet ne correspond a "{searchQuery}"
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-2"
              onClick={() => setSearchQuery('')}
            >
              Effacer la recherche
            </button>
          </div>
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
