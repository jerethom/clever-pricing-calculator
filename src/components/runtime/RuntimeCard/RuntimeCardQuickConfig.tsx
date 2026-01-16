import { memo } from 'react'
import { HOURS_PER_MONTH } from '@/constants'
import { formatMonthlyPrice, formatPrice } from '@/lib/costCalculator'
import { NumberInput } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardQuickConfigProps } from './types'

export const RuntimeCardQuickConfig = memo(function RuntimeCardQuickConfig({
  className = '',
}: RuntimeCardQuickConfigProps) {
  const {
    runtime,
    instance,
    currentFlavor,
    cost,
    gaugePosition,
    baseConfig,
    activeScalingProfiles,
    onOpenFlavorPicker,
    onBaseInstancesChange,
  } = useRuntimeCardContext()

  const isScalingMode = runtime.scalingEnabled

  return (
    <details className={`collapse collapse-arrow bg-base-200 ${className}`} open>
      <summary className="collapse-title text-sm font-medium py-3 min-h-0">
        Configuration
      </summary>
      <div className="collapse-content px-4 pb-4">
        {!isScalingMode ? (
          // Mode fixe : Flavor picker + Nombre d'instances
          <div className="space-y-4">
            {/* Selecteur de flavor */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Taille d'instance
                </span>
              </label>
              <button
                className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-primary/50 hover:bg-base-100"
                onClick={onOpenFlavorPicker}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold text-base">
                    {baseConfig.flavorName}
                  </span>
                  <span className="text-xs text-base-content/60">
                    {currentFlavor?.memory.formatted} - {currentFlavor?.cpus} vCPU
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-primary font-bold">
                    {formatMonthlyPrice(
                      (currentFlavor?.price ?? 0) * HOURS_PER_MONTH
                    )}
                  </span>
                </div>
              </button>
            </div>

            {/* Nombre d'instances */}
            <div>
              <label className="label py-1">
                <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Nombre d'instances
                </span>
              </label>
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
        ) : (
          // Mode scaling : Resume compact
          <div className="space-y-4">
            {/* Resume du scaling actif */}
            <div className="p-3 bg-base-100 border border-base-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Configuration de base</div>
                  <div className="text-xs text-base-content/60">
                    {baseConfig.instances} inst. x {baseConfig.flavorName}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={onOpenFlavorPicker}
                >
                  Modifier
                </button>
              </div>
            </div>

            {/* Resume des profils de scaling */}
            {activeScalingProfiles.length > 0 && (
              <div className="p-3 bg-base-100 border border-base-300">
                <div className="font-medium text-sm mb-2">Scaling actif</div>
                <div className="space-y-1">
                  {activeScalingProfiles.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between text-xs">
                      <span className="text-base-content/70">{profile.name}</span>
                      <span className="font-mono">
                        {profile.minInstances}-{profile.maxInstances} inst.
                      </span>
                    </div>
                  ))}
                </div>
                {cost.scalingHours > 0 && (
                  <div className="mt-2 pt-2 border-t border-base-300 text-xs text-base-content/60">
                    {cost.scalingHours}h de scaling planifiees / semaine
                  </div>
                )}
              </div>
            )}

            {/* Jauge min/max des couts */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-base-content/60 mb-1">
                <span>{formatPrice(cost.minMonthlyCost)}</span>
                <span>{formatPrice(cost.maxMonthlyCost)}</span>
              </div>
              <div className="h-2 bg-base-300 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, gaugePosition)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-base-content/50">Base seule</span>
                <span className="text-base-content/50">Scaling max</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </details>
  )
})
