import { useState } from 'react'
import type { RuntimeConfig, WeeklySchedule } from '@/types'
import { DAYS_OF_WEEK, createEmptySchedule } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { useInstances } from '@/hooks/useInstances'
import {
  calculateRuntimeCost,
  buildFlavorPriceMap,
  formatPrice,
  formatMonthlyPrice,
  formatHourlyPrice,
} from '@/lib/costCalculator'
import { TimeSlotEditor } from '@/components/timeSlot/TimeSlotEditor'
import { Icons, ConfirmDialog, NumberInput } from '@/components/ui'
import { FlavorPicker } from './FlavorPicker'

const HOURS_PER_MONTH = 730 // ~24h × 30.4j
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface RuntimeCardProps {
  projectId: string
  runtime: RuntimeConfig
}

export function RuntimeCard({ projectId, runtime }: RuntimeCardProps) {
  const { data: instances } = useInstances()
  const removeRuntime = useProjectStore(state => state.removeRuntime)
  const updateRuntime = useProjectStore(state => state.updateRuntime)
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFlavorPicker, setShowFlavorPicker] = useState(false)
  const [pendingScalingChange, setPendingScalingChange] = useState<{
    min: number
    max: number
  } | null>(null)

  const instance = instances?.find(i => i.type === runtime.instanceType)
  const currentFlavor = instance?.flavors.find(
    f => f.name === runtime.defaultFlavorName
  )
  const flavorPrices = instances
    ? buildFlavorPriceMap(instances, runtime.instanceType)
    : new Map<string, number>()
  const cost = calculateRuntimeCost(runtime, flavorPrices)

  const handleFlavorChange = (flavorName: string) => {
    updateRuntime(projectId, runtime.id, { defaultFlavorName: flavorName })
  }

  // Vérifie si le changement va impacter le planning
  const willImpactSchedule = (min: number, max: number): boolean => {
    const newMaxExtra = max - min
    const currentSchedule = runtime.weeklySchedule ?? createEmptySchedule()

    for (const day of DAYS_OF_WEEK) {
      for (const value of currentSchedule[day]) {
        if (value > newMaxExtra) {
          return true
        }
      }
    }
    return false
  }

  const applyScalingChange = (min: number, max: number) => {
    const newMaxExtra = max - min
    const currentSchedule = runtime.weeklySchedule ?? createEmptySchedule()

    // Ajuster le planning si des valeurs dépassent le nouveau max
    const adjustedSchedule: WeeklySchedule = {} as WeeklySchedule
    for (const day of DAYS_OF_WEEK) {
      adjustedSchedule[day] = currentSchedule[day].map(value =>
        Math.min(value, newMaxExtra)
      )
    }

    updateRuntime(projectId, runtime.id, {
      defaultMinInstances: min,
      defaultMaxInstances: max,
      weeklySchedule: adjustedSchedule,
    })
  }

  const handleScalingChange = (min: number, max: number) => {
    if (willImpactSchedule(min, max)) {
      setPendingScalingChange({ min, max })
    } else {
      applyScalingChange(min, max)
    }
  }

  const handleConfirmScalingChange = () => {
    if (pendingScalingChange) {
      applyScalingChange(pendingScalingChange.min, pendingScalingChange.max)
      setPendingScalingChange(null)
    }
  }

  const handleDelete = () => {
    removeRuntime(projectId, runtime.id)
    setShowDeleteConfirm(false)
  }

  // Calcul de la position de la jauge
  const gaugePosition =
    cost.maxMonthlyCost > cost.minMonthlyCost
      ? ((cost.totalMonthlyCost - cost.minMonthlyCost) /
          (cost.maxMonthlyCost - cost.minMonthlyCost)) *
        100
      : 0

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
      <div className="card-body p-4 sm:p-6">
        {/* Header amélioré avec statut visuel */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {runtime.variantLogo ? (
              <div className="relative flex-shrink-0">
                <img
                  src={runtime.variantLogo}
                  alt=""
                  className="w-12 h-12 object-contain bg-base-200 p-1.5"
                />
                {/* Indicateur de statut */}
                <span
                  className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-base-100 ${
                    cost.scalingHours > 0
                      ? 'bg-warning animate-pulse'
                      : 'bg-success'
                  }`}
                  title={
                    cost.scalingHours > 0 ? 'Scaling actif' : 'Baseline 24/7'
                  }
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-base-200 flex items-center justify-center flex-shrink-0">
                <Icons.Server className="w-6 h-6 text-base-content/40" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">
                {runtime.instanceName}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="badge badge-sm badge-ghost">
                  {runtime.instanceType}
                </span>
                <span className="badge badge-sm badge-outline">
                  {runtime.defaultMinInstances}-{runtime.defaultMaxInstances}{' '}
                  inst.
                </span>
              </div>
            </div>
          </div>

          {/* Action supprimer */}
          <button
            className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={`Supprimer ${runtime.instanceName}`}
          >
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration du flavor - Bouton compact */}
        <div className="mt-4">
          <label className="label py-1">
            <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
              Configuration
            </span>
          </label>
          <button
            className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-primary/50 hover:bg-base-200"
            onClick={() => setShowFlavorPicker(true)}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-semibold text-base">
                {runtime.defaultFlavorName}
              </span>
              <span className="text-xs text-base-content/60">
                {currentFlavor?.memory.formatted} • {currentFlavor?.cpus} vCPU
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-primary font-bold">
                {formatMonthlyPrice(
                  (currentFlavor?.price ?? 0) * HOURS_PER_MONTH
                )}
              </span>
            </div>
          </button>
        </div>

        {/* Configuration de la scalabilité avec visualisation */}
        <div className="mt-4 space-y-3">
          <label className="label py-1">
            <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
              Instances
            </span>
            <span className="label-text-alt text-base-content/60">
              {runtime.defaultMinInstances} - {runtime.defaultMaxInstances}
            </span>
          </label>

          {/* Visualisation des instances en blocs */}
          <div className="flex items-center gap-1 px-1">
            {Array.from({
              length: Math.min(runtime.defaultMaxInstances, 10),
            }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-6 transition-all ${
                  i < runtime.defaultMinInstances
                    ? 'bg-primary'
                    : 'bg-primary/20 border border-dashed border-primary/40'
                }`}
                title={
                  i < runtime.defaultMinInstances
                    ? 'Instance de base'
                    : 'Instance de scaling'
                }
              />
            ))}
            {runtime.defaultMaxInstances > 10 && (
              <span className="text-xs text-base-content/50 ml-1">
                +{runtime.defaultMaxInstances - 10}
              </span>
            )}
          </div>

          {/* Contrôles min/max */}
          <div className="space-y-2">
            <NumberInput
              label="Minimum (base)"
              labelPosition="left"
              value={runtime.defaultMinInstances}
              onChange={value =>
                handleScalingChange(value, runtime.defaultMaxInstances)
              }
              min={1}
              max={runtime.defaultMaxInstances}
              size="sm"
            />
            <NumberInput
              label="Maximum (scaling)"
              labelPosition="left"
              value={runtime.defaultMaxInstances}
              onChange={value =>
                handleScalingChange(runtime.defaultMinInstances, value)
              }
              min={runtime.defaultMinInstances}
              max={instance?.maxInstances ?? 40}
              size="sm"
            />
          </div>
        </div>

        {/* Planning hebdomadaire avec mini-aperçu */}
        <div className="mt-4">
          <button
            className={`btn w-full justify-between h-auto py-3 px-4 ${
              showTimeSlots ? 'btn-primary' : 'btn-outline'
            }`}
            onClick={() => setShowTimeSlots(!showTimeSlots)}
          >
            <div className="flex items-center gap-2">
              <Icons.Clock className="w-4 h-4" />
              <span>Planning hebdomadaire</span>
            </div>

            {/* Mini aperçu du planning */}
            <div className="flex items-center gap-2">
              {/* Mini calendrier 7 jours */}
              <div className="hidden sm:flex gap-0.5">
                {DAYS_OF_WEEK.map((dayKey, i) => {
                  const hasScaling =
                    runtime.weeklySchedule?.[dayKey]?.some(h => h > 0) ?? false
                  return (
                    <div
                      key={i}
                      className={`w-4 h-4 text-[8px] flex items-center justify-center font-bold ${
                        hasScaling
                          ? 'bg-warning text-warning-content'
                          : showTimeSlots
                            ? 'bg-primary-content/20 text-primary-content/50'
                            : 'bg-base-300 text-base-content/50'
                      }`}
                    >
                      {DAY_LETTERS[i]}
                    </div>
                  )
                })}
              </div>

              <span
                className={`badge badge-sm ${showTimeSlots ? 'badge-ghost' : ''}`}
              >
                {cost.scalingHours > 0 ? `${cost.scalingHours}h` : '24/7'}
              </span>
            </div>
          </button>
        </div>

        {showTimeSlots && (
          <div className="mt-4 p-4 bg-base-200">
            <TimeSlotEditor
              projectId={projectId}
              runtimeId={runtime.id}
              runtime={runtime}
              instance={instance}
            />
          </div>
        )}

        {/* Section coûts refaite */}
        <div className="mt-4 overflow-hidden border border-base-300">
          {/* Coût principal mis en évidence */}
          <div className="bg-base-200 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/70">
                  Estimation mensuelle
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(cost.totalMonthlyCost)}
                </p>
              </div>
              {cost.scalingHours > 0 && (
                <span className="badge badge-warning badge-sm">
                  <Icons.Clock className="w-3 h-3 mr-1" />
                  {cost.scalingHours}h/sem
                </span>
              )}
            </div>

            {/* Jauge min-actuel-max */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-base-content/60 mb-1">
                <span>{formatPrice(cost.minMonthlyCost)}</span>
                <span>{formatPrice(cost.maxMonthlyCost)}</span>
              </div>
              <div className="h-2 bg-base-300 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, gaugePosition)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-base-content/50">Base seule</span>
                <span className="text-base-content/50">Scaling 24/7</span>
              </div>
            </div>
          </div>

          {/* Détail collapse */}
          <details className="group">
            <summary className="px-4 py-2 bg-base-200 cursor-pointer flex items-center justify-between hover:bg-base-300 transition-colors list-none">
              <span className="text-sm font-medium">Voir le détail</span>
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>

            <div className="p-4 bg-base-100 space-y-3 text-sm border-t border-base-300">
              {/* Coût de base */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">Base</span>
                  <span className="text-base-content/60 text-xs block">
                    {runtime.defaultMinInstances} inst. × {cost.baselineHours}h
                    × {formatHourlyPrice(cost.baseHourlyPrice)} × 4,33
                  </span>
                </div>
                <span className="font-mono tabular-nums">
                  {formatPrice(cost.baseMonthlyCost)}
                </span>
              </div>

              {/* Coût scaling */}
              {cost.scalingHours > 0 && (
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">Scaling</span>
                    {cost.scalingFlavorName !== cost.baseFlavorName && (
                      <span className="badge badge-xs badge-info ml-2">
                        {cost.scalingFlavorName}
                      </span>
                    )}
                    <span className="text-base-content/60 text-xs block">
                      {cost.scalingInstanceHours} inst-h ×{' '}
                      {formatHourlyPrice(cost.scalingHourlyPrice)} × 4,33
                    </span>
                  </div>
                  <span className="font-mono tabular-nums">
                    {formatPrice(cost.scalingMonthlyCost)}
                  </span>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>

      {/* Modal FlavorPicker */}
      <FlavorPicker
        isOpen={showFlavorPicker}
        onClose={() => setShowFlavorPicker(false)}
        flavors={instance?.flavors ?? []}
        selectedFlavor={runtime.defaultFlavorName}
        onSelect={handleFlavorChange}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer le runtime"
        message={`Voulez-vous vraiment supprimer le runtime "${runtime.instanceName}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Modal de confirmation de modification du scaling */}
      <ConfirmDialog
        isOpen={pendingScalingChange !== null}
        title="Modifier le planning"
        message="Cette modification va réduire certaines valeurs du planning hebdomadaire qui dépassent le nouveau maximum d'instances supplémentaires. Voulez-vous continuer ?"
        confirmLabel="Confirmer"
        cancelLabel="Annuler"
        variant="warning"
        onConfirm={handleConfirmScalingChange}
        onCancel={() => setPendingScalingChange(null)}
      />
    </div>
  )
}
