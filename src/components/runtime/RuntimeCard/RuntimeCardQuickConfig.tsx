import { memo } from 'react'
import { HOURS_PER_MONTH } from '@/constants'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import { NumberInput } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import { CostGauge } from './RuntimeCardShared'
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
  const toggleId = `scaling-toggle-quick-${runtime.id}`

  return (
    <div className={`bg-base-200 ${className}`}>
      <div className="px-4 py-3 border-b border-base-300">
        <span className="text-sm font-medium">Configuration</span>
      </div>
      <div className="px-4 py-4">
        <label
          htmlFor={toggleId}
          className="flex items-center justify-between p-3 bg-base-100 border border-base-300 cursor-pointer hover:bg-base-300/50 transition-colors mb-4"
        >
          <div>
            <div className="font-medium text-sm">Scaling automatique</div>
            <div className="text-xs text-base-content/60">
              {isScalingMode
                ? 'Configurez les profils de scaling ci-dessous'
                : 'Configuration fixe, ressources constantes'}
            </div>
          </div>
          <input
            id={toggleId}
            type="checkbox"
            className="toggle toggle-primary"
            checked={runtime.scalingEnabled ?? false}
            onChange={e => onToggleScaling(e.target.checked)}
            aria-describedby={`scaling-desc-quick-${runtime.id}`}
          />
        </label>

        {!isScalingMode ? (
          <div className="space-y-4">
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
                  <span className="font-semibold text-base">{baseConfig.flavorName}</span>
                  <span className="text-xs text-base-content/60">
                    {currentFlavor?.memory.formatted} - {currentFlavor?.cpus} vCPU
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-primary font-bold">
                    {formatMonthlyPrice((currentFlavor?.price ?? 0) * HOURS_PER_MONTH)}
                  </span>
                </div>
              </button>
            </div>

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
                <span className="text-sm text-base-content/60">instance(s) permanente(s)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeScalingProfiles.length > 0 && (
              <div className="p-3 bg-base-100 border border-base-300">
                <div className="font-medium text-sm mb-2">Scaling actif</div>
                <div className="space-y-1">
                  {activeScalingProfiles.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between text-xs">
                      <span className="text-base-content/70">{profile.name}</span>
                      <span className="font-mono">{profile.minInstances}-{profile.maxInstances} inst.</span>
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

            <CostGauge
              minCost={cost.minMonthlyCost}
              maxCost={cost.maxMonthlyCost}
              position={gaugePosition}
              className="pt-2"
            />
          </div>
        )}
      </div>
    </div>
  )
})
