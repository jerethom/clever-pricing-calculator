import { useState, useCallback, useMemo } from 'react'
import type { RuntimeConfig, WeeklySchedule } from '@/types'
import { DAYS_OF_WEEK, createEmptySchedule } from '@/types'
import { useProjectActions } from '@/store'
import { useInstances } from '@/hooks/useInstances'
import { calculateRuntimeCost, buildFlavorPriceMap } from '@/lib/costCalculator'
import type { PendingScalingChange } from './types'

interface UseRuntimeCardOptions {
  projectId: string
  runtime: RuntimeConfig
}

export function useRuntimeCard({ projectId, runtime }: UseRuntimeCardOptions) {
  const { data: instances } = useInstances()
  const { removeRuntime, updateRuntime } = useProjectActions()

  // Etats locaux
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFlavorPicker, setShowFlavorPicker] = useState(false)
  const [pendingScalingChange, setPendingScalingChange] =
    useState<PendingScalingChange | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  // Retrouver l'instance par le logo (unique pour chaque variant)
  const instance = useMemo(
    () => instances?.find(i => i.variant.logo === runtime.variantLogo),
    [instances, runtime.variantLogo]
  )

  const defaultName = useMemo(
    () => instance?.name ?? runtime.instanceType,
    [instance?.name, runtime.instanceType]
  )

  const currentFlavor = useMemo(
    () => instance?.flavors.find(f => f.name === runtime.defaultFlavorName),
    [instance?.flavors, runtime.defaultFlavorName]
  )

  const flavorPrices = useMemo(
    () =>
      instances
        ? buildFlavorPriceMap(instances, runtime.instanceType)
        : new Map<string, number>(),
    [instances, runtime.instanceType]
  )

  const cost = useMemo(
    () => calculateRuntimeCost(runtime, flavorPrices),
    [runtime, flavorPrices]
  )

  // Calcul de la position de la jauge
  const gaugePosition = useMemo(
    () =>
      cost.maxMonthlyCost > cost.minMonthlyCost
        ? ((cost.totalMonthlyCost - cost.minMonthlyCost) /
            (cost.maxMonthlyCost - cost.minMonthlyCost)) *
          100
        : 0,
    [cost.maxMonthlyCost, cost.minMonthlyCost, cost.totalMonthlyCost]
  )

  // Handlers du nom
  const handleStartEditName = useCallback(() => {
    setEditName(runtime.instanceName)
    setIsEditingName(true)
  }, [runtime.instanceName])

  const handleSaveEditName = useCallback(() => {
    if (editName.trim()) {
      updateRuntime(projectId, runtime.id, { instanceName: editName.trim() })
    }
    setIsEditingName(false)
  }, [editName, updateRuntime, projectId, runtime.id])

  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false)
  }, [])

  const handleResetName = useCallback(() => {
    updateRuntime(projectId, runtime.id, { instanceName: defaultName })
    setIsEditingName(false)
  }, [updateRuntime, projectId, runtime.id, defaultName])

  const handleEditNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditName(e.target.value)
    },
    []
  )

  const handleEditNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSaveEditName()
      if (e.key === 'Escape') handleCancelEditName()
    },
    [handleSaveEditName, handleCancelEditName]
  )

  // Handler flavor
  const handleFlavorChange = useCallback(
    (flavorName: string) => {
      updateRuntime(projectId, runtime.id, { defaultFlavorName: flavorName })
    },
    [updateRuntime, projectId, runtime.id]
  )

  // Handlers scaling
  const willImpactSchedule = useCallback(
    (min: number, max: number): boolean => {
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
    },
    [runtime.weeklySchedule]
  )

  const applyScalingChange = useCallback(
    (min: number, max: number) => {
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
    },
    [runtime.weeklySchedule, updateRuntime, projectId, runtime.id]
  )

  const handleScalingChange = useCallback(
    (min: number, max: number) => {
      if (willImpactSchedule(min, max)) {
        setPendingScalingChange({ min, max })
      } else {
        applyScalingChange(min, max)
      }
    },
    [willImpactSchedule, applyScalingChange]
  )

  const handleConfirmScalingChange = useCallback(() => {
    if (pendingScalingChange) {
      applyScalingChange(pendingScalingChange.min, pendingScalingChange.max)
      setPendingScalingChange(null)
    }
  }, [pendingScalingChange, applyScalingChange])

  const handleCancelScalingChange = useCallback(() => {
    setPendingScalingChange(null)
  }, [])

  const handleMinInstancesChange = useCallback(
    (value: number) => {
      const newMax =
        value > runtime.defaultMaxInstances ? value : runtime.defaultMaxInstances
      handleScalingChange(value, newMax)
    },
    [runtime.defaultMaxInstances, handleScalingChange]
  )

  const handleMaxInstancesChange = useCallback(
    (value: number) => {
      const newMin =
        value < runtime.defaultMinInstances ? value : runtime.defaultMinInstances
      handleScalingChange(newMin, value)
    },
    [runtime.defaultMinInstances, handleScalingChange]
  )

  // Handler suppression
  const handleDelete = useCallback(() => {
    removeRuntime(projectId, runtime.id)
    setShowDeleteConfirm(false)
  }, [removeRuntime, projectId, runtime.id])

  // Toggles
  const handleToggleTimeSlots = useCallback(() => {
    setShowTimeSlots(prev => !prev)
  }, [])

  const handleOpenFlavorPicker = useCallback(() => {
    setShowFlavorPicker(true)
  }, [])

  const handleCloseFlavorPicker = useCallback(() => {
    setShowFlavorPicker(false)
  }, [])

  const handleOpenDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleCloseDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  return {
    // Données derivées
    instance,
    defaultName,
    currentFlavor,
    cost,
    gaugePosition,

    // Etat d'édition du nom
    isEditingName,
    editName,
    setEditName,

    // Handlers nom
    onStartEditName: handleStartEditName,
    onSaveEditName: handleSaveEditName,
    onCancelEditName: handleCancelEditName,
    onResetName: handleResetName,
    onEditNameChange: handleEditNameChange,
    onEditNameKeyDown: handleEditNameKeyDown,

    // Handlers flavor
    onFlavorChange: handleFlavorChange,
    showFlavorPicker,
    onOpenFlavorPicker: handleOpenFlavorPicker,
    onCloseFlavorPicker: handleCloseFlavorPicker,

    // Handlers scaling
    onMinInstancesChange: handleMinInstancesChange,
    onMaxInstancesChange: handleMaxInstancesChange,
    pendingScalingChange,
    onConfirmScalingChange: handleConfirmScalingChange,
    onCancelScalingChange: handleCancelScalingChange,

    // Handler suppression
    onDelete: handleDelete,
    showDeleteConfirm,
    onOpenDeleteConfirm: handleOpenDeleteConfirm,
    onCloseDeleteConfirm: handleCloseDeleteConfirm,

    // Planning
    showTimeSlots,
    onToggleTimeSlots: handleToggleTimeSlots,
  }
}
