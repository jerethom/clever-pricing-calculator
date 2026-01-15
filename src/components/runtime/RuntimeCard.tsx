import { useState } from 'react'
import type { RuntimeConfig, WeeklySchedule } from '@/types'
import { DAYS_OF_WEEK, createEmptySchedule } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { useInstances } from '@/hooks/useInstances'
import { calculateRuntimeCost, buildFlavorPriceMap, formatPrice, formatMonthlyPrice, formatHourlyPrice } from '@/lib/costCalculator'
import { TimeSlotEditor } from '@/components/timeSlot/TimeSlotEditor'
import { Icons, ConfirmDialog, NumberInput } from '@/components/ui'

const HOURS_PER_MONTH = 730 // ~24h × 30.4j

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
  const [pendingScalingChange, setPendingScalingChange] = useState<{ min: number; max: number } | null>(null)

  const instance = instances?.find(i => i.type === runtime.instanceType)
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

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-colors">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {runtime.variantLogo && (
              <img
                src={runtime.variantLogo}
                alt={runtime.instanceName}
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              <h3 className="card-title text-lg">{runtime.instanceName}</h3>
              <p className="text-sm text-base-content/70">{runtime.instanceType}</p>
            </div>
          </div>
          <div className="tooltip tooltip-left" data-tip="Supprimer ce runtime">
            <button
              className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label={`Supprimer ${runtime.instanceName}`}
            >
              <Icons.Trash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration du flavor */}
        <div className="form-control mt-4">
          <label className="label">
            <span className="label-text">Flavor (taille)</span>
          </label>
          <select
            className="select select-bordered select-sm"
            value={runtime.defaultFlavorName}
            onChange={e => handleFlavorChange(e.target.value)}
          >
            {instance?.flavors
              .filter(f => f.available)
              .map(flavor => (
                <option key={flavor.name} value={flavor.name}>
                  {flavor.name} - {flavor.memory.formatted} / {flavor.cpus} CPU
                  ({formatMonthlyPrice(flavor.price * HOURS_PER_MONTH)})
                </option>
              ))}
          </select>
        </div>

        {/* Configuration de la scalabilité */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <NumberInput
            label="Min instances"
            value={runtime.defaultMinInstances}
            onChange={value => handleScalingChange(value, runtime.defaultMaxInstances)}
            min={1}
            max={runtime.defaultMaxInstances}
          />
          <NumberInput
            label="Max instances"
            value={runtime.defaultMaxInstances}
            onChange={value => handleScalingChange(runtime.defaultMinInstances, value)}
            min={runtime.defaultMinInstances}
            max={instance?.maxInstances ?? 40}
          />
        </div>

        {/* Planning hebdomadaire */}
        <div className="mt-4">
          <button
            className="btn btn-outline btn-sm w-full"
            onClick={() => setShowTimeSlots(!showTimeSlots)}
          >
            {showTimeSlots ? 'Masquer' : 'Gérer'} le planning hebdomadaire
            <span className="badge badge-sm ml-2">
              {cost.scalingHours > 0 ? `${cost.scalingHours}h scaling` : '24/7 baseline'}
            </span>
          </button>
        </div>

        {showTimeSlots && (
          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            <TimeSlotEditor
              projectId={projectId}
              runtimeId={runtime.id}
              runtime={runtime}
              instance={instance}
            />
          </div>
        )}

        {/* Détail des coûts */}
        <div className="mt-4 p-3 bg-base-200 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Détail des coûts</h4>
          <div className="space-y-2 text-sm">
            {/* Coût de base */}
            <div className="space-y-1">
              <div className="font-medium text-base-content/80">Base ({cost.baseFlavorName})</div>
              <div className="flex justify-between text-xs">
                <span className="text-base-content/60">
                  {runtime.defaultMinInstances} inst. × {cost.baselineHours}h × {formatHourlyPrice(cost.baseHourlyPrice)} × 4,33
                </span>
                <span>{formatPrice(cost.baseMonthlyCost)}</span>
              </div>
            </div>

            {/* Coût de scaling */}
            {cost.scalingHours > 0 && (
              <div className="space-y-1">
                <div className="font-medium text-base-content/80">
                  Scaling ({cost.scalingFlavorName})
                  {cost.scalingFlavorName !== cost.baseFlavorName && (
                    <span className="badge badge-xs badge-info ml-2">flavor différent</span>
                  )}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-base-content/60">
                    {cost.scalingInstanceHours} inst-h × {formatHourlyPrice(cost.scalingHourlyPrice)} × 4,33
                  </span>
                  <span>{formatPrice(cost.scalingMonthlyCost)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coût estimé */}
        <div className="divider my-2"></div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-base-content/70">Min (base seule)</span>
            <span>{formatPrice(cost.minMonthlyCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Coût actuel (planning)</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(cost.totalMonthlyCost)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-base-content/70">Max (scaling 24/7)</span>
            <span>{formatPrice(cost.maxMonthlyCost)}</span>
          </div>
        </div>
      </div>

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
