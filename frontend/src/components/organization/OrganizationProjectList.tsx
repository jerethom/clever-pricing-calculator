import { Link } from "@tanstack/react-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Icons } from "@/components/ui";
import { PriceRange } from "@/components/ui/PriceRange";
import { formatPrice } from "@/lib/costCalculator";
import type { Project, ProjectCostSummary } from "@/types";

type SortOption = "name-asc" | "cost-desc" | "cost-asc";

interface CostBreakdownBarProps {
  runtimesCost: number;
  addonsCost: number;
  total: number;
}

const CostBreakdownBar = memo(function CostBreakdownBar({
  runtimesCost,
  addonsCost,
  total,
}: CostBreakdownBarProps) {
  const runtimesPercent = total > 0 ? (runtimesCost / total) * 100 : 0;
  const addonsPercent = total > 0 ? (addonsCost / total) * 100 : 0;

  if (total === 0) {
    return (
      <div className="h-1.5 bg-base-200 rounded-full" aria-hidden="true" />
    );
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
  );
});

interface ProjectItemProps {
  project: Project;
  cost: ProjectCostSummary | undefined;
  orgId: string;
  depth: number;
  allProjects: Project[];
  projectCosts: Map<string, ProjectCostSummary>;
  expandedProjects: Set<string>;
  onToggleExpand: (projectId: string) => void;
  onCreateSubProject: (parentProjectId: string) => void;
}

const ProjectItem = memo(function ProjectItem({
  project,
  cost,
  orgId,
  depth,
  allProjects,
  projectCosts,
  expandedProjects,
  onToggleExpand,
  onCreateSubProject,
}: ProjectItemProps) {
  const { runtimes, addons } = project;
  const hasCost = cost && cost.totalMonthlyCost > 0;

  const childProjects = useMemo(
    () => allProjects.filter((p) => p.parentProjectId === project.id),
    [allProjects, project.id],
  );

  const hasChildren = childProjects.length > 0;
  const isExpanded = expandedProjects.has(project.id);

  const { minCost, maxCost, estimatedCost } = useMemo(() => {
    if (!cost) {
      return { minCost: 0, maxCost: 0, estimatedCost: 0 };
    }
    const min =
      cost.runtimesDetail.reduce((sum, r) => sum + r.minMonthlyCost, 0) +
      cost.addonsCost;
    const max =
      cost.runtimesDetail.reduce((sum, r) => sum + r.maxMonthlyCost, 0) +
      cost.addonsCost;
    return { minCost: min, maxCost: max, estimatedCost: cost.totalMonthlyCost };
  }, [cost]);

  return (
    <div style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}>
      <div className="relative">
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-base-300"
            style={{ left: "-12px" }}
          />
        )}
        <div className="card bg-base-100 border border-base-300 hover:border-primary/50 hover:shadow-md transition-all group">
          <div className="card-body p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {hasChildren ? (
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-base-200 transition-colors flex-shrink-0"
                    onClick={() => onToggleExpand(project.id)}
                    aria-label={isExpanded ? "Replier" : "Deplier"}
                  >
                    <Icons.ChevronRight
                      className={`w-4 h-4 text-base-content/50 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>
                ) : (
                  <span className="w-6 flex-shrink-0" />
                )}
                <Link
                  to="/org/$orgId/project/$projectId/runtimes"
                  params={{ orgId, projectId: project.id }}
                  className="flex items-center gap-3 min-w-0 flex-1 focus:outline-none"
                  aria-label={`Ouvrir le projet ${project.name}`}
                >
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
                        {runtimes.length} runtime
                        {runtimes.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-base-content/60 flex items-center gap-1">
                        <Icons.Puzzle className="w-3 h-3" />
                        {addons.length} addon{addons.length !== 1 ? "s" : ""}
                      </span>
                      {hasChildren && (
                        <span className="text-xs text-base-content/60 flex items-center gap-1">
                          <Icons.Folder className="w-3 h-3" />
                          {childProjects.length} sous-projet
                          {childProjects.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-primary tabular-nums">
                    {cost ? formatPrice(cost.totalMonthlyCost) : "..."}
                  </p>
                  <p className="text-xs text-base-content/50">/mois</p>
                  {cost && (
                    <PriceRange
                      min={minCost}
                      estimated={estimatedCost}
                      max={maxCost}
                      compact
                      size="sm"
                      className="text-xs mt-1"
                    />
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-square"
                  onClick={() => onCreateSubProject(project.id)}
                  aria-label="Ajouter un sous-projet"
                  title="Ajouter un sous-projet"
                >
                  <Icons.Plus className="w-4 h-4" />
                </button>
                <Link
                  to="/org/$orgId/project/$projectId/runtimes"
                  params={{ orgId, projectId: project.id }}
                  className="focus:outline-none"
                  aria-label={`Ouvrir le projet ${project.name}`}
                >
                  <Icons.ChevronRight className="w-5 h-5 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
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
                      <span
                        className="w-2 h-2 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <span className="text-base-content/60">Runtimes:</span>
                      <span className="font-medium text-primary">
                        {formatPrice(cost.runtimesCost)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full bg-secondary"
                        aria-hidden="true"
                      />
                      <span className="text-base-content/60">Addons:</span>
                      <span className="font-medium text-secondary">
                        {formatPrice(cost.addonsCost)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && childProjects.length > 0 && (
        <div className="mt-3 space-y-3">
          {childProjects.map((childProject) => (
            <ProjectItem
              key={childProject.id}
              project={childProject}
              cost={projectCosts.get(childProject.id)}
              orgId={orgId}
              depth={depth + 1}
              allProjects={allProjects}
              projectCosts={projectCosts}
              expandedProjects={expandedProjects}
              onToggleExpand={onToggleExpand}
              onCreateSubProject={onCreateSubProject}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface OrganizationProjectListProps {
  projects: Project[];
  projectCosts: Map<string, ProjectCostSummary>;
  orgId: string;
  onCreateProject: (parentProjectId?: string) => void;
}

export const OrganizationProjectList = memo(function OrganizationProjectList({
  projects,
  projectCosts,
  orgId,
  onCreateProject,
}: OrganizationProjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleProjectExpand = useCallback((projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const handleCreateSubProject = useCallback(
    (parentProjectId: string) => {
      setExpandedProjects((prev) => new Set(prev).add(parentProjectId));
      onCreateProject(parentProjectId);
    },
    [onCreateProject],
  );

  const rootProjects = useMemo(
    () => projects.filter((p) => !p.parentProjectId),
    [projects],
  );

  const filteredRootProjects = useMemo(() => {
    const matchesSearch = (project: Project): boolean => {
      if (project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      const children = projects.filter((p) => p.parentProjectId === project.id);
      return children.some((child) => matchesSearch(child));
    };

    return rootProjects
      .filter((p) => (searchQuery ? matchesSearch(p) : true))
      .sort((a, b) => {
        if (sortBy === "cost-desc") {
          const costA = projectCosts.get(a.id)?.totalMonthlyCost ?? 0;
          const costB = projectCosts.get(b.id)?.totalMonthlyCost ?? 0;
          return costB - costA;
        }
        if (sortBy === "cost-asc") {
          const costA = projectCosts.get(a.id)?.totalMonthlyCost ?? 0;
          const costB = projectCosts.get(b.id)?.totalMonthlyCost ?? 0;
          return costA - costB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [rootProjects, projects, searchQuery, sortBy, projectCosts]);

  const showFilters = projects.length > 1;

  return (
    <section className="space-y-4" aria-label="Liste des projets">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Icons.Folder className="w-4 h-4 text-primary" />
          Projets
          <span className="badge badge-primary badge-sm">
            {projects.length}
          </span>
        </h3>
        <button
          type="button"
          onClick={() => onCreateProject()}
          className="btn btn-primary btn-sm gap-2"
          aria-label="Creer un nouveau projet"
        >
          <Icons.Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau projet</span>
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              className="input input-bordered input-sm w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher un projet"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                onClick={() => setSearchQuery("")}
                aria-label="Effacer la recherche"
              >
                <Icons.X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            className="select select-bordered select-sm min-w-[160px]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Trier les projets"
          >
            <option value="name-asc">Nom A-Z</option>
            <option value="cost-desc">Cout decroissant</option>
            <option value="cost-asc">Cout croissant</option>
          </select>
        </div>
      )}

      {searchQuery && (
        <p className="text-sm text-base-content/60">
          {filteredRootProjects.length} projet
          {filteredRootProjects.length !== 1 ? "s" : ""} trouve
          {filteredRootProjects.length !== 1 ? "s" : ""}
          {filteredRootProjects.length !== rootProjects.length &&
            ` sur ${rootProjects.length}`}
        </p>
      )}

      {filteredRootProjects.length > 0 ? (
        <div className="space-y-3">
          {filteredRootProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              cost={projectCosts.get(project.id)}
              orgId={orgId}
              depth={0}
              allProjects={projects}
              projectCosts={projectCosts}
              expandedProjects={expandedProjects}
              onToggleExpand={toggleProjectExpand}
              onCreateSubProject={handleCreateSubProject}
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
              onClick={() => setSearchQuery("")}
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
              Creez votre premier projet pour commencer a estimer vos couts
              cloud.
            </p>
            <button
              type="button"
              onClick={() => onCreateProject()}
              className="btn btn-primary mt-4 gap-2"
              aria-label="Creer un nouveau projet"
            >
              <Icons.Plus className="w-4 h-4" />
              Creer un projet
            </button>
          </div>
        </div>
      )}
    </section>
  );
});
