/**
 * Calculateur de scaling à la manière de Clever Cloud
 *
 * Principe : Pour un niveau de charge donné, le scaling vertical
 * est prioritaire sur l'horizontal.
 *
 * Exemple avec minFlavor=S, maxFlavor=XL, minInstances=1, maxInstances=4 :
 * - Niveau 0 : Baseline (aucun scaling)
 * - Niveau 1 : 1× M (vertical +1)
 * - Niveau 2 : 1× L (vertical +2)
 * - Niveau 3 : 1× XL (vertical max)
 * - Niveau 4 : 2× XL (horizontal commence)
 * - Niveau 5 : 4× XL (horizontal max)
 */

import type { InstanceFlavor } from "@/api/types";
import type { LoadLevel, ScalingProfile } from "@/types";

export interface ScalingState {
  flavorName: string;
  flavorIndex: number;
  instances: number;
  hourlyCost: number;
}

/**
 * Obtient les flavors disponibles entre min et max (inclus), triés par prix
 */
export function getFlavorRange(
  availableFlavors: InstanceFlavor[],
  minFlavorName: string,
  maxFlavorName: string,
): InstanceFlavor[] {
  // Trier par prix croissant
  const sortedFlavors = [...availableFlavors]
    .filter((f) => f.available)
    .sort((a, b) => a.price - b.price);

  const minIndex = sortedFlavors.findIndex((f) => f.name === minFlavorName);
  const maxIndex = sortedFlavors.findIndex((f) => f.name === maxFlavorName);

  if (minIndex === -1 || maxIndex === -1) {
    return sortedFlavors;
  }

  const startIdx = Math.min(minIndex, maxIndex);
  const endIdx = Math.max(minIndex, maxIndex);

  return sortedFlavors.slice(startIdx, endIdx + 1);
}

/**
 * Calcule le nombre total de "pas" de scaling disponibles
 *
 * Un pas = soit un changement de flavor (vertical), soit une instance en plus (horizontal)
 */
export function calculateTotalScalingSteps(
  flavorRange: InstanceFlavor[],
  minInstances: number,
  maxInstances: number,
): number {
  // Pas verticaux = nombre de flavors au-dessus du minimum
  const verticalSteps = flavorRange.length - 1;

  // Pas horizontaux = instances supplémentaires possibles
  const horizontalSteps = maxInstances - minInstances;

  return verticalSteps + horizontalSteps;
}

/**
 * Calcule l'état de scaling pour un niveau de charge donné
 *
 * Le scaling vertical est appliqué en priorité, puis l'horizontal.
 *
 * Niveau 0 = configuration minimum du profil (minInstances × minFlavor)
 * Niveaux 1-5 = scaling progressif jusqu'à maxInstances × maxFlavor
 */
export function calculateScalingAtLevel(
  profile: ScalingProfile,
  loadLevel: LoadLevel,
  availableFlavors: InstanceFlavor[],
): ScalingState {
  // Profil désactivé : retourner la config minimum du profil
  if (!profile.enabled) {
    const minFlavor = availableFlavors.find(
      (f) => f.name === profile.minFlavorName,
    );
    return {
      flavorName: profile.minFlavorName,
      flavorIndex: 0,
      instances: profile.minInstances,
      hourlyCost: (minFlavor?.price ?? 0) * profile.minInstances,
    };
  }

  // Niveau 0 = configuration minimum du profil (pas de scaling actif)
  if (loadLevel === 0) {
    const minFlavor = availableFlavors.find(
      (f) => f.name === profile.minFlavorName,
    );
    return {
      flavorName: profile.minFlavorName,
      flavorIndex: 0,
      instances: profile.minInstances,
      hourlyCost: (minFlavor?.price ?? 0) * profile.minInstances,
    };
  }

  // Obtenir la plage de flavors du profil
  const flavorRange = getFlavorRange(
    availableFlavors,
    profile.minFlavorName,
    profile.maxFlavorName,
  );

  if (flavorRange.length === 0) {
    // Fallback : utiliser la config minimum du profil
    const minFlavor = availableFlavors.find(
      (f) => f.name === profile.minFlavorName,
    );
    return {
      flavorName: profile.minFlavorName,
      flavorIndex: 0,
      instances: profile.minInstances,
      hourlyCost: (minFlavor?.price ?? 0) * profile.minInstances,
    };
  }

  const totalSteps = calculateTotalScalingSteps(
    flavorRange,
    profile.minInstances,
    profile.maxInstances,
  );

  if (totalSteps === 0) {
    // Pas de scaling possible
    return {
      flavorName: flavorRange[0].name,
      flavorIndex: 0,
      instances: profile.minInstances,
      hourlyCost: flavorRange[0].price * profile.minInstances,
    };
  }

  // Calculer le nombre de pas à appliquer selon le niveau (1-5)
  // Niveau 1 = 20%, Niveau 2 = 40%, ..., Niveau 5 = 100%
  const progressRatio = loadLevel / 5;
  const stepsToApply = Math.round(progressRatio * totalSteps);

  // Nombre de pas verticaux disponibles
  const maxVerticalSteps = flavorRange.length - 1;

  // Appliquer d'abord les pas verticaux
  const verticalSteps = Math.min(stepsToApply, maxVerticalSteps);
  const remainingSteps = stepsToApply - verticalSteps;

  // Puis les pas horizontaux
  const maxHorizontalSteps = profile.maxInstances - profile.minInstances;
  const horizontalSteps = Math.min(remainingSteps, maxHorizontalSteps);

  // Déterminer le flavor final
  const flavorIndex = verticalSteps;
  const selectedFlavor = flavorRange[flavorIndex];

  // Déterminer le nombre d'instances final
  const instances = profile.minInstances + horizontalSteps;

  return {
    flavorName: selectedFlavor.name,
    flavorIndex,
    instances,
    hourlyCost: selectedFlavor.price * instances,
  };
}

/**
 * Calcule le coût horaire minimum (baseline)
 */
export function calculateBaselineCost(
  baseFlavorName: string,
  baseInstances: number,
  availableFlavors: InstanceFlavor[],
): number {
  const baseFlavor = availableFlavors.find((f) => f.name === baseFlavorName);
  return (baseFlavor?.price ?? 0) * baseInstances;
}

/**
 * Calcule le coût horaire maximum (scaling max 24/7)
 */
export function calculateMaxScalingCost(
  profile: ScalingProfile,
  availableFlavors: InstanceFlavor[],
  baseFlavorName: string,
): number {
  if (!profile.enabled) {
    const baseFlavor = availableFlavors.find((f) => f.name === baseFlavorName);
    return (baseFlavor?.price ?? 0) * profile.minInstances;
  }

  const flavorRange = getFlavorRange(
    availableFlavors,
    profile.minFlavorName || baseFlavorName,
    profile.maxFlavorName || baseFlavorName,
  );

  if (flavorRange.length === 0) {
    return 0;
  }

  // Coût max = flavor max × instances max
  const maxFlavor = flavorRange[flavorRange.length - 1];
  return maxFlavor.price * profile.maxInstances;
}

/**
 * Retourne une description textuelle de l'état de scaling
 */
export function describeScalingState(state: ScalingState): string {
  return `${state.instances}× ${state.flavorName}`;
}
