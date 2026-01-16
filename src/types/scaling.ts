import { generateProfileId } from '@/lib/typeid'
import type { BaselineConfig } from './project'

/**
 * Profil de scaling réutilisable
 *
 * Permet de définir une configuration de scaling (limites instances et flavors)
 * qui peut être appliquée à plusieurs créneaux horaires de la grille.
 */
export interface ScalingProfile {
  id: string
  name: string
  // Scaling horizontal (nombre d'instances)
  minInstances: number
  maxInstances: number
  // Scaling vertical (plage de flavors)
  minFlavorName: string
  maxFlavorName: string
  // État du scaling
  enabled: boolean // false = reste sur baseline, pas de scaling
}

/**
 * Crée un profil de scaling par défaut
 */
export function createDefaultProfile(
  baseFlavor: string,
  minInstances: number = 1,
  maxInstances: number = 2
): ScalingProfile {
  return {
    id: generateProfileId(),
    name: 'Standard',
    minInstances,
    maxInstances,
    minFlavorName: baseFlavor,
    maxFlavorName: baseFlavor,
    enabled: true,
  }
}

/**
 * Récupère la configuration de base (instances et flavor) depuis le baselineConfig
 */
export function getBaseConfig(baselineConfig: BaselineConfig | undefined): { instances: number; flavorName: string } {
  return {
    instances: baselineConfig?.instances ?? 1,
    flavorName: baselineConfig?.flavorName ?? '',
  }
}
