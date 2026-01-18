import { memo } from "react";
import { formatPrice } from "@/lib/costCalculator";
import type { CostBreakdownBarProps } from "./types";

export const CostBreakdownBar = memo(function CostBreakdownBar({
  runtimesCost,
  addonsCost,
  total,
}: CostBreakdownBarProps) {
  const runtimesPercent = total > 0 ? (runtimesCost / total) * 100 : 0;
  const addonsPercent = total > 0 ? (addonsCost / total) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Repartition des couts</span>
        <span className="text-base-content/60">{formatPrice(total)}/mois</span>
      </div>
      <div className="h-4 bg-base-200 rounded-full overflow-hidden flex">
        {runtimesPercent > 0 && (
          <div
            className="bg-primary h-full transition-all duration-700 ease-out"
            style={{ width: `${runtimesPercent}%` }}
          />
        )}
        {addonsPercent > 0 && (
          <div
            className="bg-secondary h-full transition-all duration-700 ease-out"
            style={{ width: `${addonsPercent}%` }}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Runtimes ({runtimesPercent.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span>Addons ({addonsPercent.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
});
