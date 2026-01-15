import { memo } from 'react'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'

interface OrganizationCostBreakdownProps {
  totalRuntimesCost: number
  totalAddonsCost: number
  totalMonthlyCost: number
}

export const OrganizationCostBreakdown = memo(function OrganizationCostBreakdown({
  totalRuntimesCost,
  totalAddonsCost,
  totalMonthlyCost,
}: OrganizationCostBreakdownProps) {
  const runtimesPercent = totalMonthlyCost > 0 ? (totalRuntimesCost / totalMonthlyCost) * 100 : 0
  const addonsPercent = totalMonthlyCost > 0 ? (totalAddonsCost / totalMonthlyCost) * 100 : 0

  if (totalMonthlyCost === 0) {
    return null
  }

  return (
    <div
      className="card bg-base-100 border border-base-300"
      role="region"
      aria-label="Repartition des couts"
    >
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Icons.Chart className="w-4 h-4 text-primary" />
            Repartition des couts
          </h3>
          <span className="text-sm text-base-content/60">
            {formatPrice(totalMonthlyCost)}/mois
          </span>
        </div>

        {/* Barre de progression */}
        <div className="h-4 bg-base-200 rounded-full overflow-hidden flex">
          {runtimesPercent > 0 && (
            <div
              className="bg-primary h-full transition-all duration-700 ease-out"
              style={{ width: `${runtimesPercent}%` }}
              role="progressbar"
              aria-valuenow={runtimesPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Runtimes: ${runtimesPercent.toFixed(0)}%`}
            />
          )}
          {addonsPercent > 0 && (
            <div
              className="bg-secondary h-full transition-all duration-700 ease-out"
              style={{ width: `${addonsPercent}%` }}
              role="progressbar"
              aria-valuenow={addonsPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Addons: ${addonsPercent.toFixed(0)}%`}
            />
          )}
        </div>

        {/* Legende */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Runtimes</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-primary">{formatPrice(totalRuntimesCost)}</span>
              <span className="text-xs text-base-content/50 ml-1">({runtimesPercent.toFixed(0)}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" aria-hidden="true" />
              <span className="text-sm font-medium">Addons</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-secondary">{formatPrice(totalAddonsCost)}</span>
              <span className="text-xs text-base-content/50 ml-1">({addonsPercent.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
