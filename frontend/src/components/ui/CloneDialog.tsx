import { memo, useEffect, useState } from "react";
import type { Organization } from "@/types";
import { Icons } from "./Icons";
import { ModalBase } from "./ModalBase";

interface CloneDialogProps {
  isOpen: boolean;
  type: "organization" | "project";
  sourceName: string;
  organizations?: Organization[];
  currentOrgId?: string;
  onClone: (newName: string, targetOrgId?: string) => void;
  onCancel: () => void;
}

export const CloneDialog = memo(function CloneDialog({
  isOpen,
  type,
  sourceName,
  organizations = [],
  currentOrgId,
  onClone,
  onCancel,
}: CloneDialogProps) {
  const [newName, setNewName] = useState("");
  const [targetOrgId, setTargetOrgId] = useState<string | undefined>(
    currentOrgId,
  );

  useEffect(() => {
    if (isOpen) {
      setNewName(`${sourceName} (copie)`);
      setTargetOrgId(currentOrgId);
    }
  }, [isOpen, sourceName, currentOrgId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onClone(newName.trim(), type === "project" ? targetOrgId : undefined);
    }
  };

  const title =
    type === "organization"
      ? "Dupliquer l'organisation"
      : "Dupliquer le projet";
  const description =
    type === "organization"
      ? "Tous les projets de cette organisation seront egalement dupliques."
      : "Choisissez un nom et une organisation cible pour la copie.";

  return (
    <ModalBase isOpen={isOpen} onClose={onCancel} maxWidth="md">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icons.Copy className="w-6 h-6 text-primary" />
            {title}
          </h3>
          <p className="py-2 text-base-content/80 text-sm">{description}</p>

          {/* Champ nom */}
          <div className="form-control mt-4">
            <label className="label" htmlFor="clone-name">
              <span className="label-text">Nouveau nom</span>
            </label>
            <input
              id="clone-name"
              type="text"
              className="input input-bordered w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de la copie..."
            />
          </div>

          {/* Selection organisation cible (seulement pour les projets) */}
          {type === "project" && organizations.length > 0 && (
            <div className="form-control mt-4">
              <label className="label" htmlFor="target-org">
                <span className="label-text">Organisation cible</span>
              </label>
              <select
                id="target-org"
                className="select select-bordered w-full"
                value={targetOrgId}
                onChange={(e) => setTargetOrgId(e.target.value)}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                    {org.id === currentOrgId ? " (actuelle)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            disabled={!newName.trim()}
          >
            <Icons.Copy className="w-4 h-4" />
            Dupliquer
          </button>
        </div>
      </form>
    </ModalBase>
  );
});
