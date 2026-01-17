import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import type { DropdownMenuItem } from "@/components/ui";
import {
  CloneDialog,
  ConfirmDialog,
  DropdownMenu,
  Icons,
  MoveProjectDialog,
} from "@/components/ui";
import { useAllProjectsCosts } from "@/hooks/useCostCalculation";
import { formatPrice } from "@/lib/costCalculator";
import {
  selectOrganizations,
  selectProjects,
  useProjectActions,
  useSelector,
  useToastStore,
} from "@/store";
import type { Organization, Project, ProjectCostSummary } from "@/types";

interface SidebarProps {
  onClose?: () => void;
}

interface OrganizationItemProps {
  organization: Organization;
  projects: Project[];
  allOrganizations: Organization[];
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose?: () => void;
  activeProjectId: string | null;
  projectCosts: Map<string, ProjectCostSummary>;
  onCloneOrg: (org: Organization) => void;
  onDeleteOrg: (org: Organization) => void;
  onCloneProject: (project: Project) => void;
  onMoveProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

const getBudgetStatusColor = (percent: number): string =>
  percent > 90 ? "bg-error" : percent >= 70 ? "bg-warning" : "bg-success";

function OrganizationItem({
  organization,
  projects,
  allOrganizations,
  isActive,
  isExpanded,
  onToggleExpand,
  onClose,
  activeProjectId,
  projectCosts,
  onCloneOrg,
  onDeleteOrg,
  onCloneProject,
  onMoveProject,
  onDeleteProject,
}: OrganizationItemProps) {
  const totalCost = useMemo(
    () =>
      projects.reduce(
        (sum, p) => sum + (projectCosts.get(p.id)?.totalMonthlyCost ?? 0),
        0,
      ),
    [projects, projectCosts],
  );

  const budgetPercent = organization.budgetTarget
    ? (totalCost / organization.budgetTarget) * 100
    : null;

  const orgMenuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        label: "Dupliquer",
        icon: <Icons.Copy className="w-4 h-4" />,
        onClick: () => onCloneOrg(organization),
      },
      {
        label: "Supprimer",
        icon: <Icons.Trash className="w-4 h-4" />,
        onClick: () => onDeleteOrg(organization),
        variant: "danger",
      },
    ],
    [organization, onCloneOrg, onDeleteOrg],
  );

  const getProjectMenuItems = useCallback(
    (project: Project): DropdownMenuItem[] => {
      const items: DropdownMenuItem[] = [
        {
          label: "Dupliquer",
          icon: <Icons.Copy className="w-4 h-4" />,
          onClick: () => onCloneProject(project),
        },
      ];
      if (allOrganizations.length > 1) {
        items.push({
          label: "Deplacer",
          icon: <Icons.Move className="w-4 h-4" />,
          onClick: () => onMoveProject(project),
        });
      }
      items.push({
        label: "Supprimer",
        icon: <Icons.Trash className="w-4 h-4" />,
        onClick: () => onDeleteProject(project),
        variant: "danger",
      });
      return items;
    },
    [allOrganizations.length, onCloneProject, onMoveProject, onDeleteProject],
  );

  return (
    <li>
      <div
        className={`
          flex flex-col px-3 py-2 cursor-pointer transition-all duration-150 group
          ${
            isActive
              ? "bg-[#5754aa]/30 border-l-2 border-l-white"
              : "border-l-2 border-l-transparent hover:bg-white/5"
          }
        `}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 hover:bg-white/10 rounded transition-colors"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Replier" : "Deplier"}
          >
            <Icons.ChevronRight
              className={`w-3 h-3 text-white/50 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>
          <Link
            to="/org/$orgId"
            params={{ orgId: organization.id }}
            className="flex-1 flex items-center gap-2 min-w-0"
            onClick={onClose}
          >
            <Icons.Building className="w-4 h-4 text-white/60 flex-shrink-0" />
            <span
              className={`truncate text-sm ${isActive ? "text-white font-medium" : "text-white/70"}`}
            >
              {organization.name}
            </span>
          </Link>
          <span
            className={`text-xs tabular-nums flex-shrink-0 ${isActive ? "text-white/80" : "text-white/50"}`}
          >
            {formatPrice(totalCost)}
          </span>
          <DropdownMenu
            items={orgMenuItems}
            trigger={
              <button
                type="button"
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Actions organisation"
              >
                <Icons.MoreHorizontal className="w-4 h-4 text-white/60" />
              </button>
            }
          />
        </div>

        {isExpanded && budgetPercent !== null && (
          <div className="mt-1.5 ml-7 mr-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getBudgetStatusColor(budgetPercent)}`}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-white/40 tabular-nums w-8 text-right">
                {budgetPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {isExpanded && projects.length > 0 && (
        <ul className="pl-6">
          {projects.map((project) => {
            const cost = projectCosts.get(project.id);
            const isProjectActive = project.id === activeProjectId;

            return (
              <ProjectItem
                key={project.id}
                project={project}
                organization={organization}
                cost={cost?.totalMonthlyCost}
                isActive={isProjectActive}
                onClose={onClose}
                menuItems={getProjectMenuItems(project)}
              />
            );
          })}
        </ul>
      )}
    </li>
  );
}

interface ProjectItemProps {
  project: Project;
  organization: Organization;
  cost?: number;
  isActive: boolean;
  onClose?: () => void;
  menuItems: DropdownMenuItem[];
}

function ProjectItem({
  project,
  organization,
  cost,
  isActive,
  onClose,
  menuItems,
}: ProjectItemProps) {
  return (
    <li>
      <div
        className={`
					flex items-center gap-2 w-full text-left px-3 py-2 cursor-pointer transition-all duration-150
					${
            isActive
              ? "bg-[#5754aa] border-l-2 border-l-white"
              : "border-l-2 border-l-transparent hover:bg-white/5 hover:border-l-white/30"
          }
				`}
      >
        <Link
          to="/org/$orgId/project/$projectId/runtimes"
          params={{ orgId: organization.id, projectId: project.id }}
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={onClose}
          aria-current={isActive ? "page" : undefined}
        >
          <Icons.Folder
            className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-white" : "text-white/40"}`}
          />
          <span
            className={`truncate text-sm ${isActive ? "text-white font-medium" : "text-white/70"}`}
          >
            {project.name}
          </span>
        </Link>
        <span
          className={`text-xs tabular-nums flex-shrink-0 ${isActive ? "text-white" : "text-white/50"}`}
        >
          {cost !== undefined ? formatPrice(cost) : "..."}
        </span>
        <DropdownMenu
          items={menuItems}
          trigger={
            <button
              type="button"
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Actions projet"
            >
              <Icons.MoreHorizontal className="w-4 h-4 text-white/60" />
            </button>
          }
        />
      </div>
    </li>
  );
}

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const organizations = useSelector(selectOrganizations);
  const allProjects = useSelector(selectProjects);
  const {
    createProject,
    createOrganization,
    cloneOrganization,
    deleteOrganization,
    cloneProject,
    moveProject,
    deleteProject,
  } = useProjectActions();
  const addToast = useToastStore((s) => s.addToast);
  const { orgId: activeOrgId = null, projectId: activeProjectId = null } =
    useParams({ strict: false });
  const projectCosts = useAllProjectsCosts();

  const [cloneOrgTarget, setCloneOrgTarget] = useState<Organization | null>(
    null,
  );
  const [deleteOrgTarget, setDeleteOrgTarget] = useState<Organization | null>(
    null,
  );
  const [cloneProjectTarget, setCloneProjectTarget] = useState<Project | null>(
    null,
  );
  const [moveProjectTarget, setMoveProjectTarget] = useState<Project | null>(
    null,
  );
  const [deleteProjectTarget, setDeleteProjectTarget] =
    useState<Project | null>(null);

  const projectsByOrg = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const org of organizations) {
      map.set(
        org.id,
        allProjects.filter((p) => p.organizationId === org.id),
      );
    }
    return map;
  }, [organizations, allProjects]);

  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(
    () => new Set(activeOrgId ? [activeOrgId] : []),
  );

  const toggleOrgExpansion = useCallback((orgId: string) => {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  }, []);

  const handleCreateOrganization = useCallback(() => {
    const name = `Organisation ${organizations.length + 1}`;
    const newOrgId = createOrganization(name);
    setExpandedOrgs((prev) => new Set(prev).add(newOrgId));
    navigate({ to: "/org/$orgId", params: { orgId: newOrgId } });
    onClose?.();
  }, [organizations.length, createOrganization, navigate, onClose]);

  const handleCreateProject = useCallback(() => {
    if (!activeOrgId) return;
    const orgProjects = projectsByOrg.get(activeOrgId) ?? [];
    const name = `Projet ${orgProjects.length + 1}`;
    const newProjectId = createProject(activeOrgId, name);
    navigate({
      to: "/org/$orgId/project/$projectId/runtimes",
      params: { orgId: activeOrgId, projectId: newProjectId },
    });
    onClose?.();
  }, [activeOrgId, projectsByOrg, createProject, navigate, onClose]);

  const handleCloneOrg = useCallback(
    (newName: string) => {
      if (!cloneOrgTarget) return;
      const newOrgId = cloneOrganization(cloneOrgTarget.id, newName);
      setCloneOrgTarget(null);
      addToast("success", `Organisation "${newName}" creee avec succes`);
      setExpandedOrgs((prev) => new Set(prev).add(newOrgId));
      navigate({ to: "/org/$orgId", params: { orgId: newOrgId } });
      onClose?.();
    },
    [cloneOrgTarget, cloneOrganization, addToast, navigate, onClose],
  );

  const handleDeleteOrg = useCallback(() => {
    if (!deleteOrgTarget) return;
    const name = deleteOrgTarget.name;
    deleteOrganization(deleteOrgTarget.id);
    setDeleteOrgTarget(null);
    addToast("success", `Organisation "${name}" supprimee`);
    navigate({ to: "/" });
    onClose?.();
  }, [deleteOrgTarget, deleteOrganization, addToast, navigate, onClose]);

  const handleCloneProject = useCallback(
    (newName: string, targetOrgId?: string) => {
      if (!cloneProjectTarget) return;
      const orgId = targetOrgId ?? cloneProjectTarget.organizationId;
      const newProjectId = cloneProject(cloneProjectTarget.id, orgId, newName);
      setCloneProjectTarget(null);
      addToast("success", `Projet "${newName}" cree avec succes`);
      navigate({
        to: "/org/$orgId/project/$projectId/runtimes",
        params: { orgId, projectId: newProjectId },
      });
      onClose?.();
    },
    [cloneProjectTarget, cloneProject, addToast, navigate, onClose],
  );

  const handleMoveProject = useCallback(
    (targetOrgId: string) => {
      if (!moveProjectTarget) return;
      moveProject(moveProjectTarget.id, targetOrgId);
      const targetOrg = organizations.find((o) => o.id === targetOrgId);
      setMoveProjectTarget(null);
      addToast(
        "success",
        `Projet deplace vers "${targetOrg?.name ?? "l'organisation"}"`,
      );
      navigate({
        to: "/org/$orgId/project/$projectId/runtimes",
        params: { orgId: targetOrgId, projectId: moveProjectTarget.id },
      });
      onClose?.();
    },
    [
      moveProjectTarget,
      moveProject,
      organizations,
      addToast,
      navigate,
      onClose,
    ],
  );

  const handleDeleteProject = useCallback(() => {
    if (!deleteProjectTarget) return;
    const name = deleteProjectTarget.name;
    const orgId = deleteProjectTarget.organizationId;
    deleteProject(deleteProjectTarget.id);
    setDeleteProjectTarget(null);
    addToast("success", `Projet "${name}" supprime`);
    navigate({ to: "/org/$orgId", params: { orgId } });
    onClose?.();
  }, [deleteProjectTarget, deleteProject, addToast, navigate, onClose]);

  return (
    <div className="h-full bg-[#13172e] w-80 flex flex-col">
      <div className="px-5 py-[1.8rem] border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Organisations
          </h2>
          <button
            type="button"
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            onClick={handleCreateOrganization}
            aria-label="Creer une nouvelle organisation"
          >
            <Icons.Plus className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {organizations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto mb-5 bg-white/5 border border-white/10 flex items-center justify-center">
              <Icons.Building className="w-7 h-7 text-white/40" />
            </div>
            <p className="font-medium text-white/80 text-sm">
              Aucune organisation
            </p>
            <p className="text-xs mt-2 text-white/50 leading-relaxed">
              Creez votre premiere organisation pour commencer
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {organizations.map((org) => (
              <OrganizationItem
                key={org.id}
                organization={org}
                projects={projectsByOrg.get(org.id) ?? []}
                allOrganizations={organizations}
                isActive={org.id === activeOrgId}
                isExpanded={expandedOrgs.has(org.id)}
                onToggleExpand={() => toggleOrgExpansion(org.id)}
                onClose={onClose}
                activeProjectId={activeProjectId}
                projectCosts={projectCosts}
                onCloneOrg={setCloneOrgTarget}
                onDeleteOrg={setDeleteOrgTarget}
                onCloneProject={setCloneProjectTarget}
                onMoveProject={setMoveProjectTarget}
                onDeleteProject={setDeleteProjectTarget}
              />
            ))}
          </ul>
        )}
      </div>

      {activeOrgId && (
        <div className="px-3 pb-3">
          <button
            type="button"
            className="
              w-full flex items-center justify-center gap-2 cursor-pointer
              px-4 py-2 text-sm font-medium
              bg-white/10 hover:bg-white/20 active:bg-white/5
              text-white/80 hover:text-white transition-colors duration-150
            "
            onClick={handleCreateProject}
            aria-label="Creer un nouveau projet"
          >
            <Icons.Plus className="w-4 h-4" />
            Nouveau projet
          </button>
        </div>
      )}

      <CloneDialog
        isOpen={cloneOrgTarget !== null}
        type="organization"
        sourceName={cloneOrgTarget?.name ?? ""}
        onClone={handleCloneOrg}
        onCancel={() => setCloneOrgTarget(null)}
      />

      <ConfirmDialog
        isOpen={deleteOrgTarget !== null}
        title="Supprimer l'organisation"
        message={`Voulez-vous vraiment supprimer l'organisation "${deleteOrgTarget?.name}" et tous ses projets ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={handleDeleteOrg}
        onCancel={() => setDeleteOrgTarget(null)}
      />

      <CloneDialog
        isOpen={cloneProjectTarget !== null}
        type="project"
        sourceName={cloneProjectTarget?.name ?? ""}
        organizations={organizations}
        currentOrgId={cloneProjectTarget?.organizationId}
        onClone={handleCloneProject}
        onCancel={() => setCloneProjectTarget(null)}
      />

      <MoveProjectDialog
        isOpen={moveProjectTarget !== null}
        projectName={moveProjectTarget?.name ?? ""}
        organizations={organizations}
        currentOrgId={moveProjectTarget?.organizationId ?? ""}
        onMove={handleMoveProject}
        onCancel={() => setMoveProjectTarget(null)}
      />

      <ConfirmDialog
        isOpen={deleteProjectTarget !== null}
        title="Supprimer le projet"
        message={`Voulez-vous vraiment supprimer le projet "${deleteProjectTarget?.name}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProjectTarget(null)}
      />
    </div>
  );
}
