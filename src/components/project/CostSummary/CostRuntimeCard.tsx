import { memo } from "react";
import { Icons } from "@/components/ui";
import { formatHourlyPrice, formatPrice } from "@/lib/costCalculator";
import type { CostRuntimeCardProps } from "./types";

export const CostRuntimeCard = memo(function CostRuntimeCard({
  runtime,
}: CostRuntimeCardProps) {
  const hasScaling = runtime.scalingHours > 0;
  const hasCostRange = runtime.minMonthlyCost !== runtime.maxMonthlyCost;

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-colors duration-200">
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icons.Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{runtime.runtimeName}</h3>
              <p className="text-xs text-base-content/60">
                {runtime.instanceType}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-primary text-lg">
              {formatPrice(runtime.estimatedTotalCost)}
            </div>
            <div className="text-xs text-base-content/60">/mois</div>
          </div>
        </div>

        <div className="divider my-2" />

        {/* Configuration de base */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm">
                {runtime.baseFlavorName}
              </span>
              <span className="text-base-content/60">
                {runtime.baseInstances} inst. base
              </span>
            </div>
            <span className="font-medium">
              {formatPrice(runtime.baseMonthlyCost)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-base-content/60">
            <span>24/7 (730h/mois)</span>
            <span>{formatHourlyPrice(runtime.baseHourlyPrice)}</span>
          </div>
        </div>

        {/* Configuration de scaling */}
        {hasScaling && (
          <>
            <div className="divider my-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="badge badge-outline badge-sm">Scaling</span>
                  <span className="text-base-content/60">
                    niveau moyen {runtime.averageLoadLevel.toFixed(1)}
                  </span>
                </div>
                <span className="font-medium">
                  +{formatPrice(runtime.estimatedScalingCost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-base-content/60">
                <span>{runtime.scalingHours}h/sem avec scaling</span>
              </div>
            </div>
          </>
        )}

        {/* Fourchette de couts */}
        {hasCostRange && (
          <>
            <div className="divider my-2" />
            <div className="bg-base-200/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Chart className="w-4 h-4 text-primary/70" />
                <span className="text-xs font-medium">Fourchette de couts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <div className="text-xs text-base-content/60">Min</div>
                  <div className="font-medium">
                    {formatPrice(runtime.minMonthlyCost)}
                  </div>
                </div>
                <div className="flex-1 mx-3 h-1 bg-gradient-to-r from-success via-warning to-error rounded-full" />
                <div className="text-center">
                  <div className="text-xs text-base-content/60">Max</div>
                  <div className="font-medium">
                    {formatPrice(runtime.maxMonthlyCost)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
