import type { RuntimeConfig, Project, RuntimeCostDetail, AddonCostDetail, ProjectCostSummary } from '@/types'
import { DAYS_OF_WEEK, createEmptySchedule, BASELINE_PROFILE_ID, getBaselineProfile } from '@/types'
import type { Instance, InstanceFlavor } from '@/api/types'
import { WEEKS_PER_MONTH } from '@/constants'
import {
  calculateScalingAtLevel,
  calculateMaxScalingCost,
} from './scalingCalculator'

const HOURS_PER_MONTH = 730 // ~24h × 30.4j

/**
 * Calcule le coût total pour un runtime basé sur son planning hebdomadaire
 *
 * Utilise l'algorithme de scaling Clever Cloud :
 * - Coût de base : baseInstances × baseFlavorPrice × 24/7
 * - Coût de scaling : calculé selon le niveau de charge de chaque créneau
 */
export function calculateRuntimeCost(
  runtime: RuntimeConfig,
  flavorPrices: Map<string, number>,
  availableFlavors?: InstanceFlavor[]
): RuntimeCostDetail {
  // Extraire la config baseline depuis le profil
  const baseline = getBaselineProfile(runtime.scalingProfiles ?? [])
  const baseFlavorName = baseline.minFlavorName
  const baseInstances = baseline.minInstances

  // Prix du flavor de base
  const baseHourlyPrice = flavorPrices.get(baseFlavorName) ?? 0

  // Coût de base : baseInstances tournent 24/7
  const baseMonthlyCost = baseInstances * baseHourlyPrice * HOURS_PER_MONTH

  // Mode fixe : pas de scaling, coût constant
  if (!runtime.scalingEnabled) {
    return {
      runtimeId: runtime.id,
      runtimeName: runtime.instanceName,
      instanceType: runtime.instanceType,
      baseFlavorName,
      baseInstances,
      baseHourlyPrice,
      baseMonthlyCost: Math.round(baseMonthlyCost * 100) / 100,
      estimatedScalingCost: 0,
      estimatedTotalCost: Math.round(baseMonthlyCost * 100) / 100,
      minMonthlyCost: Math.round(baseMonthlyCost * 100) / 100,
      maxMonthlyCost: Math.round(baseMonthlyCost * 100) / 100,
      scalingHours: 0,
      averageLoadLevel: 0,
      scalingHoursByProfile: {},
    }
  }

  // Mode scaling : calcul complet avec planning
  const schedule = runtime.weeklySchedule ?? createEmptySchedule()

  // Statistiques de scaling
  let scalingHours = 0
  let totalLoadLevel = 0
  const scalingHoursByProfile: Record<string, number> = {}
  let estimatedScalingCostPerWeek = 0

  // Parcourir chaque cellule de la grille
  for (const day of DAYS_OF_WEEK) {
    for (let hour = 0; hour < 24; hour++) {
      const config = schedule[day][hour]

      // Ignorer les cellules baseline
      if (!config || config.profileId === BASELINE_PROFILE_ID || config.loadLevel === 0) {
        continue
      }

      // Trouver le profil correspondant
      const profile = runtime.scalingProfiles?.find(p => p.id === config.profileId)
      if (!profile || !profile.enabled) {
        continue
      }

      scalingHours++
      totalLoadLevel += config.loadLevel
      scalingHoursByProfile[config.profileId] = (scalingHoursByProfile[config.profileId] || 0) + 1

      // Calculer le coût de scaling pour cette heure
      if (availableFlavors && availableFlavors.length > 0) {
        const scalingState = calculateScalingAtLevel(
          profile,
          config.loadLevel,
          availableFlavors,
          baseFlavorName,
          baseInstances
        )

        // Coût supplémentaire = coût du scaling - coût baseline
        const baselineCost = baseHourlyPrice * baseInstances
        const extraCost = Math.max(0, scalingState.hourlyCost - baselineCost)
        estimatedScalingCostPerWeek += extraCost
      } else {
        // Fallback : estimation simple basée sur le niveau de charge
        const maxExtraFromProfile = profile.maxInstances - profile.minInstances
        const estimatedExtraInstances = (config.loadLevel / 5) * maxExtraFromProfile

        // Utiliser le prix du flavor max du profil s'il existe
        const scalingFlavorPrice = flavorPrices.get(profile.maxFlavorName) ?? baseHourlyPrice
        estimatedScalingCostPerWeek += estimatedExtraInstances * scalingFlavorPrice
      }
    }
  }

  // Convertir en coût mensuel
  const estimatedScalingCost = estimatedScalingCostPerWeek * WEEKS_PER_MONTH
  const estimatedTotalCost = baseMonthlyCost + estimatedScalingCost

  // Calculer le niveau de charge moyen
  const averageLoadLevel = scalingHours > 0 ? totalLoadLevel / scalingHours : 0

  // Coût minimum = baseline seulement
  const minMonthlyCost = baseMonthlyCost

  // Coût maximum = trouver le profil avec le coût max et l'appliquer 24/7
  let maxScalingHourlyCost = 0
  const profiles = runtime.scalingProfiles ?? []
  if (availableFlavors && availableFlavors.length > 0) {
    for (const profile of profiles) {
      if (profile.enabled) {
        const profileMaxCost = calculateMaxScalingCost(
          profile,
          availableFlavors,
          baseFlavorName
        )
        maxScalingHourlyCost = Math.max(maxScalingHourlyCost, profileMaxCost)
      }
    }
  } else {
    // Fallback : estimer le coût max à partir des profils
    for (const profile of profiles) {
      if (profile.enabled) {
        const profileFlavorPrice = flavorPrices.get(profile.maxFlavorName) ?? baseHourlyPrice
        const profileMaxCost = profile.maxInstances * profileFlavorPrice
        maxScalingHourlyCost = Math.max(maxScalingHourlyCost, profileMaxCost)
      }
    }
  }

  const maxMonthlyCost = maxScalingHourlyCost > 0
    ? maxScalingHourlyCost * HOURS_PER_MONTH
    : baseMonthlyCost

  return {
    runtimeId: runtime.id,
    runtimeName: runtime.instanceName,
    instanceType: runtime.instanceType,
    // Base
    baseFlavorName,
    baseInstances,
    baseHourlyPrice,
    baseMonthlyCost: Math.round(baseMonthlyCost * 100) / 100,
    // Scaling estimé
    estimatedScalingCost: Math.round(estimatedScalingCost * 100) / 100,
    estimatedTotalCost: Math.round(estimatedTotalCost * 100) / 100,
    // Plage de coûts
    minMonthlyCost: Math.round(minMonthlyCost * 100) / 100,
    maxMonthlyCost: Math.round(maxMonthlyCost * 100) / 100,
    // Stats
    scalingHours,
    averageLoadLevel: Math.round(averageLoadLevel * 10) / 10,
    scalingHoursByProfile,
  }
}

/**
 * Construit un map des prix par flavor pour un type d'instance donné
 */
export function buildFlavorPriceMap(instances: Instance[], instanceType: string): Map<string, number> {
  const instance = instances.find(i => i.type === instanceType)
  const priceMap = new Map<string, number>()

  if (instance) {
    for (const flavor of instance.flavors) {
      priceMap.set(flavor.name, flavor.price)
    }
  }

  return priceMap
}

/**
 * Obtient les flavors disponibles pour un type d'instance
 */
export function getAvailableFlavors(instances: Instance[], instanceType: string): InstanceFlavor[] {
  const instance = instances.find(i => i.type === instanceType)
  return instance?.flavors.filter(f => f.available) ?? []
}

/**
 * Calcule le résumé complet des coûts pour un projet
 */
export function calculateProjectCost(
  project: Project,
  instances: Instance[]
): ProjectCostSummary {
  // Calculer les coûts des runtimes
  const runtimesDetail = project.runtimes.map(runtime => {
    const flavorPrices = buildFlavorPriceMap(instances, runtime.instanceType)
    const availableFlavors = getAvailableFlavors(instances, runtime.instanceType)
    return calculateRuntimeCost(runtime, flavorPrices, availableFlavors)
  })

  const runtimesCost = runtimesDetail.reduce((sum, r) => sum + r.estimatedTotalCost, 0)

  // Calculer les coûts des addons (prix mensuel fixe)
  const addonsDetail: AddonCostDetail[] = project.addons.map(addon => ({
    addonId: addon.id,
    providerName: addon.providerName,
    planName: addon.planName,
    monthlyPrice: addon.monthlyPrice,
  }))

  const addonsCost = addonsDetail.reduce((sum, a) => sum + a.monthlyPrice, 0)

  return {
    projectId: project.id,
    projectName: project.name,
    runtimesCost: Math.round(runtimesCost * 100) / 100,
    runtimesDetail,
    addonsCost: Math.round(addonsCost * 100) / 100,
    addonsDetail,
    totalMonthlyCost: Math.round((runtimesCost + addonsCost) * 100) / 100,
  }
}

/**
 * Formate un prix en euros avec une meilleure lisibilité
 * - Pas de décimales pour les montants >= 10€
 * - 2 décimales pour les petits montants
 */
export function formatPrice(price: number): string {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'EUR',
    // Pas de centimes pour les montants >= 10€
    minimumFractionDigits: price >= 10 ? 0 : 2,
    maximumFractionDigits: price >= 10 ? 0 : 2,
  }
  return new Intl.NumberFormat('fr-FR', options).format(price)
}

/**
 * Formate un prix horaire
 */
export function formatHourlyPrice(price: number): string {
  return `${formatPrice(price)}/h`
}

/**
 * Formate un prix mensuel
 */
export function formatMonthlyPrice(price: number): string {
  return `${formatPrice(price)}/mois`
}
