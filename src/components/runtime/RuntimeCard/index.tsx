import { memo, useMemo, lazy, Suspense } from 'react'
import { ConfirmDialog } from '@/components/ui'

const TimeSlotEditor = lazy(() => import('@/components/timeSlot/TimeSlotEditor'))
const FlavorPicker = lazy(() => import('../FlavorPicker'))
import { RuntimeCardContext } from './RuntimeCardContext'
import { RuntimeCardHeader } from './RuntimeCardHeader'
import { RuntimeCardConfig } from './RuntimeCardConfig'
import { RuntimeCardScaling } from './RuntimeCardScaling'
import { RuntimeCardSchedule } from './RuntimeCardSchedule'
import { RuntimeCardCosts } from './RuntimeCardCosts'
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

    // Handlers scaling
    onMinInstancesChange,
    onMaxInstancesChange,
    pendingScalingChange,
    onConfirmScalingChange,
    onCancelScalingChange,

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

      onMinInstancesChange,
      onMaxInstancesChange,

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
      onMinInstancesChange,
      onMaxInstancesChange,
      showTimeSlots,
      onToggleTimeSlots,
      onOpenDeleteConfirm,
    ]
  )

  return (
    <RuntimeCardContext.Provider value={contextValue}>
      <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
        <div className="card-body p-4 sm:p-6">
          {/* Header avec logo, nom editable, badges */}
          <RuntimeCardHeader />

          {/* Configuration du flavor */}
          <RuntimeCardConfig className="mt-4" />

          {/* Configuration de la scalabilite */}
          <RuntimeCardScaling className="mt-4" />

          {/* Planning hebdomadaire */}
          <RuntimeCardSchedule className="mt-4" />

          {/* Editeur de planning (conditionnel) */}
          {showTimeSlots && (
            <div className="mt-4 p-4 bg-base-200">
              <Suspense fallback={null}>
                <TimeSlotEditor
                  projectId={projectId}
                  runtimeId={runtime.id}
                  runtime={runtime}
                  instance={instance}
                />
              </Suspense>
            </div>
          )}

          {/* Section couts */}
          <RuntimeCardCosts className="mt-4" />
        </div>

        {/* Modal FlavorPicker */}
        <Suspense fallback={null}>
          <FlavorPicker
            isOpen={showFlavorPicker}
            onClose={onCloseFlavorPicker}
            flavors={instance?.flavors ?? []}
            selectedFlavor={runtime.defaultFlavorName}
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

        {/* Modal de confirmation de modification du scaling */}
        <ConfirmDialog
          isOpen={pendingScalingChange !== null}
          title="Modifier le planning"
          message="Cette modification va reduire certaines valeurs du planning hebdomadaire qui depassent le nouveau maximum d'instances supplementaires. Voulez-vous continuer ?"
          confirmLabel="Confirmer"
          cancelLabel="Annuler"
          variant="warning"
          onConfirm={onConfirmScalingChange}
          onCancel={onCancelScalingChange}
        />
      </div>
    </RuntimeCardContext.Provider>
  )
})

// Re-export des sous-composants pour une utilisation individuelle si necessaire
export { RuntimeCardHeader } from './RuntimeCardHeader'
export { RuntimeCardConfig } from './RuntimeCardConfig'
export { RuntimeCardScaling } from './RuntimeCardScaling'
export { RuntimeCardSchedule } from './RuntimeCardSchedule'
export { RuntimeCardCosts } from './RuntimeCardCosts'
export type * from './types'
