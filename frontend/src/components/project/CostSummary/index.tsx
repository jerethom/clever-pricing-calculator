import { memo, useState } from "react";
import { Icons, PriceRange } from "@/components/ui";
import { formatMonthlyPrice, formatPrice } from "@/lib/costCalculator";
import type { ProjectCostSummary } from "@/types";
import { CostAddonCard } from "./CostAddonCard";
import { CostBreakdownBar } from "./CostBreakdownBar";
import { CostRuntimeCard } from "./CostRuntimeCard";
import { DURATION_OPTIONS } from "./types";

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

  const projectedCost = cost.totalMonthlyCost * selectedMonths;

  return (
    <div className="space-y-6 animate-cost-fade-in">
      {/* 1. Estimation principale */}
      <div className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-300">
        <div className="card-body p-5">
          {/* Header: titre + selecteur duree */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Icons.TrendingUp className="w-5 h-5 text-primary" />
              Estimation
            </h3>
            <div className="flex gap-1">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.months}
                  type="button"
                  onClick={() => setSelectedMonths(option.months)}
                  className={`px-2.5 py-1 text-xs font-medium transition-all rounded ${
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

          {/* Estimation mensuelle mise en valeur */}
          <div className="text-center py-4">
            <p className="text-3xl sm:text-4xl font-bold text-primary tabular-nums">
              {formatPrice(cost.totalMonthlyCost)}
            </p>
            <p className="text-sm text-base-content/60 mt-1">par mois</p>
          </div>

          {/* PriceRange compact */}
          <PriceRange
            min={totalMinCost}
            estimated={cost.totalMonthlyCost}
            max={totalMaxCost}
            size="sm"
          />

          {/* Projection */}
          <div className="bg-base-200 rounded-lg p-3 mt-4 text-center">
            <span className="text-base-content/70 text-sm">
              Sur {selectedMonths} mois :{" "}
            </span>
            <span className="font-bold text-base tabular-nums">
              {formatPrice(projectedCost)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Repartition runtimes/addons */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icons.Server className="w-4 h-4 text-primary" />
                <span className="text-xs text-base-content/60 uppercase tracking-wide">
                  Runtimes
                </span>
              </div>
              <div className="font-bold text-xl text-primary tabular-nums">
                {formatPrice(cost.runtimesCost)}
              </div>
              <div className="text-xs text-base-content/50">
                {cost.runtimesDetail.length} instance(s)
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icons.Puzzle className="w-4 h-4 text-secondary" />
                <span className="text-xs text-base-content/60 uppercase tracking-wide">
                  Addons
                </span>
              </div>
              <div className="font-bold text-xl text-secondary tabular-nums">
                {formatPrice(cost.addonsCost)}
              </div>
              <div className="text-xs text-base-content/50">
                {cost.addonsDetail.length} service(s)
              </div>
            </div>
          </div>

          {/* Barre de repartition */}
          {cost.totalMonthlyCost > 0 && (
            <CostBreakdownBar
              runtimesCost={cost.runtimesCost}
              addonsCost={cost.addonsCost}
              total={cost.totalMonthlyCost}
            />
          )}
        </div>
      </div>

      {/* 3. Details Runtimes */}
      {cost.runtimesDetail.length > 0 && (
        <section
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
          <div className="grid gap-4 md:grid-cols-2">
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
        </section>
      )}

      {/* 4. Details Addons */}
      {cost.addonsDetail.length > 0 && (
        <section
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
          <div className="grid gap-4 md:grid-cols-2">
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
        </section>
      )}

      {/* Message si vide */}
      {cost.runtimesDetail.length === 0 && cost.addonsDetail.length === 0 && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center py-12">
            <Icons.TrendingUp className="w-12 h-12 text-base-content/20 mb-4" />
            <h3 className="font-semibold text-lg">Aucun element a facturer</h3>
            <p className="text-base-content/60">
              Ajoutez des runtimes ou des addons pour voir l'estimation des
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
