import { useState, useCallback, useMemo } from 'react'
import type { RuntimeConfig, WeeklySchedule, ScalingProfile } from '@/types'
import { DAYS_OF_WEEK, createEmptySchedule, BASELINE_PROFILE_ID, getBaselineProfile, getBaseConfig, createBaselineProfile } from '@/types'
import { useProjectActions } from '@/store'
import { useInstances } from '@/hooks/useInstances'
import { calculateRuntimeCost, buildFlavorPriceMap, getAvailableFlavors } from '@/lib/costCalculator'

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
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  // Retrouver l'instance par le logo (unique pour chaque variant)
  const instance = useMemo(
    () => instances?.find(i => i.variant.logo === runtime.variantLogo),
    [instances, runtime.variantLogo]
  )

  // Extraire la configuration de base depuis le profil baseline
  const baselineProfile = useMemo(
    () => getBaselineProfile(runtime.scalingProfiles ?? []),
    [runtime.scalingProfiles]
  )

  const baseConfig = useMemo(
    () => getBaseConfig(runtime.scalingProfiles ?? []),
    [runtime.scalingProfiles]
  )

  const defaultName = useMemo(
    () => instance?.name ?? runtime.instanceType,
    [instance?.name, runtime.instanceType]
  )

  const currentFlavor = useMemo(
    () => instance?.flavors.find(f => f.name === baseConfig.flavorName),
    [instance?.flavors, baseConfig.flavorName]
  )

  const flavorPrices = useMemo(
    () =>
      instances
        ? buildFlavorPriceMap(instances, runtime.instanceType)
        : new Map<string, number>(),
    [instances, runtime.instanceType]
  )

  const availableFlavors = useMemo(
    () => instances ? getAvailableFlavors(instances, runtime.instanceType) : [],
    [instances, runtime.instanceType]
  )

  const cost = useMemo(
    () => calculateRuntimeCost(runtime, flavorPrices, availableFlavors),
    [runtime, flavorPrices, availableFlavors]
  )

  // Calcul de la position de la jauge
  const gaugePosition = useMemo(
    () =>
      cost.maxMonthlyCost > cost.minMonthlyCost
        ? ((cost.estimatedTotalCost - cost.minMonthlyCost) /
            (cost.maxMonthlyCost - cost.minMonthlyCost)) *
          100
        : 0,
    [cost.maxMonthlyCost, cost.minMonthlyCost, cost.estimatedTotalCost]
  )

  // Profils de scaling actifs
  const activeScalingProfiles = useMemo(
    () => (runtime.scalingProfiles ?? []).filter(p => p.enabled && p.id !== BASELINE_PROFILE_ID),
    [runtime.scalingProfiles]
  )

  const hasScaling = activeScalingProfiles.length > 0

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

  // Handler flavor - modifie le profil baseline
  const handleFlavorChange = useCallback(
    (flavorName: string) => {
      const profiles = runtime.scalingProfiles ?? []
      const hasBaseline = profiles.some(p => p.id === BASELINE_PROFILE_ID)

      let newProfiles: ScalingProfile[]
      if (hasBaseline) {
        newProfiles = profiles.map(p =>
          p.id === BASELINE_PROFILE_ID
            ? { ...p, minFlavorName: flavorName, maxFlavorName: flavorName }
            : p
        )
      } else {
        // Créer le baseline s'il n'existe pas
        const baseline = createBaselineProfile()
        baseline.minFlavorName = flavorName
        baseline.maxFlavorName = flavorName
        baseline.enabled = true
        newProfiles = [baseline, ...profiles]
      }
      updateRuntime(projectId, runtime.id, { scalingProfiles: newProfiles })
    },
    [runtime.scalingProfiles, updateRuntime, projectId, runtime.id]
  )

  // Handler base instances - modifie le profil baseline
  const handleBaseInstancesChange = useCallback(
    (value: number) => {
      const profiles = runtime.scalingProfiles ?? []
      const hasBaseline = profiles.some(p => p.id === BASELINE_PROFILE_ID)

      let newProfiles: ScalingProfile[]
      if (hasBaseline) {
        newProfiles = profiles.map(p =>
          p.id === BASELINE_PROFILE_ID
            ? { ...p, minInstances: value, maxInstances: value }
            : p
        )
      } else {
        // Créer le baseline s'il n'existe pas
        const baseline = createBaselineProfile()
        baseline.minInstances = value
        baseline.maxInstances = value
        baseline.enabled = true
        newProfiles = [baseline, ...profiles]
      }
      updateRuntime(projectId, runtime.id, { scalingProfiles: newProfiles })
    },
    [runtime.scalingProfiles, updateRuntime, projectId, runtime.id]
  )

  // Handler switch scaling mode
  const handleToggleScaling = useCallback(
    (enabled: boolean) => {
      updateRuntime(projectId, runtime.id, {
        scalingEnabled: enabled,
        weeklySchedule: enabled ? createEmptySchedule() : undefined,
      })
    },
    [updateRuntime, projectId, runtime.id]
  )

  // Handler profils de scaling
  const handleUpdateScalingProfile = useCallback(
    (profileId: string, updates: Partial<ScalingProfile>) => {
      const newProfiles = (runtime.scalingProfiles ?? []).map(p =>
        p.id === profileId ? { ...p, ...updates } : p
      )
      updateRuntime(projectId, runtime.id, { scalingProfiles: newProfiles })
    },
    [runtime.scalingProfiles, updateRuntime, projectId, runtime.id]
  )

  const handleAddScalingProfile = useCallback(
    (profile: ScalingProfile) => {
      const newProfiles = [...(runtime.scalingProfiles ?? []), profile]
      updateRuntime(projectId, runtime.id, { scalingProfiles: newProfiles })
    },
    [runtime.scalingProfiles, updateRuntime, projectId, runtime.id]
  )

  const handleRemoveScalingProfile = useCallback(
    (profileId: string) => {
      // Ne pas supprimer le profil baseline
      if (profileId === BASELINE_PROFILE_ID) return

      const newProfiles = (runtime.scalingProfiles ?? []).filter(p => p.id !== profileId)

      // Réinitialiser les cellules qui utilisaient ce profil
      const currentSchedule = runtime.weeklySchedule ?? createEmptySchedule()
      const newSchedule: WeeklySchedule = {} as WeeklySchedule

      for (const day of DAYS_OF_WEEK) {
        newSchedule[day] = currentSchedule[day].map(config => {
          if (config.profileId === profileId) {
            return { profileId: BASELINE_PROFILE_ID, loadLevel: 0 as const }
          }
          return config
        })
      }

      updateRuntime(projectId, runtime.id, {
        scalingProfiles: newProfiles,
        weeklySchedule: newSchedule,
      })
    },
    [runtime.scalingProfiles, runtime.weeklySchedule, updateRuntime, projectId, runtime.id]
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
    hasScaling,
    activeScalingProfiles,
    availableFlavors,
    // Configuration de base (depuis baseline profile)
    baselineProfile,
    baseConfig,

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

    // Handler base instances
    onBaseInstancesChange: handleBaseInstancesChange,

    // Handler scaling mode
    onToggleScaling: handleToggleScaling,

    // Handlers profils
    onUpdateScalingProfile: handleUpdateScalingProfile,
    onAddScalingProfile: handleAddScalingProfile,
    onRemoveScalingProfile: handleRemoveScalingProfile,

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
