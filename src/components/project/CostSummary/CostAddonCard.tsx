import { memo } from "react";
import { Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";
import type { CostAddonCardProps } from "./types";

export const CostAddonCard = memo(function CostAddonCard({
  addon,
}: CostAddonCardProps) {
  const hasUsageDetails = addon.isUsageBased && addon.usageDetails;

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-secondary/30 transition-colors duration-200">
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Icons.Puzzle className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{addon.providerName}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-secondary badge-sm badge-outline">
                  {addon.planName}
                </span>
                {addon.isUsageBased && (
                  <span className="badge badge-warning badge-sm badge-outline">
                    Variable
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-secondary text-lg">
              {addon.isEstimate ? "~" : ""}
              {formatPrice(addon.monthlyPrice)}
            </div>
            <div className="text-xs text-base-content/60">
              {addon.isEstimate ? "estimation" : "/mois"}
            </div>
          </div>
        </div>

        {hasUsageDetails && (
          <>
            <div className="divider my-2" />
            <div className="space-y-2">
              {addon.usageDetails?.map((detail) => (
                <div
                  key={detail.metricId}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base-content/70">
                      {detail.metricName}
                    </span>
                    <span className="badge badge-ghost badge-xs">
                      {detail.value} {detail.unit}
                    </span>
                    {detail.freeQuotaApplied > 0 && (
                      <span className="text-xs text-success">
                        ({detail.freeQuotaApplied} gratuit)
                      </span>
                    )}
                  </div>
                  <span className="font-medium">
                    {detail.cost > 0 ? formatPrice(detail.cost) : "Gratuit"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
