import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DropdownMenuItem } from "@/components/ui";
import {
  CloneDialog,
  ConfirmDialog,
  DropdownMenu,
  Icons,
} from "@/components/ui";
import { useAllProjectsCostsWithDescendants } from "@/hooks/useCostCalculation";
import { formatPrice } from "@/lib/costCalculator";
import {
  selectOrganizations,
  selectProjects,
  useProjectActions,
  useSelector,
  useToastStore,
} from "@/store";
import type { Organization } from "@/types";

interface OrganizationSelectorProps {
  onClose?: () => void;
}

interface OrganizationItemProps {
  organization: Organization;
  totalCost: number;
  isActive: boolean;
  onSelect: () => void;
  onCloneOrg: (org: Organization) => void;
  onDeleteOrg: (org: Organization) => void;
}

const OrganizationItem = memo(function OrganizationItem({
  organization,
  totalCost,
  isActive,
  onSelect,
  onCloneOrg,
  onDeleteOrg,
}: OrganizationItemProps) {
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

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 hover:bg-base-200 cursor-pointer transition-colors ${
        isActive ? "bg-primary/10" : ""
      }`}
    >
      <Link
        to="/org/$orgId"
        params={{ orgId: organization.id }}
        className="flex-1 flex items-center gap-2 min-w-0"
        onClick={onSelect}
      >
        <Icons.Building
          className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-base-content/60"}`}
        />
        <div className="flex-1 min-w-0">
          <span
            className={`block truncate text-sm ${isActive ? "text-primary font-medium" : "text-base-content"}`}
          >
            {organization.name}
          </span>
          <span className="block text-xs text-base-content/50 tabular-nums">
            {formatPrice(totalCost)}/mois
          </span>
        </div>
      </Link>
      <DropdownMenu
        items={orgMenuItems}
        trigger={
          <button
            type="button"
            className="p-1 hover:bg-base-300 rounded transition-colors"
            aria-label="Actions organisation"
          >
            <Icons.MoreHorizontal className="w-4 h-4 text-base-content/60" />
          </button>
        }
      />
    </div>
  );
});

export const OrganizationSelector = memo(function OrganizationSelector({
  onClose,
}: OrganizationSelectorProps) {
  const navigate = useNavigate();
  const { orgId: activeOrgId = null } = useParams({ strict: false });
  const organizations = useSelector(selectOrganizations);
  const allProjects = useSelector(selectProjects);
  const { createOrganization, cloneOrganization, deleteOrganization } =
    useProjectActions();
  const addToast = useToastStore((s) => s.addToast);
  const projectCosts = useAllProjectsCostsWithDescendants();

  const [isOpen, setIsOpen] = useState(false);
  const [cloneOrgTarget, setCloneOrgTarget] = useState<Organization | null>(
    null,
  );
  const [deleteOrgTarget, setDeleteOrgTarget] = useState<Organization | null>(
    null,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOrganization = useMemo(
    () => organizations.find((org) => org.id === activeOrgId),
    [organizations, activeOrgId],
  );

  const orgTotalCosts = useMemo(() => {
    const map = new Map<string, number>();
    for (const org of organizations) {
      const orgProjects = allProjects.filter(
        (p) => p.organizationId === org.id,
      );
      const total = orgProjects.reduce(
        (sum, p) => sum + (projectCosts.get(p.id)?.totalMonthlyCost ?? 0),
        0,
      );
      map.set(org.id, total);
    }
    return map;
  }, [organizations, allProjects, projectCosts]);

  // Handle click outside to close dropdown
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
      if (e.key === "Escape") {
        setIsOpen(false);
      }
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

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handleCreateOrganization = useCallback(() => {
    const name = `Organisation ${organizations.length + 1}`;
    const newOrgId = createOrganization(name);
    navigate({ to: "/org/$orgId", params: { orgId: newOrgId } });
    setIsOpen(false);
    onClose?.();
  }, [organizations.length, createOrganization, navigate, onClose]);

  const handleCloneOrg = useCallback(
    (newName: string) => {
      if (!cloneOrgTarget) return;
      const newOrgId = cloneOrganization(cloneOrgTarget.id, newName);
      setCloneOrgTarget(null);
      addToast("success", `Organisation "${newName}" creee avec succes`);
      navigate({ to: "/org/$orgId", params: { orgId: newOrgId } });
      setIsOpen(false);
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
    setIsOpen(false);
    onClose?.();
  }, [deleteOrgTarget, deleteOrganization, addToast, navigate, onClose]);

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10 transition-colors text-white/80 hover:text-white"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Icons.Building className="w-4 h-4" />
          <span className="max-w-32 truncate text-sm">
            {activeOrganization?.name ?? "Organisations"}
          </span>
          <Icons.ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50">
            {/* Header */}
            <div className="px-3 py-2 border-b border-base-300">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Organisations
              </span>
            </div>

            {/* Organizations list */}
            <div className="max-h-64 overflow-y-auto">
              {organizations.length === 0 ? (
                <div className="text-center py-6 px-4">
                  <Icons.Building className="w-8 h-8 mx-auto mb-2 text-base-content/30" />
                  <p className="text-sm text-base-content/60">
                    Aucune organisation
                  </p>
                </div>
              ) : (
                organizations.map((org) => (
                  <OrganizationItem
                    key={org.id}
                    organization={org}
                    totalCost={orgTotalCosts.get(org.id) ?? 0}
                    isActive={org.id === activeOrgId}
                    onSelect={handleSelect}
                    onCloneOrg={setCloneOrgTarget}
                    onDeleteOrg={setDeleteOrgTarget}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-base-300 p-2">
              <button
                type="button"
                onClick={handleCreateOrganization}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
              >
                <Icons.Plus className="w-4 h-4" />
                Nouvelle organisation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
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
    </>
  );
});
