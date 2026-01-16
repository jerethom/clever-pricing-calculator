import { memo, lazy, Suspense } from 'react'
import { formatPrice, formatHourlyPrice } from '@/lib/costCalculator'
import { useRuntimeCardContext } from './RuntimeCardContext'
import { RuntimeCardScaling } from './RuntimeCardScaling'
import { RuntimeCardSchedule } from './RuntimeCardSchedule'
import type { RuntimeCardAdvancedProps } from './types'

const TimeSlotEditor = lazy(() => import('@/components/timeSlot/TimeSlotEditor'))

export const RuntimeCardAdvanced = memo(function RuntimeCardAdvanced({
  className = '',
}: RuntimeCardAdvancedProps) {
  const {
    projectId,
    runtime,
    instance,
    cost,
    showTimeSlots,
    onToggleScaling,
  } = useRuntimeCardContext()

  const isFixedMode = !runtime.scalingEnabled

  return (
    <details className={`collapse collapse-arrow bg-base-200 ${className}`}>
      <summary className="collapse-title text-sm font-medium py-3 min-h-0">
        Options avancees
      </summary>
      <div className="collapse-content px-4 pb-4">
        <div className="space-y-4">
          {/* Toggle scaling automatique */}
          <label
            htmlFor={`scaling-toggle-${runtime.id}`}
            className="flex items-center justify-between p-3 bg-base-100 border border-base-300 cursor-pointer hover:bg-base-300/50 transition-colors"
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
              id={`scaling-toggle-${runtime.id}`}
              type="checkbox"
              className="toggle toggle-primary"
              checked={runtime.scalingEnabled ?? false}
              onChange={(e) => onToggleScaling(e.target.checked)}
              aria-describedby={`scaling-desc-${runtime.id}`}
            />
          </label>

          {/* Section scaling (visible si scaling active) */}
          {runtime.scalingEnabled && (
            <>
              {/* Profils de scaling */}
              <RuntimeCardScaling />

              {/* Planning hebdomadaire */}
              <RuntimeCardSchedule />

              {/* Editeur de planning (conditionnel) */}
              {showTimeSlots && (
                <div className="p-4 bg-base-100 border border-base-300 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Suspense fallback={null}>
                    <TimeSlotEditor
                      projectId={projectId}
                      runtimeId={runtime.id}
                      runtime={runtime}
                      instance={instance}
                    />
                  </Suspense>
                </div>
              )}
            </>
          )}

          {/* Details des couts */}
          <div className="border border-base-300 bg-base-100">
            <div className="px-4 py-3 border-b border-base-300">
              <span className="text-sm font-medium">Detail des couts</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {/* Cout de base */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{isFixedMode ? 'Configuration fixe' : 'Base (24/7)'}</span>
                  <span className="text-base-content/60 text-xs block">
                    {cost.baseInstances} inst. x {cost.baseFlavorName} x {formatHourlyPrice(cost.baseHourlyPrice)}
                  </span>
                </div>
                <span className="font-mono tabular-nums">
                  {formatPrice(cost.baseMonthlyCost)}
                </span>
              </div>

              {/* Cout scaling estime */}
              {cost.estimatedScalingCost > 0 && (
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">Scaling estime</span>
                    <span className="text-base-content/60 text-xs block">
                      {cost.scalingHours}h x niveau moyen {cost.averageLoadLevel.toFixed(1)}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums">
                    +{formatPrice(cost.estimatedScalingCost)}
                  </span>
                </div>
              )}

              {/* Separateur */}
              <div className="border-t border-base-300 pt-2">
                <div className="flex justify-between items-center font-medium">
                  <span>Total estime</span>
                  <span className="font-mono tabular-nums text-primary">
                    {formatPrice(cost.estimatedTotalCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  )
})
