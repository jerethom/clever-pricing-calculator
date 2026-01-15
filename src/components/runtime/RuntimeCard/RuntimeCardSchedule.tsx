import { memo } from 'react'
import { DAYS_OF_WEEK } from '@/types'
import { DAY_LETTERS } from '@/constants'
import { Icons } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardScheduleProps } from './types'

export const RuntimeCardSchedule = memo(function RuntimeCardSchedule({
  className = '',
}: RuntimeCardScheduleProps) {
  const { runtime, cost, showTimeSlots, onToggleTimeSlots } =
    useRuntimeCardContext()

  return (
    <div className={className}>
      <button
        className={`btn w-full justify-between h-auto py-3 px-4 ${
          showTimeSlots ? 'btn-primary' : 'btn-outline'
        }`}
        onClick={onToggleTimeSlots}
      >
        <div className="flex items-center gap-2">
          <Icons.Clock className="w-4 h-4" />
          <span>Planning hebdomadaire</span>
        </div>

        {/* Mini apercu du planning */}
        <div className="flex items-center gap-2">
          {/* Mini calendrier 7 jours */}
          <div className="hidden sm:flex gap-0.5">
            {DAYS_OF_WEEK.map((dayKey, i) => {
              const hasScaling =
                runtime.weeklySchedule?.[dayKey]?.some(h => h > 0) ?? false
              return (
                <div
                  key={dayKey}
                  className={`w-4 h-4 text-[8px] flex items-center justify-center font-bold ${
                    hasScaling
                      ? 'bg-warning text-warning-content'
                      : showTimeSlots
                        ? 'bg-primary-content/20 text-primary-content/50'
                        : 'bg-base-300 text-base-content/50'
                  }`}
                >
                  {DAY_LETTERS[i]}
                </div>
              )
            })}
          </div>

          <span
            className={`badge badge-sm ${showTimeSlots ? 'badge-ghost' : ''}`}
          >
            {cost.scalingHours > 0 ? `${cost.scalingHours}h` : '24/7'}
          </span>
        </div>
      </button>
    </div>
  )
})
