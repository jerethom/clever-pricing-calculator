import { useState, useCallback, useRef } from 'react'
import type { WeeklySchedule, DayOfWeek, HourlyConfig, LoadLevel, ScalingProfile } from '@/types'
import { DAYS_OF_WEEK, DAY_LABELS, createHourlyConfig, BASELINE_PROFILE_ID, LOAD_LEVEL_LABELS } from '@/types'
import { SelectionIndicator } from './SelectionIndicator'

interface WeeklyCalendarProps {
  schedule: WeeklySchedule
  onChange: (schedule: WeeklySchedule) => void
  profileId: string
  loadLevel: LoadLevel
  scalingProfiles: ScalingProfile[]
}

// Palette de couleurs pour les profils de scaling
const PROFILE_COLORS = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-amber-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-cyan-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
]

// Couleurs pour les différents niveaux de charge (style Clever Cloud)
const getLoadLevelColor = (config: HourlyConfig): string => {
  if (!config || config.profileId === BASELINE_PROFILE_ID || config.loadLevel === 0) {
    return 'bg-base-200'
  }
  const level = config.loadLevel
  if (level === 1) return 'bg-[#5754aa]/30'
  if (level === 2) return 'bg-[#5754aa]/50'
  if (level === 3) return 'bg-[#5754aa]/65'
  if (level === 4) return 'bg-[#5754aa]/80'
  return 'bg-[#5754aa]'
}

// Couleur du texte selon le fond pour assurer le contraste
const getTextColor = (config: HourlyConfig): string => {
  if (!config || config.profileId === BASELINE_PROFILE_ID || config.loadLevel === 0) {
    return 'text-base-content'
  }
  if (config.loadLevel <= 2) return 'text-[#1c2045] font-semibold'
  return 'text-white'
}

export function WeeklyCalendar({
  schedule,
  onChange,
  profileId,
  loadLevel,
  scalingProfiles,
}: WeeklyCalendarProps) {
  // Récupérer les infos d'affichage d'un profil (initiale + couleur)
  const getProfileDisplayInfo = useCallback(
    (pId: string): { initial: string; colorIndex: number } | null => {
      if (pId === BASELINE_PROFILE_ID) return null
      const profileIndex = scalingProfiles.findIndex(p => p.id === pId)
      if (profileIndex === -1) return null
      const profile = scalingProfiles[profileIndex]
      return {
        initial: profile.name.charAt(0).toUpperCase(),
        colorIndex: profileIndex % PROFILE_COLORS.length,
      }
    },
    [scalingProfiles]
  )
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

  // Crée la config à peindre (toujours associée au profil sélectionné)
  const paintConfig: HourlyConfig = createHourlyConfig(profileId, loadLevel)

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
        newSchedule[day][h] = { ...paintConfig }
      }
    }

    onChange(newSchedule)
  }, [selectionStart, selectionEnd, paintConfig, schedule, onChange])

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
    newSchedule[day] = Array(24).fill(null).map(() => ({ ...paintConfig }))
    onChange(newSchedule)
  }

  // Remplir toute une heure (tous les jours)
  const handleHourClick = (hour: number) => {
    const newSchedule = { ...schedule }
    for (const day of DAYS_OF_WEEK) {
      newSchedule[day] = [...schedule[day]]
      newSchedule[day][hour] = { ...paintConfig }
    }
    onChange(newSchedule)
  }

  return (
    <>
      {/* Indicateur de sélection flottant */}
      <SelectionIndicator
        start={selectionStart}
        end={selectionEnd}
        paintValue={loadLevel}
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
                  title={`Cliquez pour remplir tout ${DAY_LABELS[day]} avec niveau ${loadLevel}`}
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
                  title={`Cliquez pour remplir ${hour}h tous les jours avec niveau ${loadLevel}`}
                >
                  {hour.toString().padStart(2, '0')}h
                </td>
                {DAYS_OF_WEEK.map(day => {
                  const config = schedule[day][hour]
                  const inSelection = isInSelection(day, hour)
                  const displayLevel = config?.loadLevel ?? 0
                  const profileInfo = config ? getProfileDisplayInfo(config.profileId) : null
                  const badgeColor = profileInfo ? PROFILE_COLORS[profileInfo.colorIndex] : null

                  // Générer le tooltip enrichi
                  const profileName = profileInfo
                    ? scalingProfiles.find(p => p.id === config?.profileId)?.name
                    : null
                  const profile = profileName
                    ? scalingProfiles.find(p => p.id === config?.profileId)
                    : null
                  const tooltipLines = [
                    `${DAY_LABELS[day]} ${hour}h-${hour + 1}h`,
                    `Niveau : ${displayLevel} (${LOAD_LEVEL_LABELS[displayLevel as LoadLevel]})`,
                  ]
                  if (profile && displayLevel > 0) {
                    tooltipLines.push(`Profil : ${profile.name}`)
                    tooltipLines.push(`Ressources : ${profile.minInstances}-${profile.maxInstances} inst.`)
                  }
                  const tooltipText = tooltipLines.join('\n')

                  return (
                    <td
                      key={`${day}-${hour}`}
                      data-day={day}
                      data-hour={hour}
                      className={`
                        p-0 border border-base-300 cursor-pointer transition-colors
                        ${getLoadLevelColor(config)}
                        ${inSelection ? 'ring-2 ring-secondary ring-inset' : ''}
                        touch-none
                      `}
                      onMouseDown={() => handleMouseDown(day, hour)}
                      onMouseEnter={() => handleMouseEnter(day, hour)}
                      onTouchStart={handleTouchStart(day, hour)}
                      title={tooltipText}
                      role="gridcell"
                      aria-label={`${DAY_LABELS[day]} ${hour}h, niveau de charge ${displayLevel}`}
                    >
                      <div
                        className={`
                          relative
                          w-8 h-6
                          sm:w-10 sm:h-7
                          md:w-8 md:h-6
                          flex items-center justify-center text-xs
                          ${getTextColor(config)}
                        `}
                      >
                        {/* Badge du profil en haut à gauche avec couleur unique */}
                        {profileInfo && badgeColor && (
                          <span className={`absolute -top-0.5 -left-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 flex items-center justify-center ${badgeColor.bg} ${badgeColor.text} text-[8px] sm:text-[9px] font-bold rounded-full shadow-sm`}>
                            {profileInfo.initial}
                          </span>
                        )}
                        {/* Niveau de charge au centre */}
                        <span className={`font-bold text-[10px] sm:text-xs ${displayLevel === 0 ? 'opacity-30' : ''}`}>
                          {displayLevel}
                        </span>
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
