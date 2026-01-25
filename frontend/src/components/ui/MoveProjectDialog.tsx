import { memo, useEffect, useState } from "react";
import type { Organization } from "@/types";
import { Icons } from "./Icons";
import { ModalBase } from "./ModalBase";

interface MoveProjectDialogProps {
  isOpen: boolean;
  projectName: string;
  organizations: Organization[];
  currentOrgId: string;
  onMove: (targetOrgId: string) => void;
  onCancel: () => void;
}

export const MoveProjectDialog = memo(function MoveProjectDialog({
  isOpen,
  projectName,
  organizations,
  currentOrgId,
  onMove,
  onCancel,
}: MoveProjectDialogProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedOrgId(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrgId) {
      onMove(selectedOrgId);
    }
  };

  // Filtrer pour ne pas afficher l'organisation actuelle en premier choix
  const availableOrgs = organizations.filter((org) => org.id !== currentOrgId);
  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  return (
    <ModalBase isOpen={isOpen} onClose={onCancel} maxWidth="md">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icons.Move className="w-6 h-6 text-primary" />
            Deplacer le projet
          </h3>
          <p className="py-2 text-base-content/80 text-sm">
            Selectionnez l'organisation vers laquelle deplacer le projet "
            {projectName}".
          </p>

          {/* Liste des organisations */}
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {/* Organisation actuelle (desactivee) */}
            {currentOrg && (
              <label
                className="flex items-center gap-3 p-3 border border-base-300 bg-base-200/50 cursor-not-allowed opacity-60"
                htmlFor={`org-${currentOrg.id}`}
              >
                <input
                  id={`org-${currentOrg.id}`}
                  type="radio"
                  name="target-org"
                  className="radio radio-sm"
                  disabled
                />
                <Icons.Building className="w-4 h-4 text-base-content/40" />
                <span className="flex-1 text-sm">{currentOrg.name}</span>
                <span className="badge badge-sm badge-ghost">actuelle</span>
              </label>
            )}

            {/* Autres organisations */}
            {availableOrgs.map((org) => (
              <label
                key={org.id}
                className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                  selectedOrgId === org.id
                    ? "border-primary bg-primary/10"
                    : "border-base-300 hover:border-base-content/30 hover:bg-base-200/50"
                }`}
                htmlFor={`org-${org.id}`}
              >
                <input
                  id={`org-${org.id}`}
                  type="radio"
                  name="target-org"
                  className="radio radio-sm radio-primary"
                  checked={selectedOrgId === org.id}
                  onChange={() => setSelectedOrgId(org.id)}
                />
                <Icons.Building className="w-4 h-4 text-base-content/60" />
                <span className="flex-1 text-sm">{org.name}</span>
              </label>
            ))}

            {availableOrgs.length === 0 && (
              <div className="text-center py-4 text-base-content/60 text-sm">
                Aucune autre organisation disponible.
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 bg-base-200 border-t border-base-300">
          <button
            type="button"
            className="btn btn-ghost hover:bg-base-300"
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedOrgId}
          >
            <Icons.Move className="w-4 h-4" />
            Deplacer
          </button>
        </div>
      </form>
    </ModalBase>
  );
});
