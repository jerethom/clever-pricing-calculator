import { memo, useCallback } from 'react'
import type { WeeklySchedule, DayOfWeek, LoadLevel } from '@/types'
import { DAYS_OF_WEEK, createFilledSchedule, createHourlyConfig } from '@/types'
import { toast } from '@/store/toastStore'

interface SchedulePresetsProps {
  profileId: string
  loadLevel: LoadLevel
  onApply: (schedule: WeeklySchedule) => void
}

interface Preset {
  id: string
  label: string
  shortLabel: string
  description: string
  generate: (profileId: string, loadLevel: LoadLevel) => WeeklySchedule
}

const WEEKDAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

const presets: Preset[] = [
  {
    id: 'business-hours',
    label: 'Heures de bureau',
    shortLabel: 'Bureau',
    description: 'Lun-Ven, 9h-18h',
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
  onApply: (schedule: WeeklySchedule) => void
}

const CompactPresetButton = memo(function CompactPresetButton({
  preset,
  profileId,
  loadLevel,
  onApply,
}: CompactPresetButtonProps) {
  const handleClick = useCallback(() => {
    onApply(preset.generate(profileId, loadLevel))
    toast.success(`Configuration "${preset.label}" appliquee`)
  }, [preset, profileId, loadLevel, onApply])

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn btn-sm btn-ghost border border-base-300 hover:border-primary hover:bg-primary/10 whitespace-nowrap"
      title={`${preset.label} - ${preset.description}`}
    >
      {preset.shortLabel}
    </button>
  )
})

export const SchedulePresets = memo(function SchedulePresets({
  profileId,
  loadLevel,
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
          onApply={onApply}
        />
      ))}
    </div>
  )
})
