import { memo, useCallback, useMemo, useState } from "react";
import { ConfirmDialog, Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";

import { RuntimeCardContext } from "./RuntimeCardContext";
import { RuntimeCardModal } from "./RuntimeCardModal";
import type { RuntimeCardContextValue, RuntimeCardProps } from "./types";
import { useRuntimeCard } from "./useRuntimeCard";

export const RuntimeCard = memo(function RuntimeCard({
  projectId,
  runtime,
}: RuntimeCardProps) {
  const [showModal, setShowModal] = useState(false);

  const {
    instance,
    defaultName,
    currentFlavor,
    cost,
    gaugePosition,
    hasScaling,
    activeScalingProfiles,
    availableFlavors,
    baseConfig,

    isEditingName,
    editName,
    setEditName,

    onStartEditName,
    onSaveEditName,
    onCancelEditName,
    onResetName,
    onEditNameChange,
    onEditNameKeyDown,

    onFlavorChange,
    onOpenFlavorPicker,

    onBaseInstancesChange,

    onToggleScaling,

    onUpdateScalingProfile,
    onAddScalingProfile,
    onRemoveScalingProfile,

    onDelete,
    showDeleteConfirm,
    onOpenDeleteConfirm,
    onCloseDeleteConfirm,

    showTimeSlots,
    onToggleTimeSlots,
  } = useRuntimeCard({ projectId, runtime });

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const contextValue = useMemo<RuntimeCardContextValue>(
    () => ({
      projectId,
      runtime,
      instance,
      currentFlavor,
      cost,
      gaugePosition,
      defaultName,
      hasScaling,
      activeScalingProfiles,
      availableFlavors,
      baseConfig,

      isEditingName,
      editName,
      setEditName,

      onStartEditName,
      onSaveEditName,
      onCancelEditName,
      onResetName,
      onEditNameChange,
      onEditNameKeyDown,

      onOpenFlavorPicker,
      onFlavorChange,

      onBaseInstancesChange,
      onToggleScaling,

      onUpdateScalingProfile,
      onAddScalingProfile,
      onRemoveScalingProfile,

      showTimeSlots,
      onToggleTimeSlots,

      onOpenDeleteConfirm,
    }),
    [
      projectId,
      runtime,
      instance,
      currentFlavor,
      cost,
      gaugePosition,
      defaultName,
      hasScaling,
      activeScalingProfiles,
      availableFlavors,
      baseConfig,
      isEditingName,
      editName,
      setEditName,
      onStartEditName,
      onSaveEditName,
      onCancelEditName,
      onResetName,
      onEditNameChange,
      onEditNameKeyDown,
      onOpenFlavorPicker,
      onFlavorChange,
      onBaseInstancesChange,
      onToggleScaling,
      onUpdateScalingProfile,
      onAddScalingProfile,
      onRemoveScalingProfile,
      showTimeSlots,
      onToggleTimeSlots,
      onOpenDeleteConfirm,
    ],
  );

  const instancesDisplay = hasScaling
    ? `${activeScalingProfiles[0]?.minInstances ?? baseConfig.instances}-${activeScalingProfiles[0]?.maxInstances ?? baseConfig.instances} inst.`
    : `${baseConfig.instances} instance${baseConfig.instances > 1 ? "s" : ""}`;

  return (
    <RuntimeCardContext.Provider value={contextValue}>
      <button
        type="button"
        onClick={handleOpenModal}
        className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer w-full text-left"
      >
        <div className="card-body p-4 flex-row items-center gap-4">
          {runtime.variantLogo ? (
            <div className="flex-shrink-0">
              <img
                src={runtime.variantLogo}
                alt=""
                className="w-10 h-10 object-contain bg-base-200 p-1"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-base-200 flex items-center justify-center flex-shrink-0">
              <Icons.Server className="w-5 h-5 text-base-content/40" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base truncate">
                {runtime.instanceName}
              </h3>
              <span className="badge badge-sm badge-ghost">
                {runtime.instanceType}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {runtime.scalingEnabled ? (
                cost.averageLoadLevel > 0 ? (
                  <span className="badge badge-xs badge-warning gap-1">
                    <span className="w-1 h-1 bg-warning-content rounded-full animate-pulse" />
                    Scaling
                  </span>
                ) : (
                  <span className="badge badge-xs badge-primary">Scaling</span>
                )
              ) : (
                <span className="badge badge-xs badge-success">24/7</span>
              )}
              <span className="text-xs text-base-content/50">
                {instancesDisplay}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(cost.estimatedTotalCost)}
            </p>
            <span className="text-xs text-base-content/50">/mois</span>
          </div>
        </div>
      </button>

      <RuntimeCardModal isOpen={showModal} onClose={handleCloseModal} />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer le runtime"
        message={`Voulez-vous vraiment supprimer le runtime "${runtime.instanceName}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={onDelete}
        onCancel={onCloseDeleteConfirm}
      />
    </RuntimeCardContext.Provider>
  );
});

export type * from "./types";
