import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icons, NumberInput, Portal } from "@/components/ui";
import { HOURS_PER_MONTH } from "@/constants";
import { formatMonthlyPrice, formatPrice } from "@/lib/costCalculator";
import { useRuntimeCardContext } from "./RuntimeCardContext";
import { RuntimeCardScaling } from "./RuntimeCardScaling";
import { RuntimeCardSchedule } from "./RuntimeCardSchedule";
import { CostGauge } from "./RuntimeCardShared";
import type { RuntimeCardModalProps } from "./types";

const FlavorPicker = lazy(() => import("../FlavorPicker"));

export const RuntimeCardModal = memo(function RuntimeCardModal({
  isOpen,
  onClose,
}: RuntimeCardModalProps) {
  const {
    runtime,
    instance,
    currentFlavor,
    cost,
    gaugePosition,
    defaultName,
    baseConfig,
    isEditingName,
    editName,
    onStartEditName,
    onSaveEditName,
    onCancelEditName,
    onResetName,
    onEditNameChange,
    onEditNameKeyDown,
    onFlavorChange,
    onBaseInstancesChange,
    onToggleScaling,
    onOpenDeleteConfirm,
  } = useRuntimeCardContext();

  const [showFlavorPicker, setShowFlavorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isEditingName) {
        onClose();
      }
    },
    [onClose, isEditingName],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, handleKeyDown]);

  const handleOpenFlavorPicker = useCallback(() => {
    setShowFlavorPicker(true);
  }, []);

  const handleCloseFlavorPicker = useCallback(() => {
    setShowFlavorPicker(false);
  }, []);

  const handleFlavorSelect = useCallback(
    (flavorName: string) => {
      onFlavorChange(flavorName);
      setShowFlavorPicker(false);
    },
    [onFlavorChange],
  );

  if (!isOpen) return null;

  const isScalingMode = runtime.scalingEnabled;
  const toggleId = `scaling-toggle-modal-${runtime.id}`;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-[#13172e]/80"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative bg-base-100 w-full max-w-5xl max-h-[90vh] flex flex-col border border-base-300 animate-in">
          <div className="p-6 border-b border-base-300 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {runtime.variantLogo ? (
                <div className="flex-shrink-0">
                  <img
                    src={runtime.variantLogo}
                    alt=""
                    className="w-12 h-12 object-contain bg-base-200 p-1.5"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-base-200 flex items-center justify-center flex-shrink-0">
                  <Icons.Server className="w-6 h-6 text-base-content/40" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                {isEditingName ? (
                  <div className="animate-in fade-in duration-200">
                    <div className="flex items-center gap-1">
                      <input
                        ref={inputRef}
                        type="text"
                        className="input input-bordered input-sm flex-1 font-bold text-base min-w-0"
                        value={editName}
                        onChange={onEditNameChange}
                        onKeyDown={onEditNameKeyDown}
                        placeholder="Nom du runtime..."
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square text-success hover:bg-success/10 cursor-pointer"
                        onClick={onSaveEditName}
                        aria-label="Sauvegarder"
                      >
                        <Icons.Check className="w-3.5 h-3.5" />
                      </button>
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip={`Reset: ${defaultName}`}
                      >
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-warning hover:bg-warning/10 cursor-pointer"
                          onClick={onResetName}
                          aria-label="Reinitialiser le nom"
                        >
                          <Icons.Refresh className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
                        onClick={onCancelEditName}
                        aria-label="Annuler"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h2 className="font-bold text-xl truncate">
                      {runtime.instanceName}
                    </h2>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square opacity-0 group-hover/name:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                      onClick={onStartEditName}
                      aria-label="Modifier le nom du runtime"
                    >
                      <Icons.Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <span className="badge badge-sm badge-ghost mt-1">
                  {runtime.instanceType}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              onClick={onClose}
              aria-label="Fermer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="bg-base-200 p-4">
                <h3 className="text-sm font-medium mb-4">Configuration</h3>

                <label
                  htmlFor={toggleId}
                  className="flex items-center justify-between p-3 bg-base-100 border border-base-300 cursor-pointer hover:bg-base-300/50 transition-colors mb-4"
                >
                  <div>
                    <div className="font-medium text-sm">
                      Scaling automatique
                    </div>
                    <div className="text-xs text-base-content/60">
                      {isScalingMode
                        ? "Configurez les profils de scaling ci-dessous"
                        : "Configuration fixe, ressources constantes"}
                    </div>
                  </div>
                  <input
                    id={toggleId}
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={runtime.scalingEnabled ?? false}
                    onChange={(e) => onToggleScaling(e.target.checked)}
                  />
                </label>

                {!isScalingMode && (
                  <div className="space-y-4">
                    <div>
                      <div className="label py-1">
                        <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
                          Taille d'instance
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-primary/50 hover:bg-base-100"
                        onClick={handleOpenFlavorPicker}
                      >
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-base">
                            {baseConfig.flavorName}
                          </span>
                          <span className="text-xs text-base-content/60">
                            {currentFlavor?.memory.formatted} -{" "}
                            {currentFlavor?.cpus} vCPU
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-primary font-bold">
                            {formatMonthlyPrice(
                              (currentFlavor?.price ?? 0) * HOURS_PER_MONTH,
                            )}
                          </span>
                        </div>
                      </button>
                    </div>

                    <div>
                      <div className="label py-1">
                        <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
                          Nombre d'instances
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <NumberInput
                          value={baseConfig.instances}
                          onChange={onBaseInstancesChange}
                          min={1}
                          max={instance?.maxInstances ?? 40}
                          size="sm"
                        />
                        <span className="text-sm text-base-content/60">
                          instance(s) permanente(s)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isScalingMode && (
                  <CostGauge
                    minCost={cost.minMonthlyCost}
                    maxCost={cost.maxMonthlyCost}
                    position={gaugePosition}
                  />
                )}
              </div>

              {isScalingMode && (
                <>
                  <div className="bg-base-200 p-4">
                    <h3 className="text-sm font-medium mb-4">
                      Profils de scaling
                    </h3>
                    <RuntimeCardScaling />
                  </div>

                  <div className="bg-base-200 p-4">
                    <RuntimeCardSchedule />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-base-300 bg-base-200 flex justify-between items-center">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-error hover:bg-error/10"
              onClick={() => {
                onClose();
                onOpenDeleteConfirm();
              }}
            >
              <Icons.Trash className="w-4 h-4" />
              Supprimer
            </button>

            <div className="flex items-center gap-6">
              {isScalingMode ? (
                <>
                  <div className="text-right">
                    <span className="text-xs text-base-content/50 block">
                      Min
                    </span>
                    <span className="font-mono text-sm">
                      {formatPrice(cost.minMonthlyCost)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-base-content/50 block">
                      Estime
                    </span>
                    <span className="font-mono text-lg font-bold text-primary">
                      {formatPrice(cost.estimatedTotalCost)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-base-content/50 block">
                      Max
                    </span>
                    <span className="font-mono text-sm">
                      {formatPrice(cost.maxMonthlyCost)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-right">
                  <span className="text-xs text-base-content/50 block">
                    Total mensuel
                  </span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {formatPrice(cost.estimatedTotalCost)}
                  </span>
                </div>
              )}
              <span className="text-xs text-base-content/50">/mois</span>
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          <FlavorPicker
            isOpen={showFlavorPicker}
            onClose={handleCloseFlavorPicker}
            flavors={instance?.flavors ?? []}
            selectedFlavor={baseConfig.flavorName}
            onSelect={handleFlavorSelect}
          />
        </Suspense>
      </div>
    </Portal>
  );
});
