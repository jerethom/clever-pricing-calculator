import { memo, useMemo, lazy, Suspense } from 'react'
import { ConfirmDialog } from '@/components/ui'

const FlavorPicker = lazy(() => import('../FlavorPicker'))
import { RuntimeCardContext } from './RuntimeCardContext'
import { RuntimeCardIdentity } from './RuntimeCardIdentity'
import { RuntimeCardQuickConfig } from './RuntimeCardQuickConfig'
import { RuntimeCardAdvanced } from './RuntimeCardAdvanced'
import { useRuntimeCard } from './useRuntimeCard'
import type { RuntimeCardProps, RuntimeCardContextValue } from './types'

export const RuntimeCard = memo(function RuntimeCard({
  projectId,
  runtime,
}: RuntimeCardProps) {
  const {
    // Données derivées
    instance,
    defaultName,
    currentFlavor,
    cost,
    gaugePosition,
    hasScaling,
    activeScalingProfiles,
    availableFlavors,
    baseConfig,

    // Etat d'édition du nom
    isEditingName,
    editName,
    setEditName,

    // Handlers nom
    onStartEditName,
    onSaveEditName,
    onCancelEditName,
    onResetName,
    onEditNameChange,
    onEditNameKeyDown,

    // Handlers flavor
    onFlavorChange,
    showFlavorPicker,
    onOpenFlavorPicker,
    onCloseFlavorPicker,

    // Handler base instances
    onBaseInstancesChange,

    // Handler scaling mode
    onToggleScaling,

    // Handlers profils
    onUpdateScalingProfile,
    onAddScalingProfile,
    onRemoveScalingProfile,

    // Handler suppression
    onDelete,
    showDeleteConfirm,
    onOpenDeleteConfirm,
    onCloseDeleteConfirm,

    // Planning
    showTimeSlots,
    onToggleTimeSlots,
  } = useRuntimeCard({ projectId, runtime })

  // Construire la valeur du contexte
  const contextValue = useMemo<RuntimeCardContextValue>(
    () => ({
      projectId,
      runtime,
      instance,
      currentFlavor,
      cost,
      gaugePosition,
      defaultName,
      hasScaling,
      activeScalingProfiles,
      availableFlavors,
      baseConfig,

      isEditingName,
      editName,
      setEditName,

      onStartEditName,
      onSaveEditName,
      onCancelEditName,
      onResetName,
      onEditNameChange,
      onEditNameKeyDown,

      onOpenFlavorPicker,
      onFlavorChange,

      onBaseInstancesChange,
      onToggleScaling,

      onUpdateScalingProfile,
      onAddScalingProfile,
      onRemoveScalingProfile,

      showTimeSlots,
      onToggleTimeSlots,

      onOpenDeleteConfirm,
    }),
    [
      projectId,
      runtime,
      instance,
      currentFlavor,
      cost,
      gaugePosition,
      defaultName,
      hasScaling,
      activeScalingProfiles,
      availableFlavors,
      baseConfig,
      isEditingName,
      editName,
      setEditName,
      onStartEditName,
      onSaveEditName,
      onCancelEditName,
      onResetName,
      onEditNameChange,
      onEditNameKeyDown,
      onOpenFlavorPicker,
      onFlavorChange,
      onBaseInstancesChange,
      onToggleScaling,
      onUpdateScalingProfile,
      onAddScalingProfile,
      onRemoveScalingProfile,
      showTimeSlots,
      onToggleTimeSlots,
      onOpenDeleteConfirm,
    ]
  )

  return (
    <RuntimeCardContext.Provider value={contextValue}>
      <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
        <div className="card-body p-4 sm:p-6">
          {/* Zone Identity: Logo, nom editable, cout principal, badge mode */}
          <RuntimeCardIdentity />

          {/* Zone Quick Config: Configuration rapide (collapse ouvert) */}
          <RuntimeCardQuickConfig className="mt-4" />

          {/* Zone Advanced: Options avancees (collapse ferme) */}
          <RuntimeCardAdvanced className="mt-4" />
        </div>

        {/* Modal FlavorPicker */}
        <Suspense fallback={null}>
          <FlavorPicker
            isOpen={showFlavorPicker}
            onClose={onCloseFlavorPicker}
            flavors={instance?.flavors ?? []}
            selectedFlavor={baseConfig.flavorName}
            onSelect={onFlavorChange}
          />
        </Suspense>

        {/* Modal de confirmation de suppression */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Supprimer le runtime"
          message={`Voulez-vous vraiment supprimer le runtime "${runtime.instanceName}" ?`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="error"
          onConfirm={onDelete}
          onCancel={onCloseDeleteConfirm}
        />
      </div>
    </RuntimeCardContext.Provider>
  )
})

export type * from './types'
