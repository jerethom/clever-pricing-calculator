import type { WeeklySchedule, DayOfWeek, LoadLevel } from '@/types'
import { DAYS_OF_WEEK, createFilledSchedule, createHourlyConfig } from '@/types'

interface SchedulePresetsProps {
  profileId: string
  loadLevel: LoadLevel
  onApply: (schedule: WeeklySchedule) => void
}

interface Preset {
  id: string
  label: string
  description: string
  icon: string
  generate: (profileId: string, loadLevel: LoadLevel) => WeeklySchedule
}

const WEEKDAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

const presets: Preset[] = [
  {
    id: 'business-hours',
    label: 'Heures de bureau',
    description: 'Lun-Ven, 9h-18h',
    icon: '🏢',
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
    label: 'Heures étendues',
    description: 'Lun-Ven, 8h-20h',
    icon: '📊',
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
    description: 'Lun-Ven, 10h-12h et 14h-17h',
    icon: '📈',
    generate: (profileId, loadLevel) => {
      const schedule = createFilledSchedule(profileId, 0)
      for (const day of WEEKDAYS) {
        // Pic du matin
        for (let h = 10; h < 12; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
        // Pic après-midi
        for (let h = 14; h < 17; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
      }
      return schedule
    },
  },
  {
    id: 'night-reduction',
    label: 'Réduction nocturne',
    description: 'Boost 6h-22h tous les jours',
    icon: '🌙',
    generate: (profileId, loadLevel) => {
      const schedule = createFilledSchedule(profileId, 0)
      for (const day of DAYS_OF_WEEK) {
        for (let h = 6; h < 22; h++) {
          schedule[day][h] = createHourlyConfig(profileId, loadLevel)
        }
      }
      return schedule
    },
  },
  {
    id: 'weekend-low',
    label: 'Week-end réduit',
    description: 'Lun-Ven max, Sam-Dim minimum',
    icon: '🏖️',
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
    description: '24h/7j au maximum',
    icon: '🚀',
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

export function SchedulePresets({
  profileId,
  loadLevel,
  onApply,
}: SchedulePresetsProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-base-content/80">
        Configurations rapides
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApply(preset.generate(profileId, loadLevel))}
            className="
              group flex items-center gap-2 px-3 py-2
              bg-base-100 border border-base-300
              hover:border-primary hover:bg-primary/5
              transition-all text-left cursor-pointer
            "
            title={preset.description}
          >
            <span className="text-lg" aria-hidden="true">
              {preset.icon}
            </span>
            <div>
              <div className="text-sm font-medium group-hover:text-primary">
                {preset.label}
              </div>
              <div className="text-xs text-base-content/50">
                {preset.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
