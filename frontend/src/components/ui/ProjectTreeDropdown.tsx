import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import type { DropdownMenuItem } from "@/components/ui";
import { DropdownMenu, Icons } from "@/components/ui";
import { useActiveOrganizationCostsWithDescendants } from "@/hooks/useCostCalculation";
import { formatPrice } from "@/lib/costCalculator";
import {
  selectActiveOrganizationProjects,
  selectActiveProject,
  useProjectActions,
  useSelector,
} from "@/store";
import { useProjectStore } from "@/store/projectStore";
import type { Project, ProjectCostSummary } from "@/types";

type SortOption = "name-asc" | "cost-desc" | "cost-asc";

interface ProjectTreeDropdownProps {
  onClose?: () => void;
}

interface ProjectTreeItemProps {
  project: Project;
  depth: number;
  isActive: boolean;
  cost?: number;
  orgId: string;
  activeProjectId: string | null;
  allProjects: Project[];
  projectCosts: Map<string, ProjectCostSummary>;
  expandedProjects: Set<string>;
  sortOption: SortOption;
  onToggleExpand: (projectId: string) => void;
  onCloseDropdown: () => void;
  onCreateSubProject: (parentProjectId: string) => void;
}

interface ProjectItemFlatProps {
  project: Project;
  breadcrumb: string | null;
  isActive: boolean;
  cost?: number;
  runtimeCount: number;
  addonCount: number;
  orgId: string;
  onCloseDropdown: () => void;
  menuItems: DropdownMenuItem[];
}

const sortProjects = (
  projectList: Project[],
  sort: SortOption,
  costs: Map<string, ProjectCostSummary>,
) => {
  return [...projectList].sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.name.localeCompare(b.name, "fr");
      case "cost-desc": {
        const costA = costs.get(a.id)?.totalMonthlyCost ?? 0;
        const costB = costs.get(b.id)?.totalMonthlyCost ?? 0;
        return costB - costA;
      }
      case "cost-asc": {
        const costA = costs.get(a.id)?.totalMonthlyCost ?? 0;
        const costB = costs.get(b.id)?.totalMonthlyCost ?? 0;
        return costA - costB;
      }
      default:
        return 0;
    }
  });
};

const ProjectTreeItem = memo(function ProjectTreeItem({
  project,
  depth,
  isActive,
  cost,
  orgId,
  activeProjectId,
  allProjects,
  projectCosts,
  expandedProjects,
  sortOption,
  onToggleExpand,
  onCloseDropdown,
  onCreateSubProject,
}: ProjectTreeItemProps) {
  const childProjects = useMemo(
    () => allProjects.filter((p) => p.parentProjectId === project.id),
    [allProjects, project.id],
  );
  const hasChildren = childProjects.length > 0;
  const isExpanded = expandedProjects.has(project.id);

  const sortedChildProjects = useMemo(
    () => sortProjects(childProjects, sortOption, projectCosts),
    [childProjects, sortOption, projectCosts],
  );

  const menuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        label: "Ajouter un sous-projet",
        icon: <Icons.Plus className="w-4 h-4" />,
        onClick: () => onCreateSubProject(project.id),
      },
    ],
    [onCreateSubProject, project.id],
  );

  return (
    <>
      <li
        className={`
          group relative flex items-center gap-1 px-2 py-2 cursor-pointer transition-all duration-150 rounded-lg
          ${
            isActive
              ? "bg-primary/10 border-l-2 border-l-primary"
              : "border-l-2 border-l-transparent hover:bg-base-200"
          }
        `}
        style={{ marginLeft: depth > 0 ? `${depth * 20}px` : undefined }}
      >
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-base-300"
            style={{ left: `${(depth - 1) * 20 + 8}px` }}
          />
        )}

        {hasChildren ? (
          <button
            type="button"
            className="p-0.5 rounded hover:bg-base-300 transition-colors flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(project.id);
            }}
            aria-label={isExpanded ? "Replier" : "Deplier"}
            aria-expanded={isExpanded}
          >
            <Icons.ChevronRight
              className={`w-3 h-3 text-base-content/50 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <Link
          to="/org/$orgId/project/$projectId/runtimes"
          params={{ orgId, projectId: project.id }}
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={onCloseDropdown}
          aria-current={isActive ? "page" : undefined}
        >
          <Icons.Folder
            className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-base-content/40"}`}
          />
          <div className="flex-1 min-w-0">
            <span
              className={`truncate text-sm block ${isActive ? "text-primary font-medium" : "text-base-content"}`}
            >
              {project.name}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-base-content/50">
            {project.runtimes.length > 0 && (
              <span className="flex items-center gap-0.5" title="Runtimes">
                <Icons.Server className="w-3 h-3" />
                {project.runtimes.length}
              </span>
            )}
            {project.addons.length > 0 && (
              <span className="flex items-center gap-0.5" title="Add-ons">
                <Icons.Puzzle className="w-3 h-3" />
                {project.addons.length}
              </span>
            )}
          </div>
          <span
            className={`text-xs tabular-nums ${isActive ? "text-primary" : "text-base-content/60"}`}
          >
            {cost !== undefined ? formatPrice(cost) : "..."}
          </span>
          <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <DropdownMenu
              items={menuItems}
              align="left"
              trigger={
                <button
                  type="button"
                  className="p-1 hover:bg-base-300 rounded transition-colors"
                  aria-label="Actions projet"
                >
                  <Icons.MoreHorizontal className="w-4 h-4 text-base-content/60" />
                </button>
              }
            />
          </div>
        </div>
      </li>

      {isExpanded &&
        sortedChildProjects.map((childProject) => (
          <ProjectTreeItem
            key={childProject.id}
            project={childProject}
            depth={depth + 1}
            isActive={childProject.id === activeProjectId}
            cost={projectCosts.get(childProject.id)?.totalMonthlyCost}
            orgId={orgId}
            activeProjectId={activeProjectId}
            allProjects={allProjects}
            projectCosts={projectCosts}
            expandedProjects={expandedProjects}
            sortOption={sortOption}
            onToggleExpand={onToggleExpand}
            onCloseDropdown={onCloseDropdown}
            onCreateSubProject={onCreateSubProject}
          />
        ))}
    </>
  );
});

const ProjectItemFlat = memo(function ProjectItemFlat({
  project,
  breadcrumb,
  isActive,
  cost,
  runtimeCount,
  addonCount,
  orgId,
  onCloseDropdown,
  menuItems,
}: ProjectItemFlatProps) {
  return (
    <li
      className={`
        group relative flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-150 rounded-lg
        ${
          isActive
            ? "bg-primary/10 border-l-2 border-l-primary"
            : "border-l-2 border-l-transparent hover:bg-base-200"
        }
      `}
    >
      <Link
        to="/org/$orgId/project/$projectId/runtimes"
        params={{ orgId, projectId: project.id }}
        className="flex-1 flex items-center gap-2 min-w-0"
        onClick={onCloseDropdown}
        aria-current={isActive ? "page" : undefined}
      >
        <Icons.Folder
          className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-base-content/40"}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`truncate text-sm ${isActive ? "text-primary font-medium" : "text-base-content"}`}
            >
              {project.name}
            </span>
          </div>
          {breadcrumb && (
            <span className="text-xs text-base-content/50 truncate block">
              {breadcrumb}
            </span>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-base-content/50">
          {runtimeCount > 0 && (
            <span className="flex items-center gap-0.5" title="Runtimes">
              <Icons.Server className="w-3 h-3" />
              {runtimeCount}
            </span>
          )}
          {addonCount > 0 && (
            <span className="flex items-center gap-0.5" title="Add-ons">
              <Icons.Puzzle className="w-3 h-3" />
              {addonCount}
            </span>
          )}
        </div>
        <span
          className={`text-xs tabular-nums ${isActive ? "text-primary" : "text-base-content/60"}`}
        >
          {cost !== undefined ? formatPrice(cost) : "..."}
        </span>
        <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <DropdownMenu
            items={menuItems}
            align="left"
            trigger={
              <button
                type="button"
                className="p-1 hover:bg-base-300 rounded transition-colors"
                aria-label="Actions projet"
              >
                <Icons.MoreHorizontal className="w-4 h-4 text-base-content/60" />
              </button>
            }
          />
        </div>
      </div>
    </li>
  );
});

export const ProjectTreeDropdown = memo(function ProjectTreeDropdown({
  onClose,
}: ProjectTreeDropdownProps) {
  const navigate = useNavigate();
  const { orgId: activeOrgId = null, projectId: activeProjectId = null } =
    useParams({ strict: false });
  const projects = useProjectStore(
    useShallow(selectActiveOrganizationProjects),
  );
  const activeProject = useSelector(selectActiveProject);
  const projectCosts = useActiveOrganizationCostsWithDescendants();
  const { createProject } = useProjectActions();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    () => new Set(),
  );

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleCloseDropdown = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

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

  const getAncestorIds = useCallback(
    (projectId: string | null): string[] => {
      if (!projectId) return [];
      const ancestors: string[] = [];
      let currentId: string | undefined = projectId;

      while (currentId) {
        const project = projects.find((p) => p.id === currentId);
        if (!project?.parentProjectId) break;
        ancestors.push(project.parentProjectId);
        currentId = project.parentProjectId;
      }

      return ancestors;
    },
    [projects],
  );

  // Expand ancestors of active project when dropdown opens
  useEffect(() => {
    if (isOpen && activeProjectId) {
      const ancestors = getAncestorIds(activeProjectId);
      if (ancestors.length > 0) {
        setExpandedProjects((prev) => {
          const next = new Set(prev);
          for (const id of ancestors) {
            next.add(id);
          }
          return next;
        });
      }
    }
  }, [isOpen, activeProjectId, getAncestorIds]);

  const projectsWithChildren = useMemo(
    () =>
      projects.filter((p) => projects.some((c) => c.parentProjectId === p.id)),
    [projects],
  );
  const hasAnyChildren = projectsWithChildren.length > 0;

  const handleExpandAll = useCallback(() => {
    setExpandedProjects(new Set(projectsWithChildren.map((p) => p.id)));
  }, [projectsWithChildren]);

  const handleCollapseAll = useCallback(() => {
    setExpandedProjects(new Set());
  }, []);

  const buildBreadcrumb = useCallback(
    (project: Project): string | null => {
      if (!project.parentProjectId) return null;

      const breadcrumbParts: string[] = [];
      let currentParentId: string | undefined = project.parentProjectId;

      while (currentParentId) {
        const parentProject = projects.find((p) => p.id === currentParentId);
        if (!parentProject) break;
        breadcrumbParts.unshift(parentProject.name);
        currentParentId = parentProject.parentProjectId;
      }

      return breadcrumbParts.length > 0 ? breadcrumbParts.join(" > ") : null;
    },
    [projects],
  );

  const rootProjects = useMemo(() => {
    const roots = projects.filter((p) => !p.parentProjectId);
    return sortProjects(roots, sortOption, projectCosts);
  }, [projects, sortOption, projectCosts]);

  const filteredAndSortedProjects = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter((project) => {
      const breadcrumb = buildBreadcrumb(project);
      const fullPath = breadcrumb
        ? `${breadcrumb} > ${project.name}`
        : project.name;
      return fullPath.toLowerCase().includes(query);
    });

    return sortProjects(filtered, sortOption, projectCosts);
  }, [projects, searchQuery, sortOption, projectCosts, buildBreadcrumb]);

  const handleCreateProject = useCallback(() => {
    if (!activeOrgId) return;
    const rootProjectsCount = projects.filter((p) => !p.parentProjectId).length;
    const name = `Projet ${rootProjectsCount + 1}`;
    const newProjectId = createProject(activeOrgId, name);
    navigate({
      to: "/org/$orgId/project/$projectId/runtimes",
      params: { orgId: activeOrgId, projectId: newProjectId },
    });
    handleCloseDropdown();
  }, [activeOrgId, projects, createProject, navigate, handleCloseDropdown]);

  const handleCreateSubProject = useCallback(
    (parentProjectId: string) => {
      if (!activeOrgId) return;
      const parentProject = projects.find((p) => p.id === parentProjectId);
      const siblingCount = projects.filter(
        (p) => p.parentProjectId === parentProjectId,
      ).length;
      const name = `${parentProject?.name ?? "Projet"} - ${siblingCount + 1}`;
      const newProjectId = createProject(activeOrgId, name, parentProjectId);
      setExpandedProjects((prev) => new Set(prev).add(parentProjectId));
      navigate({
        to: "/org/$orgId/project/$projectId/runtimes",
        params: { orgId: activeOrgId, projectId: newProjectId },
      });
      handleCloseDropdown();
    },
    [activeOrgId, projects, createProject, navigate, handleCloseDropdown],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const getProjectMenuItems = useCallback(
    (project: Project): DropdownMenuItem[] => [
      {
        label: "Ajouter un sous-projet",
        icon: <Icons.Plus className="w-4 h-4" />,
        onClick: () => handleCreateSubProject(project.id),
      },
    ],
    [handleCreateSubProject],
  );

  const sortMenuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        label: "Nom (A-Z)",
        icon: <Icons.SortAsc className="w-4 h-4" />,
        onClick: () => setSortOption("name-asc"),
      },
      {
        label: "Cout (decroissant)",
        icon: <Icons.SortDesc className="w-4 h-4" />,
        onClick: () => setSortOption("cost-desc"),
      },
      {
        label: "Cout (croissant)",
        icon: <Icons.SortAsc className="w-4 h-4" />,
        onClick: () => setSortOption("cost-asc"),
      },
    ],
    [],
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icons.Folder className="w-4 h-4" />
        <span className="text-sm font-medium truncate max-w-[200px]">
          {activeProject ? activeProject.name : "Selectionner un projet"}
        </span>
        <Icons.ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[32rem] bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
          {/* Header with search */}
          <div className="px-4 py-3 border-b border-base-300 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-base-content">
                  Projets
                </h3>
                <span className="badge badge-sm badge-ghost">
                  {projects.length}
                </span>
              </div>
              <button
                type="button"
                className="p-1 hover:bg-base-200 rounded transition-colors"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
              >
                <Icons.X className="w-4 h-4 text-base-content/60" />
              </button>
            </div>

            <div className="relative">
              <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full pl-9 pr-8 bg-base-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-base-300 rounded transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <Icons.X className="w-3.5 h-3.5 text-base-content/40" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                {hasAnyChildren && !isSearching && (
                  <>
                    <button
                      type="button"
                      className="p-1 hover:bg-base-200 rounded transition-colors"
                      onClick={handleExpandAll}
                      aria-label="Tout deplier"
                      title="Tout deplier"
                    >
                      <Icons.ChevronDown className="w-3.5 h-3.5 text-base-content/60" />
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-base-200 rounded transition-colors"
                      onClick={handleCollapseAll}
                      aria-label="Tout replier"
                      title="Tout replier"
                    >
                      <Icons.ChevronUp className="w-3.5 h-3.5 text-base-content/60" />
                    </button>
                  </>
                )}
              </div>
              <DropdownMenu
                items={sortMenuItems}
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-base-content/60 hover:text-base-content transition-colors"
                  >
                    {sortOption === "name-asc" && (
                      <>
                        <Icons.SortAsc className="w-3.5 h-3.5" />
                        Nom
                      </>
                    )}
                    {sortOption === "cost-desc" && (
                      <>
                        <Icons.SortDesc className="w-3.5 h-3.5" />
                        Cout
                      </>
                    )}
                    {sortOption === "cost-asc" && (
                      <>
                        <Icons.SortAsc className="w-3.5 h-3.5" />
                        Cout
                      </>
                    )}
                    <Icons.ChevronDown className="w-3 h-3" />
                  </button>
                }
              />
            </div>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto overflow-x-visible px-2 py-2">
            {!activeOrgId ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 mx-auto mb-4 bg-base-200 rounded-lg flex items-center justify-center">
                  <Icons.Building className="w-6 h-6 text-base-content/40" />
                </div>
                <p className="font-medium text-base-content/80 text-sm">
                  Aucune organisation
                </p>
                <p className="text-xs mt-1 text-base-content/50">
                  Selectionnez une organisation
                </p>
              </div>
            ) : isSearching ? (
              filteredAndSortedProjects.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 mx-auto mb-4 bg-base-200 rounded-lg flex items-center justify-center">
                    <Icons.Folder className="w-6 h-6 text-base-content/40" />
                  </div>
                  <p className="font-medium text-base-content/80 text-sm">
                    Aucun resultat
                  </p>
                  <p className="text-xs mt-1 text-base-content/50">
                    Aucun projet ne correspond a "{searchQuery}"
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost mt-3"
                    onClick={handleClearSearch}
                  >
                    Effacer la recherche
                  </button>
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredAndSortedProjects.map((project) => {
                    const cost = projectCosts.get(project.id);
                    const isActive = project.id === activeProjectId;
                    const breadcrumb = buildBreadcrumb(project);

                    return (
                      <ProjectItemFlat
                        key={project.id}
                        project={project}
                        breadcrumb={breadcrumb}
                        isActive={isActive}
                        cost={cost?.totalMonthlyCost}
                        runtimeCount={project.runtimes.length}
                        addonCount={project.addons.length}
                        orgId={activeOrgId}
                        onCloseDropdown={handleCloseDropdown}
                        menuItems={getProjectMenuItems(project)}
                      />
                    );
                  })}
                </ul>
              )
            ) : rootProjects.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 mx-auto mb-4 bg-base-200 rounded-lg flex items-center justify-center">
                  <Icons.Folder className="w-6 h-6 text-base-content/40" />
                </div>
                <p className="font-medium text-base-content/80 text-sm">
                  Aucun projet
                </p>
                <p className="text-xs mt-1 text-base-content/50">
                  Creez votre premier projet
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-primary mt-3"
                  onClick={handleCreateProject}
                >
                  <Icons.Plus className="w-4 h-4" />
                  Nouveau projet
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {rootProjects.map((project) => {
                  const cost = projectCosts.get(project.id);
                  const isActive = project.id === activeProjectId;

                  return (
                    <ProjectTreeItem
                      key={project.id}
                      project={project}
                      depth={0}
                      isActive={isActive}
                      cost={cost?.totalMonthlyCost}
                      orgId={activeOrgId}
                      activeProjectId={activeProjectId}
                      allProjects={projects}
                      projectCosts={projectCosts}
                      expandedProjects={expandedProjects}
                      sortOption={sortOption}
                      onToggleExpand={toggleProjectExpand}
                      onCloseDropdown={handleCloseDropdown}
                      onCreateSubProject={handleCreateSubProject}
                    />
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer with new project button */}
          {activeOrgId && rootProjects.length > 0 && (
            <div className="px-4 py-3 border-t border-base-300 flex-shrink-0">
              <button
                type="button"
                className="btn btn-sm btn-ghost w-full justify-start gap-2"
                onClick={handleCreateProject}
              >
                <Icons.Plus className="w-4 h-4" />
                Nouveau projet
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
