import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icons, ModalBase } from "@/components/ui";
import { useAddons } from "@/hooks/useAddons";
import { useModal } from "@/hooks/useModal";
import { calculateAddonCost } from "@/lib/addonCostCalculator";
import {
  getDefaultUsageEstimates,
  isUsageBasedAddon,
} from "@/lib/addonPricingRegistry";
import { sortFeaturesByPriority } from "@/lib/addonUtils";
import { formatMonthlyPrice, formatPrice } from "@/lib/costCalculator";
import { useProjectActions } from "@/store";
import type { AddonConfig, UsageEstimate } from "@/types";
import { UsageEstimateForm } from "./UsageEstimateForm";

const AddonForm = lazy(() => import("./AddonForm"));

interface AddonCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  addon: AddonConfig;
  onOpenDeleteConfirm: () => void;
}

export const AddonCardModal = memo(function AddonCardModal({
  isOpen,
  onClose,
  projectId,
  addon,
  onOpenDeleteConfirm,
}: AddonCardModalProps) {
  const { data: addonProviders } = useAddons();
  const { updateAddon } = useProjectActions();
  const [showEditForm, setShowEditForm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const provider = addonProviders?.find((p) => p.id === addon.providerId);
  const defaultName = provider?.name ?? addon.providerId;
  const plan = provider?.plans.find((p) => p.id === addon.planId);
  const features = plan?.features ? sortFeaturesByPriority(plan.features) : [];
  const isUsageBased = isUsageBasedAddon(addon.providerId);
  const addonCost = calculateAddonCost(addon);
  const isFree = addon.monthlyPrice === 0 && !isUsageBased;
  const displayPrice = isUsageBased
    ? addonCost.monthlyPrice
    : addon.monthlyPrice;
  const estimates =
    addon.usageEstimates ?? getDefaultUsageEstimates(addon.providerId) ?? [];

  useModal({ isOpen, onClose, preventClose: isEditingName || showEditForm });

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const handleStartEditName = useCallback(() => {
    setEditName(addon.providerName);
    setIsEditingName(true);
  }, [addon.providerName]);

  const handleSaveEditName = useCallback(() => {
    if (editName.trim()) {
      updateAddon(projectId, addon.id, { providerName: editName.trim() });
    }
    setIsEditingName(false);
  }, [editName, updateAddon, projectId, addon.id]);

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
  }, []);

  const handleResetName = useCallback(() => {
    updateAddon(projectId, addon.id, { providerName: defaultName });
    setIsEditingName(false);
  }, [updateAddon, projectId, addon.id, defaultName]);

  const handleUsageEstimateChange = useCallback(
    (newEstimates: UsageEstimate[]) => {
      updateAddon(projectId, addon.id, {
        usageEstimates: newEstimates,
        isUsageBased: true,
      });
    },
    [updateAddon, projectId, addon.id],
  );

  if (!isOpen) return null;

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="6xl"
      preventClose={isEditingName || showEditForm}
      className="max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-base-300 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {addon.providerLogo ? (
            <img
              src={addon.providerLogo}
              alt=""
              className="w-12 h-12 object-contain bg-base-200 p-1.5 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-base-200 flex items-center justify-center flex-shrink-0">
              <Icons.Puzzle className="w-6 h-6 text-base-content/40" />
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
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEditName();
                      if (e.key === "Escape") handleCancelEditName();
                    }}
                    placeholder="Nom de l'addon..."
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square text-success hover:bg-success/10"
                    onClick={handleSaveEditName}
                  >
                    <Icons.Check className="w-3.5 h-3.5" />
                  </button>
                  <div
                    className="tooltip tooltip-bottom"
                    data-tip={`Reset: ${defaultName}`}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-warning hover:bg-warning/10"
                      onClick={handleResetName}
                    >
                      <Icons.Refresh className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error hover:bg-error/10"
                    onClick={handleCancelEditName}
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <h2 className="font-bold text-xl truncate">
                  {addon.providerName}
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square opacity-0 group-hover/name:opacity-100 transition-opacity"
                  onClick={handleStartEditName}
                >
                  <Icons.Edit className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-sm badge-ghost">
                {addon.planName}
              </span>
              {isUsageBased ? (
                <span className="badge badge-sm badge-warning">Variable</span>
              ) : isFree ? (
                <span className="badge badge-sm badge-success">Gratuit</span>
              ) : (
                <span className="badge badge-sm badge-secondary">Fixe</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-baseline gap-1">
            <span className="text-2xl font-bold text-secondary">
              {isFree
                ? "Gratuit"
                : isUsageBased
                  ? `~${formatPrice(displayPrice)}`
                  : formatPrice(displayPrice)}
            </span>
            {!isFree && (
              <span className="text-base-content/50 text-sm">/mois</span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            onClick={onClose}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content - 2 colonnes */}
      <div className="flex-1 overflow-hidden flex">
        {/* Colonne gauche */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section Plan */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Icons.Puzzle className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">Plan actuel</h3>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-secondary/50 hover:bg-base-100"
              onClick={() => setShowEditForm(true)}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-base">
                  {addon.planName}
                </span>
                {features.length > 0 && (
                  <span className="text-xs text-base-content/60">
                    {features
                      .slice(0, 2)
                      .map((f) => f.value)
                      .join(" - ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-secondary font-bold">
                  {isFree ? "Gratuit" : formatMonthlyPrice(addon.monthlyPrice)}
                </span>
                <Icons.ChevronDown className="w-4 h-4 text-base-content/50" />
              </div>
            </button>
          </section>

          {/* Section Usage (si usage-based) */}
          {isUsageBased && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Icons.Chart className="w-5 h-5 text-warning" />
                <h3 className="font-semibold">Estimation d'usage</h3>
              </div>
              <div className="bg-base-200 p-4 border border-base-300">
                <UsageEstimateForm
                  providerId={addon.providerId}
                  estimates={estimates}
                  onChange={handleUsageEstimateChange}
                />
              </div>
            </section>
          )}

          {/* Section Features */}
          {features.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Icons.Check className="w-5 h-5 text-success" />
                <h3 className="font-semibold">Caracteristiques</h3>
              </div>
              <div className="space-y-2">
                {features.map((feature) => (
                  <div
                    key={feature.name}
                    className="flex justify-between items-center py-2 px-3 bg-base-200 text-sm"
                  >
                    <span className="text-base-content/70">{feature.name}</span>
                    <span className="font-medium font-mono tabular-nums">
                      {feature.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Colonne droite - sticky */}
        <div className="hidden lg:block w-80 xl:w-96 border-l border-base-300 bg-base-200 p-4 sm:p-6 overflow-y-auto">
          <div className="sticky top-0 space-y-4">
            <h3 className="font-semibold text-sm">Estimation mensuelle</h3>

            <div className="text-center py-4">
              <span className="text-4xl font-bold text-secondary">
                {isFree
                  ? "Gratuit"
                  : isUsageBased
                    ? `~${formatPrice(displayPrice)}`
                    : formatPrice(displayPrice)}
              </span>
              {!isFree && (
                <span className="text-base-content/50 ml-1">/mois</span>
              )}
            </div>

            {isUsageBased && (
              <div className="flex items-center justify-center gap-2">
                <Icons.Info className="w-4 h-4 text-info" />
                <span className="text-sm text-base-content/60">
                  Base sur votre usage estime
                </span>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Type</span>
                <span className="font-medium">
                  {isUsageBased ? "Variable" : isFree ? "Gratuit" : "Fixe"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Plan</span>
                <span className="font-medium">{addon.planName}</span>
              </div>
              {!isFree && !isUsageBased && (
                <div className="flex justify-between">
                  <span className="text-base-content/60">Prix de base</span>
                  <span className="font-mono">
                    {formatMonthlyPrice(addon.monthlyPrice)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-base-300 text-xs text-base-content/50">
              <div className="flex justify-between">
                <span>Provider</span>
                <span>{provider?.name ?? addon.providerId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-base-300 flex justify-between items-center">
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

        <div className="lg:hidden flex items-center gap-2">
          <span className="text-xl font-bold text-secondary">
            {isFree
              ? "Gratuit"
              : isUsageBased
                ? `~${formatPrice(displayPrice)}`
                : formatPrice(displayPrice)}
          </span>
          {!isFree && (
            <span className="text-xs text-base-content/50">/mois</span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>

      {/* Modal AddonForm pour changer de plan */}
      {showEditForm && (
        <Suspense fallback={null}>
          <AddonForm
            isOpen={showEditForm}
            projectId={projectId}
            onClose={() => setShowEditForm(false)}
            editingAddon={addon}
          />
        </Suspense>
      )}
    </ModalBase>
  );
});
