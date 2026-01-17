import { lazy, memo, Suspense, useCallback, useState } from "react";
import { ConfirmDialog, Icons } from "@/components/ui";
import { useAddons } from "@/hooks/useAddons";
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

interface AddonCardProps {
  projectId: string;
  addon: AddonConfig;
}

export const AddonCard = memo(function AddonCard({
  projectId,
  addon,
}: AddonCardProps) {
  const { data: addonProviders } = useAddons();
  const { removeAddon, updateAddon } = useProjectActions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  const provider = addonProviders?.find((p) => p.id === addon.providerId);
  const defaultName = provider?.name ?? addon.providerId;
  const plan = provider?.plans.find((p) => p.id === addon.planId);
  const features = plan?.features ? sortFeaturesByPriority(plan.features) : [];
  const mainFeatures = features.slice(0, 2);
  const mainFeatureText = mainFeatures.map((f) => f.value).join(" - ");
  const isUsageBased = isUsageBasedAddon(addon.providerId);
  const addonCost = calculateAddonCost(addon);
  const isFree = addon.monthlyPrice === 0 && !isUsageBased;
  const displayPrice = isUsageBased
    ? addonCost.monthlyPrice
    : addon.monthlyPrice;
  const estimates =
    addon.usageEstimates ?? getDefaultUsageEstimates(addon.providerId) ?? [];

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

  const handleDelete = useCallback(() => {
    removeAddon(projectId, addon.id);
    setShowDeleteConfirm(false);
  }, [removeAddon, projectId, addon.id]);

  const handleUsageEstimateChange = useCallback(
    (newEstimates: UsageEstimate[]) => {
      updateAddon(projectId, addon.id, {
        usageEstimates: newEstimates,
        isUsageBased: true,
      });
    },
    [updateAddon, projectId, addon.id],
  );

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
      <div className="card-body p-4 sm:p-6">
        {/* Header avec statut visuel */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {addon.providerLogo ? (
              <div className="relative flex-shrink-0">
                <img
                  src={addon.providerLogo}
                  alt=""
                  className="w-12 h-12 object-contain bg-base-200 p-1.5"
                />
                {/* Indicateur de statut */}
                <span
                  className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-base-100 ${
                    isFree ? "bg-success" : "bg-primary"
                  }`}
                  title={isFree ? "Plan gratuit" : "Plan payant"}
                />
              </div>
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
                      className="btn btn-ghost btn-xs btn-square text-success hover:bg-success/10 cursor-pointer"
                      onClick={handleSaveEditName}
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
                        onClick={handleResetName}
                        aria-label="Réinitialiser le nom"
                      >
                        <Icons.Refresh className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
                      onClick={handleCancelEditName}
                      aria-label="Annuler"
                    >
                      <Icons.X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 group/name">
                  <h3 className="font-bold text-base truncate">
                    {addon.providerName}
                  </h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square opacity-0 group-hover/name:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleStartEditName}
                    aria-label="Modifier le nom de l'addon"
                  >
                    <Icons.Edit className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="badge badge-sm badge-ghost">
                  {addon.planName}
                </span>
                {isUsageBased ? (
                  <span className="badge badge-sm badge-warning badge-outline">
                    Variable
                  </span>
                ) : isFree ? (
                  <span className="badge badge-sm badge-success badge-outline">
                    Gratuit
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action supprimer */}
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={`Supprimer ${addon.providerName}`}
          >
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration du plan - Bouton compact */}
        <div className="mt-4">
          <div className="py-1">
            <span className="text-xs font-medium uppercase tracking-wider text-base-content/60">
              Plan actuel
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-secondary/50 hover:bg-base-200 cursor-pointer"
            onClick={() => setShowEditForm(true)}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-semibold text-base">{addon.planName}</span>
              {mainFeatureText && (
                <span className="text-xs text-base-content/60">
                  {mainFeatureText}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-secondary font-bold">
                {isFree
                  ? "Gratuit"
                  : isUsageBased
                    ? `~${formatPrice(displayPrice)}/mois`
                    : formatMonthlyPrice(addon.monthlyPrice)}
              </span>
              <span className="text-xs text-base-content/60">
                <Icons.Edit className="w-3 h-3 inline mr-1" />
                Modifier
              </span>
            </div>
          </button>
        </div>

        {/* Section cout */}
        <div className="mt-4 overflow-hidden border border-base-300">
          {/* Cout principal mis en evidence */}
          <div className="bg-base-200 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/70">
                  Estimation mensuelle
                </p>
                <p className="text-2xl font-bold text-secondary">
                  {isFree
                    ? "Gratuit"
                    : isUsageBased
                      ? `~${formatPrice(displayPrice)}`
                      : formatMonthlyPrice(addon.monthlyPrice)}
                </p>
              </div>
              {isUsageBased ? (
                <span className="badge badge-info badge-sm">
                  <Icons.Info className="w-3 h-3 mr-1" />
                  Estimation
                </span>
              ) : isFree ? (
                <span className="badge badge-success badge-sm">
                  <Icons.Check className="w-3 h-3 mr-1" />
                  Inclus
                </span>
              ) : null}
            </div>
          </div>

          {/* Section estimation d'usage pour les addons usage-based */}
          {isUsageBased && (
            <details className="group">
              <summary className="px-4 py-2 bg-base-200 cursor-pointer flex items-center justify-between hover:bg-base-300 transition-colors list-none border-t border-base-300">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Icons.Chart className="w-4 h-4 text-warning" />
                  Estimer mon usage
                </span>
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>

              <div className="p-4 bg-base-100 border-t border-base-300">
                <UsageEstimateForm
                  providerId={addon.providerId}
                  estimates={estimates}
                  onChange={handleUsageEstimateChange}
                />
              </div>
            </details>
          )}

          {/* Detail collapse avec features */}
          {features.length > 0 && (
            <details className="group">
              <summary className="px-4 py-2 bg-base-200 cursor-pointer flex items-center justify-between hover:bg-base-300 transition-colors list-none border-t border-base-300">
                <span className="text-sm font-medium">
                  Voir les caracteristiques
                </span>
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>

              <div className="p-4 bg-base-100 border-t border-base-300">
                <div className="space-y-2">
                  {features.map((feature) => (
                    <div
                      key={feature.name}
                      className="flex justify-between items-center py-2 px-3 bg-base-200/50 text-sm"
                    >
                      <span className="text-base-content/70">
                        {feature.name}
                      </span>
                      <span className="font-medium font-mono tabular-nums">
                        {feature.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Modal d'edition */}
      {showEditForm && (
        <Suspense fallback={null}>
          <AddonForm
            projectId={projectId}
            onClose={() => setShowEditForm(false)}
            editingAddon={addon}
          />
        </Suspense>
      )}

      {/* Modal de confirmation de suppression */}
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
    </div>
  );
});
