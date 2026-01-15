import type { RuntimeConfig, Project, RuntimeCostDetail, AddonCostDetail, ProjectCostSummary } from '@/types'
import { DAYS_OF_WEEK, createEmptySchedule } from '@/types'
import type { Instance } from '@/api/types'
import { WEEKS_PER_MONTH } from '@/constants'

/**
 * Calcule le coût total pour un runtime basé sur son planning hebdomadaire
 *
 * Sépare le calcul entre :
 * - Coût de base : minInstances × baseHourlyPrice × 168h × 4.33 sem/mois
 * - Coût de scaling : extraInstances × scalingHourlyPrice × heures × 4.33 sem/mois
 */
export function calculateRuntimeCost(
  runtime: RuntimeConfig,
  flavorPrices: Map<string, number>
): RuntimeCostDetail {
  // Prix des flavors
  const baseHourlyPrice = flavorPrices.get(runtime.defaultFlavorName) ?? 0
  const scalingFlavorName = runtime.scalingFlavorName ?? runtime.defaultFlavorName
  const scalingHourlyPrice = flavorPrices.get(scalingFlavorName) ?? baseHourlyPrice

  // Fallback pour les anciens runtimes sans weeklySchedule
  const schedule = runtime.weeklySchedule ?? createEmptySchedule()

  // Constantes
  const baselineHours = 168 // 24h × 7j

  // Calculer les instance-heures de scaling par semaine
  let scalingInstanceHoursPerWeek = 0
  let scalingHours = 0

  for (const day of DAYS_OF_WEEK) {
    for (let hour = 0; hour < 24; hour++) {
      const extraInstances = schedule[day][hour]
      if (extraInstances > 0) {
        scalingInstanceHoursPerWeek += extraInstances
        scalingHours++
      }
    }
  }

  // Coût de base : minInstances tournent 24/7
  const baseInstanceHours = runtime.defaultMinInstances * baselineHours
  const baseMonthlyCost = baseInstanceHours * baseHourlyPrice * WEEKS_PER_MONTH

  // Coût de scaling : instances supplémentaires selon le planning
  const scalingInstanceHours = scalingInstanceHoursPerWeek
  const scalingMonthlyCost = scalingInstanceHours * scalingHourlyPrice * WEEKS_PER_MONTH

  const totalMonthlyCost = baseMonthlyCost + scalingMonthlyCost

  // Coût min = base seulement (pas de scaling)
  const minMonthlyCost = baseMonthlyCost

  // Coût max = base + scaling max 24/7
  const maxExtraInstances = runtime.defaultMaxInstances - runtime.defaultMinInstances
  const maxScalingInstanceHours = maxExtraInstances * baselineHours
  const maxScalingMonthlyCost = maxScalingInstanceHours * scalingHourlyPrice * WEEKS_PER_MONTH
  const maxMonthlyCost = baseMonthlyCost + maxScalingMonthlyCost

  return {
    runtimeId: runtime.id,
    runtimeName: runtime.instanceName,
    instanceType: runtime.instanceType,
    // Base
    baseFlavorName: runtime.defaultFlavorName,
    baseHourlyPrice,
    baseInstanceHours,
    baseMonthlyCost: Math.round(baseMonthlyCost * 100) / 100,
    // Scaling
    scalingFlavorName,
    scalingHourlyPrice,
    scalingInstanceHours,
    scalingMonthlyCost: Math.round(scalingMonthlyCost * 100) / 100,
    // Stats
    baselineHours,
    scalingHours,
    // Coûts
    minMonthlyCost: Math.round(minMonthlyCost * 100) / 100,
    maxMonthlyCost: Math.round(maxMonthlyCost * 100) / 100,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
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
 * Calcule le résumé complet des coûts pour un projet
 */
export function calculateProjectCost(
  project: Project,
  instances: Instance[]
): ProjectCostSummary {
  // Calculer les coûts des runtimes
  const runtimesDetail = project.runtimes.map(runtime => {
    const flavorPrices = buildFlavorPriceMap(instances, runtime.instanceType)
    return calculateRuntimeCost(runtime, flavorPrices)
  })

  const runtimesCost = runtimesDetail.reduce((sum, r) => sum + r.totalMonthlyCost, 0)

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
