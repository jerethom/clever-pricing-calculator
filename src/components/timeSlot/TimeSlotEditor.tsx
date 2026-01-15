import { useState } from 'react'
import type { RuntimeConfig, WeeklySchedule } from '@/types'
import { createEmptySchedule } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { WeeklyCalendar } from './WeeklyCalendar'
import { PaintToolbar } from './PaintToolbar'
import { SchedulePresets } from './SchedulePresets'
import { ScheduleLegend } from './ScheduleLegend'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import type { Instance } from '@/api/types'
import { Icons } from '@/components/ui'

const HOURS_PER_MONTH = 730

interface TimeSlotEditorProps {
  projectId: string
  runtimeId: string
  runtime: RuntimeConfig
  instance?: Instance
}

export function TimeSlotEditor({
  projectId,
  runtimeId,
  runtime,
  instance,
}: TimeSlotEditorProps) {
  const updateRuntime = useProjectStore(state => state.updateRuntime)
  const [showPresets, setShowPresets] = useState(false)
  const [paintValue, setPaintValue] = useState(1)

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    updateRuntime(projectId, runtimeId, { weeklySchedule: newSchedule })
  }

  const handleScalingFlavorChange = (flavorName: string) => {
    updateRuntime(projectId, runtimeId, { scalingFlavorName: flavorName })
  }

  const handleReset = () => {
    handleScheduleChange(createEmptySchedule())
  }

  const maxExtraInstances =
    runtime.defaultMaxInstances - runtime.defaultMinInstances
  const schedule = runtime.weeklySchedule ?? createEmptySchedule()

  const baseFlavorPrice =
    instance?.flavors.find(f => f.name === runtime.defaultFlavorName)?.price ??
    0
  const scalingFlavors =
    instance?.flavors?.filter(f => f.available && f.price >= baseFlavorPrice) ??
    []
  const currentScalingFlavor =
    runtime.scalingFlavorName ?? runtime.defaultFlavorName
  const currentFlavorData = scalingFlavors.find(
    f => f.name === currentScalingFlavor
  )

  return (
    <div className="space-y-4">
      {/* Header avec infos */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h4 className="font-semibold flex items-center gap-2">
            <Icons.Clock className="w-4 h-4 text-primary" />
            Planning hebdomadaire
          </h4>
          <p className="text-sm text-base-content/60 mt-1">
            Définissez quand ajouter des instances supplémentaires
          </p>
        </div>

        {/* Légende contextuelle */}
        <ScheduleLegend
          maxExtraInstances={maxExtraInstances}
          baseInstances={runtime.defaultMinInstances}
        />
      </div>

      {/* Info baseline */}
      <div className="flex items-center gap-4 p-3 bg-base-200 border border-base-300 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base-content/60">Baseline :</span>
          <span className="font-semibold">
            {runtime.defaultMinInstances} instance(s)
          </span>
          <span className="text-base-content/50">
            ({runtime.defaultFlavorName})
          </span>
        </div>
        <div className="w-px h-4 bg-base-300 hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-base-content/60">Max :</span>
          <span className="font-semibold">
            {runtime.defaultMaxInstances} instance(s)
          </span>
        </div>
        {maxExtraInstances > 0 && (
          <>
            <div className="w-px h-4 bg-base-300 hidden sm:block" />
            <div className="flex items-center gap-2 text-primary">
              <span>+{maxExtraInstances} disponible(s)</span>
            </div>
          </>
        )}
      </div>

      {/* Sélecteur du flavor de scaling amélioré */}
      {maxExtraInstances > 0 && scalingFlavors.length > 0 && (
        <div className="p-4 border border-base-300 bg-base-100">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-medium">
                Flavor des instances de scaling
              </div>
              <div className="text-xs text-base-content/60">
                Configuration utilisée pour les instances supplémentaires
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Aperçu du flavor actuel */}
              {currentFlavorData && (
                <div className="text-right hidden sm:block">
                  <div className="font-semibold">{currentFlavorData.name}</div>
                  <div className="text-xs text-base-content/60">
                    {currentFlavorData.memory.formatted} /{' '}
                    {currentFlavorData.cpus} CPU
                  </div>
                </div>
              )}

              <select
                className="select select-bordered select-sm w-48"
                value={currentScalingFlavor}
                onChange={e => handleScalingFlavorChange(e.target.value)}
              >
                {scalingFlavors.map(flavor => (
                  <option key={flavor.name} value={flavor.name}>
                    {flavor.name} -{' '}
                    {formatMonthlyPrice(flavor.price * HOURS_PER_MONTH)}
                    {flavor.name === runtime.defaultFlavorName && ' (base)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Presets toggle */}
      {maxExtraInstances > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="btn btn-ghost btn-sm gap-2"
          >
            <span>
              {showPresets ? 'Masquer' : 'Afficher'} les configurations rapides
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showPresets && (
            <div className="mt-2 animate-in">
              <SchedulePresets
                maxExtraInstances={maxExtraInstances}
                onApply={handleScheduleChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Barre d'outils de peinture */}
      {maxExtraInstances > 0 && (
        <PaintToolbar
          paintValue={paintValue}
          onChange={setPaintValue}
          maxValue={maxExtraInstances}
          onReset={handleReset}
        />
      )}

      {/* Calendrier */}
      <WeeklyCalendar
        schedule={schedule}
        onChange={handleScheduleChange}
        maxExtraInstances={maxExtraInstances}
        paintValue={paintValue}
      />

      {/* Message si pas de scaling possible */}
      {maxExtraInstances === 0 && (
        <div className="p-4 bg-warning/10 border border-warning/30 text-sm">
          <div className="flex items-start gap-3">
            <Icons.Warning className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Scaling non disponible</div>
              <div className="text-base-content/70 mt-1">
                Le nombre minimum et maximum d'instances sont identiques (
                {runtime.defaultMinInstances}). Augmentez le maximum pour
                activer le planning de scaling.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
