import { useState, useCallback, useRef, useEffect } from 'react'
import type { WeeklySchedule, DayOfWeek } from '@/types'
import { DAYS_OF_WEEK, DAY_LABELS } from '@/types'
import { NumberInput } from '@/components/ui'

interface WeeklyCalendarProps {
  schedule: WeeklySchedule
  onChange: (schedule: WeeklySchedule) => void
  maxExtraInstances: number // max instances supplémentaires autorisées
}

// Couleurs pour les différents niveaux d'instances
const getInstanceColor = (extra: number, max: number): string => {
  if (extra === 0) return 'bg-base-200'
  const intensity = Math.min(extra / max, 1)
  if (intensity <= 0.33) return 'bg-primary/30'
  if (intensity <= 0.66) return 'bg-primary/60'
  return 'bg-primary'
}

export function WeeklyCalendar({ schedule, onChange, maxExtraInstances }: WeeklyCalendarProps) {
  const [paintValue, setPaintValue] = useState(1)
  const [isPainting, setIsPainting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ day: DayOfWeek; hour: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ day: DayOfWeek; hour: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ajuster paintValue si maxExtraInstances change
  useEffect(() => {
    if (paintValue > maxExtraInstances) {
      setPaintValue(Math.max(0, maxExtraInstances))
    }
  }, [maxExtraInstances, paintValue])

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

      return currentDayIndex >= minDay && currentDayIndex <= maxDay && hour >= minHour && hour <= maxHour
    },
    [selectionStart, selectionEnd]
  )

  // Début de la sélection
  const handleMouseDown = (day: DayOfWeek, hour: number) => {
    setIsPainting(true)
    setSelectionStart({ day, hour })
    setSelectionEnd({ day, hour })
  }

  // Extension de la sélection
  const handleMouseEnter = (day: DayOfWeek, hour: number) => {
    if (isPainting) {
      setSelectionEnd({ day, hour })
    }
  }

  // Fin de la sélection et application
  const handleMouseUp = () => {
    if (isPainting && selectionStart && selectionEnd) {
      const newSchedule = { ...schedule }

      // Cloner les tableaux pour éviter les mutations
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

  // Réinitialiser tout à 0
  const handleReset = () => {
    const newSchedule: WeeklySchedule = {} as WeeklySchedule
    for (const day of DAYS_OF_WEEK) {
      newSchedule[day] = Array(24).fill(0)
    }
    onChange(newSchedule)
  }

  return (
    <div className="space-y-4">
      {/* Contrôles */}
      <div className="flex items-end gap-4 flex-wrap">
        <NumberInput
          label="Instances supplémentaires à peindre"
          value={paintValue}
          onChange={setPaintValue}
          min={0}
          max={maxExtraInstances}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>
          Tout réinitialiser
        </button>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base-content/60">Légende :</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-base-200 border border-base-300 rounded"></div>
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-primary/30 border border-base-300 rounded"></div>
          <span>faible</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-primary/60 border border-base-300 rounded"></div>
          <span>moyen</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-primary border border-base-300 rounded"></div>
          <span>max</span>
        </div>
      </div>

      {/* Grille calendrier */}
      <div
        ref={containerRef}
        className="select-none overflow-x-auto"
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
      >
        <table className="table table-xs border-collapse">
          <thead>
            <tr>
              <th className="w-12 text-center bg-base-200">Heure</th>
              {DAYS_OF_WEEK.map(day => (
                <th key={day} className="text-center bg-base-200 px-1">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, hour) => (
              <tr key={hour}>
                <td className="text-center text-xs bg-base-200 font-mono">
                  {hour.toString().padStart(2, '0')}h
                </td>
                {DAYS_OF_WEEK.map(day => {
                  const extra = schedule[day][hour]
                  const inSelection = isInSelection(day, hour)
                  return (
                    <td
                      key={`${day}-${hour}`}
                      className={`
                        p-0 border border-base-300 cursor-pointer transition-colors
                        ${getInstanceColor(extra, maxExtraInstances)}
                        ${inSelection ? 'ring-2 ring-secondary ring-inset' : ''}
                      `}
                      onMouseDown={() => handleMouseDown(day, hour)}
                      onMouseEnter={() => handleMouseEnter(day, hour)}
                      title={`${DAY_LABELS[day]} ${hour}h : +${extra} instance(s)`}
                    >
                      <div className="w-8 h-6 flex items-center justify-center text-xs">
                        {extra > 0 && <span className="font-bold">{extra}</span>}
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
      <p className="text-sm text-base-content/60">
        Cliquez et faites glisser pour peindre les heures avec le nombre d'instances supplémentaires sélectionné.
      </p>
    </div>
  )
}
