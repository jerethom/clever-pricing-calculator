import { memo } from 'react'
import { HOURS_PER_MONTH } from '@/constants'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import { NumberInput } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardConfigProps } from './types'

export const RuntimeCardConfig = memo(function RuntimeCardConfig({
  className = '',
}: RuntimeCardConfigProps) {
  const {
    runtime,
    instance,
    currentFlavor,
    baseConfig,
    onOpenFlavorPicker,
    onBaseInstancesChange,
    onToggleScaling,
  } = useRuntimeCardContext()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Configuration de base (seulement en mode fixe) */}
      {!runtime.scalingEnabled && (
        <>
          {/* Sélecteur de flavor */}
          <div>
            <label className="label py-1">
              <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
                Configuration
              </span>
            </label>
            <button
              className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-primary/50 hover:bg-base-200"
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
        </>
      )}

      {/* Switch scaling */}
      <div className="flex items-center justify-between p-3 bg-base-200 border border-base-300">
        <div>
          <div className="font-medium text-sm">Scaling automatique</div>
          <div className="text-xs text-base-content/60">
            {runtime.scalingEnabled
              ? 'Configurez les profils de scaling ci-dessous'
              : 'Configuration fixe, ressources constantes'}
          </div>
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={runtime.scalingEnabled ?? false}
          onChange={(e) => onToggleScaling(e.target.checked)}
        />
      </div>
    </div>
  )
})
