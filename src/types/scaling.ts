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
 * Profil baseline par défaut (pas de scaling)
 */
export const BASELINE_PROFILE_ID = 'baseline'

export function createBaselineProfile(): ScalingProfile {
  return {
    id: BASELINE_PROFILE_ID,
    name: 'Baseline',
    minInstances: 1,
    maxInstances: 1,
    minFlavorName: '',
    maxFlavorName: '',
    enabled: false,
  }
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
    id: 'default',
    name: 'Standard',
    minInstances,
    maxInstances,
    minFlavorName: baseFlavor,
    maxFlavorName: baseFlavor,
    enabled: true,
  }
}

/**
 * Récupère le profil baseline d'un runtime
 * Le baseline est toujours présent et définit la configuration de base
 */
export function getBaselineProfile(profiles: ScalingProfile[]): ScalingProfile {
  const baseline = profiles?.find(p => p.id === BASELINE_PROFILE_ID)
  if (!baseline) {
    return createBaselineProfile()
  }
  return baseline
}

/**
 * Récupère la configuration de base (instances et flavor minimum)
 * depuis le profil baseline
 */
export function getBaseConfig(profiles: ScalingProfile[]): { instances: number; flavorName: string } {
  const baseline = getBaselineProfile(profiles)
  return {
    instances: baseline.minInstances,
    flavorName: baseline.minFlavorName,
  }
}
