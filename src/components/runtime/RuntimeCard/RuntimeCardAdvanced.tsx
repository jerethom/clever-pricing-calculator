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
    activeScalingProfiles,
  } = useRuntimeCardContext()

  const isFixedMode = !runtime.scalingEnabled

  return (
    <details className={`collapse collapse-arrow bg-base-200 ${className}`}>
      <summary className="collapse-title text-sm font-medium py-3 min-h-0">
        Options avancees
      </summary>
      <div className="collapse-content px-4 pb-4">
        <div className="space-y-4">
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
              {isFixedMode ? (
                // Mode fixe : affichage simple
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">Configuration fixe</span>
                      <span className="text-base-content/60 text-xs block">
                        {cost.baseInstances} inst. x {cost.baseFlavorName} x {formatHourlyPrice(cost.baseHourlyPrice)}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums">
                      {formatPrice(cost.baseMonthlyCost)}
                    </span>
                  </div>
                </>
              ) : (
                // Mode scaling : affichage par profil uniquement
                <>
                  {activeScalingProfiles.length > 0 ? (
                    <div className="space-y-3">
                      {activeScalingProfiles.map(profile => {
                        const profileHours = cost.scalingHoursByProfile?.[profile.id] ?? 0
                        const profileCost = cost.scalingCostByProfile?.[profile.id] ?? 0
                        const totalProfileHours = 168
                        const displayHours = profileHours > 0 ? profileHours : totalProfileHours
                        return (
                          <div key={profile.id} className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{profile.name}</span>
                              <span className="text-base-content/60 text-xs block">
                                {profile.minInstances}-{profile.maxInstances} inst. ({profile.minFlavorName}-{profile.maxFlavorName})
                              </span>
                              <span className="text-base-content/50 text-xs">
                                {displayHours}h/sem
                              </span>
                            </div>
                            <span className="font-mono tabular-nums text-right">
                              {formatPrice(profileCost)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-base-content/60 text-sm">
                      Aucun profil de scaling actif
                    </div>
                  )}
                </>
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
