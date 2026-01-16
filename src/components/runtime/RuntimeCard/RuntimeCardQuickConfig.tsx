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
    onToggleScaling,
  } = useRuntimeCardContext()

  const isScalingMode = runtime.scalingEnabled

  return (
    <div className={`bg-base-200 ${className}`}>
      <div className="px-4 py-3 border-b border-base-300">
        <span className="text-sm font-medium">Configuration</span>
      </div>
      <div className="px-4 py-4">
        {/* Switch scaling automatique - toujours visible */}
        <label
          htmlFor={`scaling-toggle-quick-${runtime.id}`}
          className="flex items-center justify-between p-3 bg-base-100 border border-base-300 cursor-pointer hover:bg-base-300/50 transition-colors mb-4"
        >
          <div>
            <div className="font-medium text-sm">Scaling automatique</div>
            <div className="text-xs text-base-content/60">
              {runtime.scalingEnabled
                ? 'Configurez les profils de scaling ci-dessous'
                : 'Configuration fixe, ressources constantes'}
            </div>
          </div>
          <input
            id={`scaling-toggle-quick-${runtime.id}`}
            type="checkbox"
            className="toggle toggle-primary"
            checked={runtime.scalingEnabled ?? false}
            onChange={(e) => onToggleScaling(e.target.checked)}
            aria-describedby={`scaling-desc-quick-${runtime.id}`}
          />
        </label>

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
          // Mode scaling : Resume compact (sans config de base)
          <div className="space-y-4">
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
    </div>
  )
})
