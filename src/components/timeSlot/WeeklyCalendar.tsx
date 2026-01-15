import { useState, useCallback, useRef } from 'react'
import type { WeeklySchedule, DayOfWeek } from '@/types'
import { DAYS_OF_WEEK, DAY_LABELS } from '@/types'
import { SelectionIndicator } from './SelectionIndicator'

interface WeeklyCalendarProps {
  schedule: WeeklySchedule
  onChange: (schedule: WeeklySchedule) => void
  maxExtraInstances: number
  paintValue: number
}

// Couleurs pour les différents niveaux d'instances (style Clever Cloud)
const getInstanceColor = (extra: number, max: number): string => {
  if (extra === 0) return 'bg-base-200'
  const intensity = Math.min(extra / max, 1)
  if (intensity <= 0.33) return 'bg-[#5754aa]/40'
  if (intensity <= 0.66) return 'bg-[#5754aa]/70'
  return 'bg-[#5754aa]'
}

// Couleur du texte selon le fond pour assurer le contraste
const getTextColor = (extra: number, max: number): string => {
  if (extra === 0) return 'text-base-content'
  const intensity = Math.min(extra / max, 1)
  if (intensity <= 0.33) return 'text-[#1c2045]'
  return 'text-white'
}

export function WeeklyCalendar({
  schedule,
  onChange,
  maxExtraInstances,
  paintValue,
}: WeeklyCalendarProps) {
  const [isPainting, setIsPainting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{
    day: DayOfWeek
    hour: number
  } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{
    day: DayOfWeek
    hour: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Vérifie si une cellule est dans la sélection actuelle
  const isInSelection = useCallback(
    (day: DayOfWeek, hour: number): boolean => {
      if (!selectionStart || !selectionEnd) return false

      const startDayIndex = DAYS_OF_WEEK.indexOf(selectionStart.day)
      const endDayIndex = DAYS_OF_WEEK.indexOf(selectionEnd.day)
      const currentDayIndex = DAYS_OF_WEEK.indexOf(day)

      const minDay = Math.min(startDayIndex, endDayIndex)
      const maxDay = Math.max(startDayIndex, endDayIndex)
      const minHour = Math.min(selectionStart.hour, selectionEnd.hour)
      const maxHour = Math.max(selectionStart.hour, selectionEnd.hour)

      return (
        currentDayIndex >= minDay &&
        currentDayIndex <= maxDay &&
        hour >= minHour &&
        hour <= maxHour
      )
    },
    [selectionStart, selectionEnd]
  )

  // Applique la sélection au schedule
  const applySelection = useCallback(() => {
    if (!selectionStart || !selectionEnd) return

    const newSchedule = { ...schedule }
    for (const day of DAYS_OF_WEEK) {
      newSchedule[day] = [...schedule[day]]
    }

    const startDayIndex = DAYS_OF_WEEK.indexOf(selectionStart.day)
    const endDayIndex = DAYS_OF_WEEK.indexOf(selectionEnd.day)
    const minDay = Math.min(startDayIndex, endDayIndex)
    const maxDay = Math.max(startDayIndex, endDayIndex)
    const minHour = Math.min(selectionStart.hour, selectionEnd.hour)
    const maxHour = Math.max(selectionStart.hour, selectionEnd.hour)

    for (let d = minDay; d <= maxDay; d++) {
      const day = DAYS_OF_WEEK[d]
      for (let h = minHour; h <= maxHour; h++) {
        newSchedule[day][h] = paintValue
      }
    }

    onChange(newSchedule)
  }, [selectionStart, selectionEnd, paintValue, schedule, onChange])

  // Début de la sélection (souris)
  const handleMouseDown = (day: DayOfWeek, hour: number) => {
    setIsPainting(true)
    setSelectionStart({ day, hour })
    setSelectionEnd({ day, hour })
  }

  // Extension de la sélection (souris)
  const handleMouseEnter = (day: DayOfWeek, hour: number) => {
    if (isPainting) {
      setSelectionEnd({ day, hour })
    }
  }

  // Fin de la sélection (souris)
  const handleMouseUp = () => {
    if (isPainting && selectionStart && selectionEnd) {
      applySelection()
    }
    setIsPainting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
  }

  // Gestion du mouse leave sur le conteneur
  const handleMouseLeave = () => {
    if (isPainting) {
      handleMouseUp()
    }
  }

  // Support tactile - début
  const handleTouchStart = (day: DayOfWeek, hour: number) => (e: React.TouchEvent) => {
    e.preventDefault()
    setIsPainting(true)
    setSelectionStart({ day, hour })
    setSelectionEnd({ day, hour })
  }

  // Support tactile - mouvement
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPainting || !containerRef.current) return

    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)

    if (element) {
      const cell = element.closest('[data-day][data-hour]')
      if (cell) {
        const day = cell.getAttribute('data-day') as DayOfWeek
        const hour = parseInt(cell.getAttribute('data-hour') || '0')
        setSelectionEnd({ day, hour })
      }
    }
  }

  // Support tactile - fin
  const handleTouchEnd = () => {
    handleMouseUp()
  }

  // Remplir toute une journée
  const handleDayClick = (day: DayOfWeek) => {
    const newSchedule = { ...schedule }
    for (const d of DAYS_OF_WEEK) {
      newSchedule[d] = [...schedule[d]]
    }
    newSchedule[day] = Array(24).fill(paintValue)
    onChange(newSchedule)
  }

  // Remplir toute une heure (tous les jours)
  const handleHourClick = (hour: number) => {
    const newSchedule = { ...schedule }
    for (const day of DAYS_OF_WEEK) {
      newSchedule[day] = [...schedule[day]]
      newSchedule[day][hour] = paintValue
    }
    onChange(newSchedule)
  }

  return (
    <>
      {/* Indicateur de sélection flottant */}
      <SelectionIndicator
        start={selectionStart}
        end={selectionEnd}
        paintValue={paintValue}
        isVisible={isPainting}
      />

      {/* Grille calendrier */}
      <div
        ref={containerRef}
        className="select-none overflow-x-auto"
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <table className="table table-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="w-12 text-center bg-base-200">
                <span className="text-xs text-base-content/50">UTC</span>
              </th>
              {DAYS_OF_WEEK.map(day => (
                <th
                  key={day}
                  className="text-center bg-base-200 px-1 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleDayClick(day)}
                  title={`Cliquez pour remplir tout ${DAY_LABELS[day]} avec +${paintValue}`}
                >
                  <span className="text-xs sm:text-sm">{DAY_LABELS[day]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, hour) => (
              <tr key={hour}>
                <td
                  className="text-center text-xs bg-base-200 font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleHourClick(hour)}
                  title={`Cliquez pour remplir ${hour}h tous les jours avec +${paintValue}`}
                >
                  {hour.toString().padStart(2, '0')}h
                </td>
                {DAYS_OF_WEEK.map(day => {
                  const extra = schedule[day][hour]
                  const inSelection = isInSelection(day, hour)
                  return (
                    <td
                      key={`${day}-${hour}`}
                      data-day={day}
                      data-hour={hour}
                      className={`
                        p-0 border border-base-300 cursor-pointer transition-colors
                        ${getInstanceColor(extra, maxExtraInstances)}
                        ${inSelection ? 'ring-2 ring-secondary ring-inset' : ''}
                        touch-none
                      `}
                      onMouseDown={() => handleMouseDown(day, hour)}
                      onMouseEnter={() => handleMouseEnter(day, hour)}
                      onTouchStart={handleTouchStart(day, hour)}
                      title={`${DAY_LABELS[day]} ${hour}h : +${extra} instance(s)`}
                      role="gridcell"
                      aria-label={`${DAY_LABELS[day]} ${hour}h, ${extra} instances supplémentaires`}
                    >
                      <div
                        className={`
                          w-8 h-6
                          sm:w-10 sm:h-7
                          md:w-8 md:h-6
                          flex items-center justify-center text-xs
                          ${getTextColor(extra, maxExtraInstances)}
                        `}
                      >
                        {extra > 0 && (
                          <span className="font-bold text-[10px] sm:text-xs">
                            {extra}
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <p className="text-sm text-base-content/60 mt-2">
        Cliquez sur les en-têtes pour remplir une colonne/ligne entière.
      </p>
    </>
  )
}
