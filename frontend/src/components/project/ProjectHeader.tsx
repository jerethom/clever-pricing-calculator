import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  CloneDialog,
  ConfirmDialog,
  Icons,
  MoveProjectDialog,
} from "@/components/ui";
import { PriceRange } from "@/components/ui/PriceRange";
import { useProjectCost } from "@/hooks/useCostCalculation";
import { formatPrice } from "@/lib/costCalculator";
import {
  selectActiveOrganization,
  selectOrganizations,
  useProjectActions,
  useSelector,
  useToastStore,
} from "@/store";
import type { Project } from "@/types";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const navigate = useNavigate();
  const activeOrg = useSelector(selectActiveOrganization);
  const organizations = useSelector(selectOrganizations);
  const { updateProject, deleteProject, cloneProject, moveProject } =
    useProjectActions();
  const addToast = useToastStore((s) => s.addToast);
  const cost = useProjectCost(project.id);

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

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  const startEdit = () => {
    setEditName(project.name);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (editName.trim()) updateProject(project.id, { name: editName.trim() });
    setIsEditing(false);
  };

  const confirmDelete = () => {
    deleteProject(project.id);
    setShowDeleteConfirm(false);
  };

  const handleClone = useCallback(
    (newName: string, targetOrgId?: string) => {
      const orgId = targetOrgId ?? project.organizationId;
      const newProjectId = cloneProject(project.id, orgId, newName);
      setShowCloneDialog(false);
      addToast("success", `Projet "${newName}" cree avec succes`);
      navigate({
        to: "/org/$orgId/project/$projectId/runtimes",
        params: { orgId, projectId: newProjectId },
      });
    },
    [cloneProject, project.id, project.organizationId, addToast, navigate],
  );

  const handleMove = useCallback(
    (targetOrgId: string) => {
      moveProject(project.id, targetOrgId);
      setShowMoveDialog(false);
      const targetOrg = organizations.find((o) => o.id === targetOrgId);
      addToast(
        "success",
        `Projet deplace vers "${targetOrg?.name ?? "l'organisation"}"`,
      );
      navigate({
        to: "/org/$orgId/project/$projectId/runtimes",
        params: { orgId: targetOrgId, projectId: project.id },
      });
    },
    [moveProject, project.id, organizations, addToast, navigate],
  );

  return (
    <>
      <div className="space-y-4">
        {/* Ligne principale: Nom du projet + Actions */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          {/* Nom du projet */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="animate-in">
                <label
                  htmlFor="project-name-input"
                  className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2 block"
                >
                  Renommer le projet
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="project-name-input"
                    type="text"
                    className="input input-bordered flex-1 font-semibold text-lg"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setIsEditing(false);
                    }}
                    placeholder="Nom du projet..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-primary flex-1 sm:flex-none gap-2"
                      onClick={saveEdit}
                    >
                      <Icons.Check className="w-4 h-4" />
                      <span>Sauvegarder</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setIsEditing(false)}
                      aria-label="Annuler"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {activeOrg && (
                  <div className="flex items-center gap-1.5 text-sm text-base-content/50 mb-1">
                    <Icons.Building className="w-3.5 h-3.5" />
                    <span>{activeOrg.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 group">
                  <Icons.Folder className="w-5 h-5 text-primary shrink-0" />
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    {project.name}
                  </h1>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    onClick={startEdit}
                    aria-label="Modifier le nom du projet"
                  >
                    <Icons.Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu actions dropdown */}
          {!isEditing && (
            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Actions du projet"
              >
                <Icons.MoreHorizontal className="w-5 h-5" />
              </button>
              <ul className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-200">
                <li>
                  <button
                    type="button"
                    onClick={() => setShowCloneDialog(true)}
                    className="gap-2"
                  >
                    <Icons.Copy className="w-4 h-4" />
                    Dupliquer
                  </button>
                </li>
                {organizations.length > 1 && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setShowMoveDialog(true)}
                      className="gap-2"
                    >
                      <Icons.Move className="w-4 h-4" />
                      Deplacer
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="gap-2 text-error hover:bg-error/10"
                  >
                    <Icons.Trash className="w-4 h-4" />
                    Supprimer
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Stats compactes */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="badge badge-primary gap-1.5">
              <Icons.Server className="w-3.5 h-3.5" />
              {project.runtimes.length}
            </span>
            <span className="badge badge-secondary gap-1.5">
              <Icons.Puzzle className="w-3.5 h-3.5" />
              {project.addons.length}
            </span>
            <div className="divider divider-horizontal mx-0 hidden sm:flex" />
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-primary text-lg">
                {cost ? formatPrice(cost.totalMonthlyCost) : "..."}
              </span>
              <span className="text-base-content/60 text-sm">/mois</span>
            </div>
          </div>
        )}

        {/* PriceRange si min/max different */}
        {!isEditing && cost && minCost !== maxCost && (
          <PriceRange
            min={minCost}
            estimated={estimatedCost}
            max={maxCost}
            compact
            size="sm"
            className="text-xs"
          />
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer le projet"
        message={`Voulez-vous vraiment supprimer le projet "${project.name}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Modal de duplication */}
      <CloneDialog
        isOpen={showCloneDialog}
        type="project"
        sourceName={project.name}
        organizations={organizations}
        currentOrgId={project.organizationId}
        onClone={handleClone}
        onCancel={() => setShowCloneDialog(false)}
      />

      {/* Modal de deplacement */}
      <MoveProjectDialog
        isOpen={showMoveDialog}
        projectName={project.name}
        organizations={organizations}
        currentOrgId={project.organizationId}
        onMove={handleMove}
        onCancel={() => setShowMoveDialog(false)}
      />
    </>
  );
}
