import { useNavigate } from "@tanstack/react-router";
import { memo, useCallback, useState } from "react";
import { CloneDialog, ConfirmDialog, Icons } from "@/components/ui";
import { useProjectActions, useToastStore } from "@/store";
import type { Organization, Project, ProjectCostSummary } from "@/types";

// Formater les dates (hors du composant pour éviter les re-créations)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "Date invalide";
    }
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "Date invalide";
  }
};

// Fonction d'export CSV
function exportToCSV(
  organization: Organization,
  projects: Project[],
  projectCosts: Map<string, ProjectCostSummary>,
) {
  const rows: (string | number)[][] = [
    ["Projet", "Type", "Nom", "Cout mensuel (EUR)"],
  ];

  for (const project of projects) {
    const cost = projectCosts.get(project.id);
    if (!cost) continue;

    // Ajouter les runtimes
    for (const runtime of cost.runtimesDetail) {
      rows.push([
        project.name,
        "Runtime",
        runtime.runtimeName,
        Math.round(runtime.estimatedTotalCost * 100) / 100,
      ]);
    }

    // Ajouter les addons
    for (const addon of cost.addonsDetail) {
      rows.push([
        project.name,
        "Addon",
        addon.planName,
        Math.round(addon.monthlyPrice * 100) / 100,
      ]);
    }
  }

  // Convertir en CSV (guillemets uniquement pour les chaînes)
  const formatCell = (cell: string | number): string => {
    if (typeof cell === "number") return String(cell);
    return `"${cell.replace(/"/g, '""')}"`;
  };
  const csvContent = rows
    .map((row) => row.map(formatCell).join(","))
    .join("\n");

  // Creer et telecharger le fichier
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${organization.name.replace(/[^a-zA-Z0-9]/g, "_")}_couts.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface OrganizationHeaderProps {
  organization: Organization;
  projects: Project[];
  projectCosts: Map<string, ProjectCostSummary>;
  onUpdateName: (name: string) => void;
  onDelete: () => void;
}

export const OrganizationHeader = memo(function OrganizationHeader({
  organization,
  projects,
  projectCosts,
  onUpdateName,
  onDelete,
}: OrganizationHeaderProps) {
  const navigate = useNavigate();
  const { cloneOrganization } = useProjectActions();
  const addToast = useToastStore((s) => s.addToast);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  const handleStartEdit = useCallback(() => {
    setEditName(organization.name);
    setIsEditing(true);
  }, [organization.name]);

  const handleSaveEdit = useCallback(() => {
    if (editName.trim() && editName.trim() !== organization.name) {
      onUpdateName(editName.trim());
    }
    setIsEditing(false);
  }, [editName, organization.name, onUpdateName]);

  const handleCancelEdit = useCallback(() => setIsEditing(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  const handleExport = useCallback(() => {
    exportToCSV(organization, projects, projectCosts);
  }, [organization, projects, projectCosts]);

  const handleClone = useCallback(
    (newName: string) => {
      const newOrgId = cloneOrganization(organization.id, newName);
      setShowCloneDialog(false);
      addToast("success", `Organisation "${newName}" creee avec succes`);
      navigate({ to: "/org/$orgId", params: { orgId: newOrgId } });
    },
    [cloneOrganization, organization.id, addToast, navigate],
  );

  const hasDataToExport = projects.length > 0;

  return (
    <div className="space-y-4">
      {/* Ligne principale: Nom + Actions */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        {/* Nom de l'organisation */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="animate-in fade-in duration-200">
              <label
                htmlFor="org-name-input"
                className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2 block"
              >
                Renommer l'organisation
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="org-name-input"
                  type="text"
                  className="input input-bordered flex-1 font-semibold text-lg"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nom de l'organisation..."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary flex-1 sm:flex-none gap-2"
                    onClick={handleSaveEdit}
                  >
                    <Icons.Check className="w-4 h-4" />
                    <span>Sauvegarder</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleCancelEdit}
                    aria-label="Annuler"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 group">
                <Icons.Building className="w-5 h-5 text-primary shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {organization.name}
                </h1>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleStartEdit}
                  aria-label="Modifier le nom de l'organisation"
                >
                  <Icons.Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions desktop */}
        {!isEditing && (
          <div className="hidden sm:flex items-center gap-1">
            {/* Bouton Exporter */}
            {hasDataToExport && (
              <div
                className="tooltip tooltip-bottom"
                data-tip="Exporter en CSV"
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-base-content/50 hover:text-primary hover:bg-primary/10 cursor-pointer"
                  onClick={handleExport}
                  aria-label="Exporter les donnees en CSV"
                >
                  <Icons.Download className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Bouton Dupliquer */}
            <div
              className="tooltip tooltip-left"
              data-tip="Dupliquer cette organisation"
            >
              <button
                type="button"
                className="btn btn-ghost btn-sm text-base-content/50 hover:text-primary hover:bg-primary/10 cursor-pointer"
                onClick={() => setShowCloneDialog(true)}
                aria-label={`Dupliquer l'organisation ${organization.name}`}
              >
                <Icons.Copy className="w-4 h-4" />
              </button>
            </div>
            {/* Bouton Supprimer */}
            <div
              className="tooltip tooltip-left"
              data-tip="Supprimer cette organisation"
            >
              <button
                type="button"
                className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={`Supprimer l'organisation ${organization.name}`}
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata - dates */}
      {!isEditing && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/60">
          <div className="flex items-center gap-1.5">
            <Icons.Calendar className="w-3.5 h-3.5" />
            <span>Cree le {formatDate(organization.createdAt)}</span>
          </div>
          {organization.updatedAt !== organization.createdAt && (
            <>
              <span
                className="hidden sm:inline text-base-300"
                aria-hidden="true"
              >
                |
              </span>
              <div className="flex items-center gap-1.5">
                <Icons.Clock className="w-3.5 h-3.5" />
                <span>Modifie le {formatDate(organization.updatedAt)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions mobile */}
      {!isEditing && (
        <div className="sm:hidden pt-1 flex flex-col gap-1">
          {hasDataToExport && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-base-content/50 hover:text-primary hover:bg-primary/10 w-full justify-center gap-2 cursor-pointer"
              onClick={handleExport}
              aria-label="Exporter les donnees en CSV"
            >
              <Icons.Download className="w-4 h-4" />
              Exporter en CSV
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm text-base-content/50 hover:text-primary hover:bg-primary/10 w-full justify-center gap-2 cursor-pointer"
            onClick={() => setShowCloneDialog(true)}
            aria-label={`Dupliquer l'organisation ${organization.name}`}
          >
            <Icons.Copy className="w-4 h-4" />
            Dupliquer cette organisation
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10 w-full justify-center gap-2 cursor-pointer"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={`Supprimer l'organisation ${organization.name}`}
          >
            <Icons.Trash className="w-4 h-4" />
            Supprimer cette organisation
          </button>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer l'organisation"
        message={`Voulez-vous vraiment supprimer l'organisation "${organization.name}" et tous ses projets ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Modal de duplication */}
      <CloneDialog
        isOpen={showCloneDialog}
        type="organization"
        sourceName={organization.name}
        onClone={handleClone}
        onCancel={() => setShowCloneDialog(false)}
      />
    </div>
  );
});
