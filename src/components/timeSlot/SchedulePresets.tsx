import { memo, useCallback, useState, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import type { WeeklySchedule, DayOfWeek, LoadLevel } from '@/types'
import { DAYS_OF_WEEK, createFilledSchedule, createHourlyConfig } from '@/types'
import { toast } from '@/store/toastStore'
import { PROFILE_COLORS, LOAD_LEVEL_OPACITIES, hexToRgba } from '@/constants'

interface SchedulePresetsProps {
  profileId: string
  loadLevel: LoadLevel
  profileColorIndex: number
  onApply: (schedule: WeeklySchedule) => void
}

interface Preset {
  id: string
  label: string
  shortLabel: string
  description: string
  /** Nombre d'heures de scaling par semaine (precalcule) */
  weeklyHours: number
  generate: (profileId: string, loadLevel: LoadLevel) => WeeklySchedule
}

const WEEKDAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

// Composant tooltip avec Portal - rendu directement dans document.body
const PresetTooltip = memo(function PresetTooltip({
  schedule,
  anchorRect,
  profileColorIndex,
}: {
  schedule: WeeklySchedule
  anchorRect: DOMRect
  profileColorIndex: number
}) {
  const color = PROFILE_COLORS[profileColorIndex % PROFILE_COLORS.length]

  const style: React.CSSProperties = {
    position: 'fixed',
    left: anchorRect.left + anchorRect.width / 2,
    top: anchorRect.bottom + 8,
    transform: 'translateX(-50%)',
    zIndex: 9999,
  }

  // Vue simplifiée : 7 jours x 4 blocs de 6h
  const cellSize = 24 // pixels

  // Calculer le niveau dominant pour un bloc de 6 heures
  const getBlockLevel = (day: DayOfWeek, startHour: number): number => {
    let maxLevel = 0
    for (let h = startHour; h < startHour + 6; h++) {
      const level = schedule[day][h]?.loadLevel ?? 0
      if (level > maxLevel) maxLevel = level
    }
    return maxLevel
  }

  const content = (
    <div
      className="bg-base-100 border border-base-300 rounded-lg shadow-xl p-3 pointer-events-none"
      style={style}
    >
      <div className="text-xs font-medium mb-2 text-center">Aperçu</div>

      {/* Grille simplifiée : 7 colonnes x 5 lignes (labels + 4 blocs de 6h) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `auto repeat(7, ${cellSize}px)`,
          gridTemplateRows: `auto repeat(4, ${cellSize}px)`,
          gap: '2px',
        }}
      >
        {/* Coin vide */}
        <div />
        {/* Labels des jours */}
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div
            key={`label-${i}`}
            className="text-[10px] text-base-content/60 text-center font-medium"
          >
            {d}
          </div>
        ))}

        {/* 4 blocs de 6 heures */}
        {[0, 6, 12, 18].map(startHour => (
          <Fragment key={startHour}>
            {/* Label horaire */}
            <div className="text-[9px] text-base-content/50 text-right pr-1 flex items-center justify-end">
              {startHour}h
            </div>
            {/* Cellules pour chaque jour */}
            {DAYS_OF_WEEK.map(day => {
              const level = getBlockLevel(day, startHour)
              const hasLoad = level > 0
              const bgColor = hasLoad
                ? hexToRgba(color.hex, LOAD_LEVEL_OPACITIES[level])
                : undefined

              return (
                <div
                  key={`${day}-${startHour}`}
                  className={`rounded-sm ${hasLoad ? '' : 'bg-base-200'}`}
                  style={{
                    backgroundColor: bgColor,
                    border: '1px solid oklch(var(--bc) / 0.2)',
                  }}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )

  // Utiliser createPortal pour rendre dans document.body
  return createPortal(content, document.body)
})

const presets: Preset[] = [
  {
    id: 'business-hours',
    label: 'Heures de bureau',
    shortLabel: 'Bureau',
    description: 'Lun-Ven, 9h-18h',
    weeklyHours: 45, // 5 jours x 9 heures (9h-18h)
    generate: (profileId, loadLevel) => {
      const schedule = createFilledSchedule(profileId, 0)
      for (const day of WEEKDAYS) {
        for (let h = 9; h < 18; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
      }
      return schedule
    },
  },
  {
    id: 'extended-business',
    label: 'Heures etendues',
    shortLabel: 'Etendues',
    description: 'Lun-Ven, 8h-20h',
    weeklyHours: 60, // 5 jours x 12 heures (8h-20h)
    generate: (profileId, loadLevel) => {
      const schedule = createFilledSchedule(profileId, 0)
      for (const day of WEEKDAYS) {
        for (let h = 8; h < 20; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
      }
      return schedule
    },
  },
  {
    id: 'peak-hours',
    label: 'Pics de trafic',
    shortLabel: 'Pics',
    description: 'Lun-Ven, 10h-12h et 14h-17h',
    weeklyHours: 25, // 5 jours x (2 + 3) heures
    generate: (profileId, loadLevel) => {
      const schedule = createFilledSchedule(profileId, 0)
      for (const day of WEEKDAYS) {
        // Pic du matin
        for (let h = 10; h < 12; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
        // Pic apres-midi
        for (let h = 14; h < 17; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
      }
      return schedule
    },
  },
  {
    id: 'weekend-low',
    label: 'Week-end reduit',
    shortLabel: 'WE off',
    description: 'Lun-Ven max, Sam-Dim minimum',
    weeklyHours: 120, // 5 jours x 24 heures
    generate: (profileId, loadLevel) => {
      const schedule = createFilledSchedule(profileId, 0)
      for (const day of WEEKDAYS) {
        for (let h = 0; h < 24; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
      }
      // Weekend reste en baseline
      return schedule
    },
  },
  {
    id: 'always-max',
    label: 'Toujours maximum',
    shortLabel: '24/7',
    description: '24h/7j au maximum',
    weeklyHours: 168, // 7 jours x 24 heures
    generate: (profileId, loadLevel) => {
      const schedule = createFilledSchedule(profileId, 0)
      for (const day of DAYS_OF_WEEK) {
        for (let h = 0; h < 24; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
      }
      return schedule
    },
  },
]

// Composant bouton preset compact memoise
interface CompactPresetButtonProps {
  preset: Preset
  profileId: string
  loadLevel: LoadLevel
  profileColorIndex: number
  onApply: (schedule: WeeklySchedule) => void
}

const CompactPresetButton = memo(function CompactPresetButton({
  preset,
  profileId,
  loadLevel,
  profileColorIndex,
  onApply,
}: CompactPresetButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [hoveredSchedule, setHoveredSchedule] = useState<WeeklySchedule | null>(null)

  const handleClick = useCallback(() => {
    onApply(preset.generate(profileId, loadLevel))
    toast.success(`Configuration "${preset.label}" appliquee`)
  }, [preset, profileId, loadLevel, onApply])

  const handleMouseEnter = useCallback(() => {
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect())
      setHoveredSchedule(preset.generate(profileId, loadLevel))
      setIsHovered(true)
    }
  }, [preset, profileId, loadLevel])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setAnchorRect(null)
    setHoveredSchedule(null)
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="btn btn-sm btn-ghost border border-base-300 hover:border-primary hover:bg-primary/10 flex flex-col items-start py-1.5 h-auto"
      >
        <span className="text-xs font-medium">{preset.shortLabel}</span>
        <span className="text-[10px] text-base-content/50">{preset.description}</span>
      </button>
      {isHovered && anchorRect && hoveredSchedule && (
        <PresetTooltip
          schedule={hoveredSchedule}
          anchorRect={anchorRect}
          profileColorIndex={profileColorIndex}
        />
      )}
    </>
  )
})

export const SchedulePresets = memo(function SchedulePresets({
  profileId,
  loadLevel,
  profileColorIndex,
  onApply,
}: SchedulePresetsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
      {presets.map(preset => (
        <CompactPresetButton
          key={preset.id}
          preset={preset}
          profileId={profileId}
          loadLevel={loadLevel}
          profileColorIndex={profileColorIndex}
          onApply={onApply}
        />
      ))}
    </div>
  )
})
