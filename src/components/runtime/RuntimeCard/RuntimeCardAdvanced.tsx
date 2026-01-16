import { memo, lazy, Suspense } from 'react'
import { useRuntimeCardContext } from './RuntimeCardContext'
import { RuntimeCardScaling } from './RuntimeCardScaling'
import { RuntimeCardSchedule } from './RuntimeCardSchedule'
import { ProfileCostItem, FixedConfigItem, CostTotal } from './RuntimeCardShared'
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
          {runtime.scalingEnabled && (
            <>
              <RuntimeCardScaling />
              <RuntimeCardSchedule />

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

          <div className="border border-base-300 bg-base-100">
            <div className="px-4 py-3 border-b border-base-300">
              <span className="text-sm font-medium">Detail des couts</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
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
          </div>
        </div>
      </div>
    </details>
  )
})
