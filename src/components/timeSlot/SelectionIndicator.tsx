import type { DayOfWeek } from '@/types'
import { DAY_LABELS, DAYS_OF_WEEK } from '@/types'
import { Portal } from '@/components/ui'

interface SelectionIndicatorProps {
  start: { day: DayOfWeek; hour: number } | null
  end: { day: DayOfWeek; hour: number } | null
  paintValue: number
  isVisible: boolean
}

export function SelectionIndicator({
  start,
  end,
  paintValue,
  isVisible,
}: SelectionIndicatorProps) {
  if (!isVisible || !start || !end) return null

  const startHour = Math.min(start.hour, end.hour)
  const endHour = Math.max(start.hour, end.hour)
  const hoursCount = endHour - startHour + 1

  const startDayIndex = DAYS_OF_WEEK.indexOf(start.day)
  const endDayIndex = DAYS_OF_WEEK.indexOf(end.day)
  const minDayIndex = Math.min(startDayIndex, endDayIndex)
  const maxDayIndex = Math.max(startDayIndex, endDayIndex)
  const daysCount = maxDayIndex - minDayIndex + 1
  const totalCells = hoursCount * daysCount

  const startDayLabel = DAY_LABELS[DAYS_OF_WEEK[minDayIndex]]
  const endDayLabel = DAY_LABELS[DAYS_OF_WEEK[maxDayIndex]]
  const isSameDay = minDayIndex === maxDayIndex

  return (
    <Portal>
      <div
        className="
          fixed bottom-4 left-1/2 -translate-x-1/2 z-50
          bg-accent text-accent-content
          px-4 py-2 shadow-lg
          flex items-center gap-3
          animate-in
        "
        role="status"
        aria-live="polite"
      >
        <div className="text-sm">
          <span className="font-semibold">
            {isSameDay
              ? `${startDayLabel} ${startHour}h-${endHour + 1}h`
              : `${startDayLabel}-${endDayLabel} ${startHour}h-${endHour + 1}h`}
          </span>
        </div>
        <div className="w-px h-4 bg-accent-content/30" />
        <div className="text-sm">
          <span className="opacity-70">Valeur : </span>
          <span className="font-bold">+{paintValue}</span>
        </div>
        <div className="w-px h-4 bg-accent-content/30" />
        <div className="text-sm opacity-70">
          {totalCells} créneau{totalCells > 1 ? 'x' : ''}
        </div>
      </div>
    </Portal>
  )
}
