import type { WeeklySchedule, DayOfWeek, LoadLevel, ScalingProfile } from '@/types'
import { DAYS_OF_WEEK, createFilledSchedule, createHourlyConfig } from '@/types'
import { toast } from '@/store/toastStore'

interface SchedulePresetsProps {
  profileId: string
  loadLevel: LoadLevel
  scalingProfiles: ScalingProfile[]
  onApply: (schedule: WeeklySchedule) => void
}

interface Preset {
  id: string
  label: string
  description: string
  icon: string
  category: 'standard' | 'optimization' | 'performance'
  generate: (profileId: string, loadLevel: LoadLevel) => WeeklySchedule
}

const WEEKDAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

const CATEGORY_LABELS: Record<Preset['category'], string> = {
  standard: 'Horaires standards',
  optimization: 'Optimisation',
  performance: 'Performance',
}

const presets: Preset[] = [
  {
    id: 'business-hours',
    label: 'Heures de bureau',
    description: 'Lun-Ven, 9h-18h',
    icon: '🏢',
    category: 'standard',
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
    description: 'Lun-Ven, 8h-20h',
    icon: '📊',
    category: 'standard',
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
    category: 'optimization',
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
    id: 'night-reduction',
    label: 'Nuit reduite',
    description: 'Actif 6h-22h, repos la nuit',
    icon: '☀️',
    category: 'optimization',
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
    label: 'Week-end reduit',
    description: 'Lun-Ven max, Sam-Dim minimum',
    icon: '🏖️',
    category: 'optimization',
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
    category: 'performance',
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

// Grouper les presets par categorie
const presetsByCategory = presets.reduce(
  (acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = []
    }
    acc[preset.category].push(preset)
    return acc
  },
  {} as Record<Preset['category'], Preset[]>
)

const categoryOrder: Preset['category'][] = ['standard', 'optimization', 'performance']

export function SchedulePresets({
  profileId,
  loadLevel,
  scalingProfiles,
  onApply,
}: SchedulePresetsProps) {
  // Recuperer le nom du profil selectionne
  const selectedProfile = scalingProfiles.find(p => p.id === profileId)
  const selectedProfileName = selectedProfile?.name ?? profileId

  const handleApply = (preset: Preset) => {
    onApply(preset.generate(profileId, loadLevel))
    toast.success(`Configuration "${preset.label}" appliquee`)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium text-base-content/80">
          Configurations rapides
        </div>
        <div className="text-xs text-base-content/60">
          Appliquera : Profil "{selectedProfileName}" - Niveau {loadLevel}
        </div>
      </div>

      <div className="space-y-4">
        {categoryOrder.map(category => {
          const categoryPresets = presetsByCategory[category]
          if (!categoryPresets?.length) return null

          return (
            <div key={category} className="space-y-2">
              <div className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
                {CATEGORY_LABELS[category]}
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryPresets.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApply(preset)}
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
        })}
      </div>
    </div>
  )
}
