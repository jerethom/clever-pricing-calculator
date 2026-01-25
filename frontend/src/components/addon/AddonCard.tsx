import { memo, useCallback, useState } from "react";
import { ConfirmDialog, Icons } from "@/components/ui";
import { calculateAddonCost } from "@/lib/addonCostCalculator";
import { isUsageBasedAddon } from "@/lib/addonPricingRegistry";
import { formatPrice } from "@/lib/costCalculator";
import { useProjectActions } from "@/store";
import type { AddonConfig } from "@/types";
import { AddonCardModal } from "./AddonCardModal";

interface AddonCardProps {
  projectId: string;
  addon: AddonConfig;
}

export const AddonCard = memo(function AddonCard({
  projectId,
  addon,
}: AddonCardProps) {
  const { removeAddon } = useProjectActions();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isUsageBased = isUsageBasedAddon(addon.providerId);
  const addonCost = calculateAddonCost(addon);
  const isFree = addon.monthlyPrice === 0 && !isUsageBased;
  const displayPrice = isUsageBased
    ? addonCost.monthlyPrice
    : addon.monthlyPrice;

  const handleOpenModal = useCallback(() => setShowModal(true), []);
  const handleCloseModal = useCallback(() => setShowModal(false), []);
  const handleDelete = useCallback(() => {
    removeAddon(projectId, addon.id);
    setShowDeleteConfirm(false);
  }, [removeAddon, projectId, addon.id]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="card bg-base-100 border border-base-300 hover:border-secondary/30 transition-all hover:shadow-lg hover:shadow-secondary/5 cursor-pointer w-full text-left"
      >
        <div className="card-body p-4 flex-row items-center gap-4">
          {/* Logo */}
          {addon.providerLogo ? (
            <div className="flex-shrink-0">
              <img
                src={addon.providerLogo}
                alt=""
                className="w-10 h-10 object-contain bg-base-200 p-1"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-base-200 flex items-center justify-center flex-shrink-0">
              <Icons.Puzzle className="w-5 h-5 text-base-content/40" />
            </div>
          )}

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base truncate">
                {addon.providerName}
              </h3>
              <span className="badge badge-sm badge-ghost">
                {addon.planName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isUsageBased ? (
                <span className="badge badge-xs badge-warning">Variable</span>
              ) : isFree ? (
                <span className="badge badge-xs badge-success">Gratuit</span>
              ) : (
                <span className="badge badge-xs badge-secondary">Fixe</span>
              )}
            </div>
          </div>

          {/* Prix */}
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-bold text-secondary">
              {isFree
                ? "Gratuit"
                : isUsageBased
                  ? `~${formatPrice(displayPrice)}`
                  : formatPrice(displayPrice)}
            </p>
            {!isFree && (
              <span className="text-xs text-base-content/50">/mois</span>
            )}
          </div>
        </div>
      </button>

      <AddonCardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        projectId={projectId}
        addon={addon}
        onOpenDeleteConfirm={() => setShowDeleteConfirm(true)}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer l'addon"
        message={`Voulez-vous vraiment supprimer l'addon "${addon.providerName}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
});
