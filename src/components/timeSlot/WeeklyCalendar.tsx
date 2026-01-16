import { useState, useCallback, useRef, useMemo, memo, useEffect } from 'react'
import type { WeeklySchedule, DayOfWeek, HourlyConfig, LoadLevel, ScalingProfile } from '@/types'
import { DAYS_OF_WEEK, DAY_LABELS, createHourlyConfig, BASELINE_PROFILE_ID, LOAD_LEVEL_LABELS } from '@/types'
import { SelectionIndicator } from './SelectionIndicator'

// Utilitaire de throttle pour limiter les appels a 60fps (16ms)
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeSinceLastCall >= delay) {
      lastCall = now
      fn(...args)
    } else if (!timeoutId) {
      // Planifier l'execution pour la prochaine frame disponible
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn(...args)
      }, delay - timeSinceLastCall)
    }
  }) as T
}

// Precalculer les index des jours pour eviter les indexOf repetitifs
const DAY_INDEX_MAP: Record<DayOfWeek, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
}

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

// Type pour les infos de cellule precalculees
interface CellDisplayInfo {
  bgColor: string
  textColor: string
  displayLevel: number
  profileInfo: { initial: string; colorIndex: number } | null
  badgeColor: typeof PROFILE_COLORS[number] | null
  tooltipText: string
}

// Props pour le composant CalendarCell memoise
interface CalendarCellProps {
  day: DayOfWeek
  hour: number
  cellInfo: CellDisplayInfo
  inSelection: boolean
  onMouseDown: (day: DayOfWeek, hour: number) => void
  onMouseEnter: (day: DayOfWeek, hour: number) => void
  onTouchStart: (e: React.TouchEvent, day: DayOfWeek, hour: number) => void
}

// Composant CalendarCell memoise pour eviter les re-renders inutiles
const CalendarCell = memo(function CalendarCell({
  day,
  hour,
  cellInfo,
  inSelection,
  onMouseDown,
  onMouseEnter,
  onTouchStart,
}: CalendarCellProps) {
  const { bgColor, textColor, displayLevel, profileInfo, badgeColor, tooltipText } = cellInfo

  // Handlers inline avec closure - evite la creation de nouvelles fonctions a chaque render parent
  const handleMouseDown = useCallback(() => {
    onMouseDown(day, hour)
  }, [onMouseDown, day, hour])

  const handleMouseEnter = useCallback(() => {
    onMouseEnter(day, hour)
  }, [onMouseEnter, day, hour])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    onTouchStart(e, day, hour)
  }, [onTouchStart, day, hour])

  return (
    <td
      data-day={day}
      data-hour={hour}
      className={`
        p-0 border border-base-300 cursor-pointer transition-colors
        ${bgColor}
        ${inSelection ? 'ring-2 ring-secondary ring-inset' : ''}
        touch-none
      `}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
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
          ${textColor}
        `}
      >
        {/* Badge du profil en haut a gauche avec couleur unique */}
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
})

export function WeeklyCalendar({
  schedule,
  onChange,
  profileId,
  loadLevel,
  scalingProfiles,
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
  const isPaintingRef = useRef(false) // Ref pour le throttle

  // Synchroniser la ref avec l'etat via useEffect pour eviter l'acces pendant le render
  useEffect(() => {
    isPaintingRef.current = isPainting
  }, [isPainting])

  // Cree la config a peindre (toujours associee au profil selectionne) - memoise
  const paintConfig: HourlyConfig = useMemo(
    () => createHourlyConfig(profileId, loadLevel),
    [profileId, loadLevel]
  )

  // Map des profils pour acces O(1) - memoise
  const profilesMap = useMemo(() => {
    const map = new Map<string, { profile: ScalingProfile; index: number }>()
    scalingProfiles.forEach((p, index) => {
      map.set(p.id, { profile: p, index })
    })
    return map
  }, [scalingProfiles])

  // Precalculer toutes les infos de cellules une seule fois par render (168 cellules)
  const cellsDisplayInfo = useMemo(() => {
    const info: Record<string, Record<number, CellDisplayInfo>> = {}

    for (const day of DAYS_OF_WEEK) {
      info[day] = {}
      for (let hour = 0; hour < 24; hour++) {
        const config = schedule[day][hour]
        const displayLevel = config?.loadLevel ?? 0

        // Calcul profile info avec la map pour O(1)
        let profileInfo: { initial: string; colorIndex: number } | null = null
        let badgeColor: typeof PROFILE_COLORS[number] | null = null

        if (config && config.profileId !== BASELINE_PROFILE_ID) {
          const profileData = profilesMap.get(config.profileId)
          if (profileData) {
            profileInfo = {
              initial: profileData.profile.name.charAt(0).toUpperCase(),
              colorIndex: profileData.index % PROFILE_COLORS.length,
            }
            badgeColor = PROFILE_COLORS[profileInfo.colorIndex]
          }
        }

        // Generer le tooltip enrichi
        const tooltipLines = [
          `${DAY_LABELS[day]} ${hour}h-${hour + 1}h`,
          `Niveau : ${displayLevel} (${LOAD_LEVEL_LABELS[displayLevel as LoadLevel]})`,
        ]
        if (profileInfo && displayLevel > 0) {
          const profileData = profilesMap.get(config?.profileId ?? '')
          if (profileData) {
            tooltipLines.push(`Profil : ${profileData.profile.name}`)
            tooltipLines.push(`Ressources : ${profileData.profile.minInstances}-${profileData.profile.maxInstances} inst.`)
          }
        }

        info[day][hour] = {
          bgColor: getLoadLevelColor(config),
          textColor: getTextColor(config),
          displayLevel,
          profileInfo,
          badgeColor,
          tooltipText: tooltipLines.join('\n'),
        }
      }
    }

    return info
  }, [schedule, profilesMap])

  // Precalculer un Set des cellules selectionnees pour O(1) lookup au lieu de O(n) calcul par cellule
  const selectedCellsSet = useMemo(() => {
    const set = new Set<string>()
    if (!selectionStart || !selectionEnd) return set

    const startDayIndex = DAY_INDEX_MAP[selectionStart.day]
    const endDayIndex = DAY_INDEX_MAP[selectionEnd.day]

    const minDay = Math.min(startDayIndex, endDayIndex)
    const maxDay = Math.max(startDayIndex, endDayIndex)
    const minHour = Math.min(selectionStart.hour, selectionEnd.hour)
    const maxHour = Math.max(selectionStart.hour, selectionEnd.hour)

    for (let d = minDay; d <= maxDay; d++) {
      const day = DAYS_OF_WEEK[d]
      for (let h = minHour; h <= maxHour; h++) {
        set.add(`${day}-${h}`)
      }
    }

    return set
  }, [selectionStart, selectionEnd])

  // Applique la selection au schedule - memoise
  const applySelection = useCallback(() => {
    if (!selectionStart || !selectionEnd) return

    const newSchedule = { ...schedule }
    for (const day of DAYS_OF_WEEK) {
      newSchedule[day] = [...schedule[day]]
    }

    const startDayIndex = DAY_INDEX_MAP[selectionStart.day]
    const endDayIndex = DAY_INDEX_MAP[selectionEnd.day]
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

  // Debut de la selection (souris) - memoise
  const handleMouseDown = useCallback((day: DayOfWeek, hour: number) => {
    setIsPainting(true)
    setSelectionStart({ day, hour })
    setSelectionEnd({ day, hour })
  }, [])

  // Extension de la selection (souris) - throttle a 60fps (16ms)
  const handleMouseEnterThrottled = useMemo(
    () => throttle((day: DayOfWeek, hour: number) => {
      if (isPaintingRef.current) {
        setSelectionEnd({ day, hour })
      }
    }, 16),
    []
  )

  const handleMouseEnter = useCallback((day: DayOfWeek, hour: number) => {
    handleMouseEnterThrottled(day, hour)
  }, [handleMouseEnterThrottled])

  // Fin de la selection (souris) - memoise
  const handleMouseUp = useCallback(() => {
    if (isPaintingRef.current && selectionStart && selectionEnd) {
      applySelection()
    }
    setIsPainting(false)
    setSelectionStart(null)
    setSelectionEnd(null)
  }, [applySelection, selectionStart, selectionEnd])

  // Gestion du mouse leave sur le conteneur - memoise
  const handleMouseLeave = useCallback(() => {
    if (isPaintingRef.current) {
      handleMouseUp()
    }
  }, [handleMouseUp])

  // Support tactile - debut - memoise (signature modifiee pour eviter creation de closures)
  const handleTouchStart = useCallback((e: React.TouchEvent, day: DayOfWeek, hour: number) => {
    e.preventDefault()
    setIsPainting(true)
    setSelectionStart({ day, hour })
    setSelectionEnd({ day, hour })
  }, [])

  // Support tactile - mouvement - throttle a 60fps (16ms)
  const handleTouchMoveThrottled = useMemo(
    () => throttle((e: React.TouchEvent) => {
      if (!isPaintingRef.current || !containerRef.current) return

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
    }, 16),
    []
  )

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleTouchMoveThrottled(e)
  }, [handleTouchMoveThrottled])

  // Support tactile - fin - memoise
  const handleTouchEnd = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  // Remplir toute une journee - memoise
  const handleDayClick = useCallback((day: DayOfWeek) => {
    const newSchedule = { ...schedule }
    for (const d of DAYS_OF_WEEK) {
      newSchedule[d] = [...schedule[d]]
    }
    newSchedule[day] = Array(24).fill(null).map(() => ({ ...paintConfig }))
    onChange(newSchedule)
  }, [schedule, paintConfig, onChange])

  // Remplir toute une heure (tous les jours) - memoise
  const handleHourClick = useCallback((hour: number) => {
    const newSchedule = { ...schedule }
    for (const day of DAYS_OF_WEEK) {
      newSchedule[day] = [...schedule[day]]
      newSchedule[day][hour] = { ...paintConfig }
    }
    onChange(newSchedule)
  }, [schedule, paintConfig, onChange])

  return (
    <>
      {/* Indicateur de selection flottant */}
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
                  const cellKey = `${day}-${hour}`
                  const cellInfo = cellsDisplayInfo[day][hour]
                  const inSelection = selectedCellsSet.has(cellKey)

                  return (
                    <CalendarCell
                      key={cellKey}
                      day={day}
                      hour={hour}
                      cellInfo={cellInfo}
                      inSelection={inSelection}
                      onMouseDown={handleMouseDown}
                      onMouseEnter={handleMouseEnter}
                      onTouchStart={handleTouchStart}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <p className="text-sm text-base-content/60 mt-2">
        Cliquez sur les en-tetes pour remplir une colonne/ligne entiere.
      </p>
    </>
  )
}
