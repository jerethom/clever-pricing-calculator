import type { RuntimeConfig, RuntimeCostDetail } from '@/types'
import type { Instance, InstanceFlavor } from '@/api/types'

/**
 * Props du composant principal RuntimeCard
 */
export interface RuntimeCardProps {
  projectId: string
  runtime: RuntimeConfig
}

/**
 * Contexte partagé entre les sous-composants RuntimeCard
 */
export interface RuntimeCardContextValue {
  // Données
  projectId: string
  runtime: RuntimeConfig
  instance: Instance | undefined
  currentFlavor: InstanceFlavor | undefined
  cost: RuntimeCostDetail
  gaugePosition: number
  defaultName: string

  // Etat d'édition du nom
  isEditingName: boolean
  editName: string
  setEditName: (name: string) => void

  // Handlers du nom
  onStartEditName: () => void
  onSaveEditName: () => void
  onCancelEditName: () => void
  onResetName: () => void
  onEditNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onEditNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void

  // Handlers configuration
  onOpenFlavorPicker: () => void
  onFlavorChange: (flavorName: string) => void

  // Handlers scaling
  onMinInstancesChange: (value: number) => void
  onMaxInstancesChange: (value: number) => void

  // Handlers planning
  showTimeSlots: boolean
  onToggleTimeSlots: () => void

  // Handlers suppression
  onOpenDeleteConfirm: () => void
}

/**
 * Props pour RuntimeCardHeader
 */
export interface RuntimeCardHeaderProps {
  className?: string
}

/**
 * Props pour RuntimeCardConfig
 */
export interface RuntimeCardConfigProps {
  className?: string
}

/**
 * Props pour RuntimeCardScaling
 */
export interface RuntimeCardScalingProps {
  className?: string
}

/**
 * Props pour RuntimeCardSchedule
 */
export interface RuntimeCardScheduleProps {
  className?: string
}

/**
 * Props pour RuntimeCardCosts
 */
export interface RuntimeCardCostsProps {
  className?: string
}

/**
 * Changement de scaling en attente de confirmation
 */
export interface PendingScalingChange {
  min: number
  max: number
}
