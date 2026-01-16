import { memo } from 'react'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import { ProfileCostItem, FixedConfigItem, CostGauge, CostTotal } from './RuntimeCardShared'
import type { RuntimeCardCostsProps } from './types'

export const RuntimeCardCosts = memo(function RuntimeCardCosts({
  className = '',
}: RuntimeCardCostsProps) {
  const { runtime, cost, gaugePosition, activeScalingProfiles } = useRuntimeCardContext()
  const isFixedMode = !runtime.scalingEnabled

  return (
    <div className={`overflow-hidden border border-base-300 ${className}`}>
      <div className="bg-base-200 p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-base-content/70">Estimation mensuelle</p>
            <p className="text-2xl font-bold text-primary">
              {formatPrice(cost.estimatedTotalCost)}
            </p>
          </div>
          {cost.scalingHours > 0 && (
            <span className="badge badge-warning badge-sm">
              <Icons.Clock className="w-3 h-3 mr-1" />
              {cost.scalingHours}h/sem
            </span>
          )}
        </div>

        {!isFixedMode && (
          <CostGauge
            minCost={cost.minMonthlyCost}
            maxCost={cost.maxMonthlyCost}
            position={gaugePosition}
            className="mt-4"
          />
        )}
      </div>

      <details className="group">
        <summary className="px-4 py-2 bg-base-200 cursor-pointer flex items-center justify-between hover:bg-base-300 transition-colors list-none">
          <span className="text-sm font-medium">Voir le detail</span>
          <Icons.ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>

        <div className="p-4 bg-base-100 space-y-3 text-sm border-t border-base-300">
          {isFixedMode ? (
            <FixedConfigItem
              instances={cost.baseInstances}
              flavorName={cost.baseFlavorName}
              hourlyPrice={cost.baseHourlyPrice}
              monthlyCost={cost.baseMonthlyCost}
            />
          ) : activeScalingProfiles.length > 0 ? (
            <div className="space-y-3">
              {activeScalingProfiles.map(profile => (
                <ProfileCostItem key={profile.id} profile={profile} cost={cost} />
              ))}
            </div>
          ) : (
            <div className="text-base-content/60 text-sm">
              Aucun profil de scaling actif
            </div>
          )}

          <CostTotal total={cost.estimatedTotalCost} />
        </div>
      </details>
    </div>
  )
})
