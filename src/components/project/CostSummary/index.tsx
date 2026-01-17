import { memo, useState } from "react";
import { Icons } from "@/components/ui";
import { formatMonthlyPrice, formatPrice } from "@/lib/costCalculator";
import type { ProjectCostSummary } from "@/types";
import { CostAddonCard } from "./CostAddonCard";
import { CostBreakdownBar } from "./CostBreakdownBar";
import { CostRuntimeCard } from "./CostRuntimeCard";
import { DURATION_OPTIONS, formatDurationLabel } from "./types";

interface CostSummaryProps {
  cost: ProjectCostSummary;
}

const CostSummary = memo(function CostSummary({ cost }: CostSummaryProps) {
  const [selectedMonths, setSelectedMonths] = useState(12);

  const totalMinCost =
    cost.runtimesDetail.reduce((sum, r) => sum + r.minMonthlyCost, 0) +
    cost.addonsCost;
  const totalMaxCost =
    cost.runtimesDetail.reduce((sum, r) => sum + r.maxMonthlyCost, 0) +
    cost.addonsCost;
  const hasCostRange = totalMinCost !== totalMaxCost;

  const projectedCost = cost.totalMonthlyCost * selectedMonths;
  const projectedMinCost = totalMinCost * selectedMonths;
  const projectedMaxCost = totalMaxCost * selectedMonths;

  return (
    <div className="space-y-6 animate-cost-fade-in">
      {/* Carte principale de projection */}
      <div className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-300">
        <div className="card-body p-4 sm:p-6">
          {/* Header avec selecteur de duree */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Icons.TrendingUp className="w-5 h-5 text-primary" />
              Projections
            </h3>
            <div className="flex flex-wrap gap-1">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.months}
                  type="button"
                  onClick={() => setSelectedMonths(option.months)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all rounded ${
                    selectedMonths === option.months
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content/70 hover:bg-base-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grille mensuel / projection */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Cout mensuel */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base-content/60 text-sm">
                <Icons.Clock className="w-4 h-4" />
                <span>Mensuel</span>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {formatPrice(cost.totalMonthlyCost)}
              </p>
              {hasCostRange && (
                <p className="text-sm text-base-content/50 tabular-nums">
                  Plage: {formatPrice(totalMinCost)} -{" "}
                  {formatPrice(totalMaxCost)}
                </p>
              )}
            </div>

            {/* Projection */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base-content/60 text-sm">
                <Icons.Calendar className="w-4 h-4" />
                <span>{formatDurationLabel(selectedMonths)}</span>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {formatPrice(projectedCost)}
              </p>
              {hasCostRange && (
                <p className="text-sm text-base-content/50 tabular-nums">
                  Plage: {formatPrice(projectedMinCost)} -{" "}
                  {formatPrice(projectedMaxCost)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides et repartition */}
      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="card-body p-5">
          {/* Stats rapides */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icons.Server className="w-4 h-4 text-primary" />
                <span className="text-xs text-base-content/60 uppercase tracking-wide">
                  Runtimes
                </span>
              </div>
              <div className="font-bold text-2xl text-primary">
                {formatPrice(cost.runtimesCost)}
              </div>
              <div className="text-xs text-base-content/50">
                {cost.runtimesDetail.length} instance(s)
              </div>
            </div>
            <div className="hidden sm:block divider divider-horizontal mx-0 h-16" />
            <div className="sm:hidden divider my-0" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icons.Puzzle className="w-4 h-4 text-secondary" />
                <span className="text-xs text-base-content/60 uppercase tracking-wide">
                  Addons
                </span>
              </div>
              <div className="font-bold text-2xl text-secondary">
                {formatPrice(cost.addonsCost)}
              </div>
              <div className="text-xs text-base-content/50">
                {cost.addonsDetail.length} service(s)
              </div>
            </div>
          </div>

          {/* Barre de repartition */}
          {cost.totalMonthlyCost > 0 && (
            <>
              <div className="divider my-2" />
              <CostBreakdownBar
                runtimesCost={cost.runtimesCost}
                addonsCost={cost.addonsCost}
                total={cost.totalMonthlyCost}
              />
            </>
          )}
        </div>
      </div>

      {/* Detail des runtimes */}
      {cost.runtimesDetail.length > 0 && (
        <div
          className="space-y-4 animate-cost-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-2">
            <Icons.Server className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Runtimes</h2>
            <span className="badge badge-primary badge-sm">
              {cost.runtimesDetail.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cost.runtimesDetail.map((runtime, index) => (
              <div
                key={runtime.runtimeId}
                className="animate-cost-item-fade-in"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <CostRuntimeCard runtime={runtime} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
              <span className="text-sm text-base-content/70">
                Total Runtimes:{" "}
              </span>
              <span className="font-bold text-primary">
                {formatMonthlyPrice(cost.runtimesCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detail des addons */}
      {cost.addonsDetail.length > 0 && (
        <div
          className="space-y-4 animate-cost-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center gap-2">
            <Icons.Puzzle className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold">Addons</h2>
            <span className="badge badge-secondary badge-sm">
              {cost.addonsDetail.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cost.addonsDetail.map((addon, index) => (
              <div
                key={addon.addonId}
                className="animate-cost-item-fade-in"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <CostAddonCard addon={addon} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="bg-secondary/5 border border-secondary/20 rounded-lg px-4 py-2">
              <span className="text-sm text-base-content/70">
                Total Addons:{" "}
              </span>
              <span className="font-bold text-secondary">
                {formatMonthlyPrice(cost.addonsCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Message si vide */}
      {cost.runtimesDetail.length === 0 && cost.addonsDetail.length === 0 && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center py-12">
            <Icons.TrendingUp className="w-12 h-12 text-base-content/20 mb-4" />
            <h3 className="font-semibold text-lg">Aucun element a facturer</h3>
            <p className="text-base-content/60">
              Ajoutez des runtimes ou des addons pour voir la projection des
              couts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export { CostSummary };
export default CostSummary;
