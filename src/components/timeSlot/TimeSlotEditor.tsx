import type { RuntimeConfig, WeeklySchedule } from '@/types'
import { createEmptySchedule } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { WeeklyCalendar } from './WeeklyCalendar'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import type { Instance } from '@/api/types'

const HOURS_PER_MONTH = 730

interface TimeSlotEditorProps {
  projectId: string
  runtimeId: string
  runtime: RuntimeConfig
  instance?: Instance
}

export function TimeSlotEditor({ projectId, runtimeId, runtime, instance }: TimeSlotEditorProps) {
  const updateRuntime = useProjectStore(state => state.updateRuntime)

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    updateRuntime(projectId, runtimeId, { weeklySchedule: newSchedule })
  }

  const handleScalingFlavorChange = (flavorName: string) => {
    updateRuntime(projectId, runtimeId, { scalingFlavorName: flavorName })
  }

  const maxExtraInstances = runtime.defaultMaxInstances - runtime.defaultMinInstances

  // Fallback pour les anciens runtimes sans weeklySchedule
  const schedule = runtime.weeklySchedule ?? createEmptySchedule()

  // Prix du flavor de base pour filtrer les flavors de scaling
  const baseFlavorPrice = instance?.flavors.find(f => f.name === runtime.defaultFlavorName)?.price ?? 0

  // Flavors disponibles pour le scaling (prix >= flavor de base)
  const scalingFlavors = instance?.flavors
    .filter(f => f.available && f.price >= baseFlavorPrice)
    ?? []

  // Flavor de scaling actuel (fallback sur le flavor de base)
  const currentScalingFlavor = runtime.scalingFlavorName ?? runtime.defaultFlavorName

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Planning hebdomadaire</h4>
        <p className="text-sm text-base-content/60">
          Baseline : {runtime.defaultMinInstances} instance(s) ({runtime.defaultFlavorName}) — Max : {runtime.defaultMaxInstances} instance(s)
        </p>
      </div>

      {/* Sélecteur du flavor de scaling */}
      {maxExtraInstances > 0 && scalingFlavors.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Flavor pour les instances de scaling</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={currentScalingFlavor}
            onChange={e => handleScalingFlavorChange(e.target.value)}
          >
            {scalingFlavors.map(flavor => (
              <option key={flavor.name} value={flavor.name}>
                {flavor.name} - {flavor.memory.formatted} / {flavor.cpus} CPU
                ({formatMonthlyPrice(flavor.price * HOURS_PER_MONTH)})
                {flavor.name === runtime.defaultFlavorName && ' (même que base)'}
              </option>
            ))}
          </select>
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              Les instances de scaling utilisent ce flavor (doit être ≥ au flavor de base)
            </span>
          </label>
        </div>
      )}

      <WeeklyCalendar
        schedule={schedule}
        onChange={handleScheduleChange}
        maxExtraInstances={maxExtraInstances}
      />
    </div>
  )
}
