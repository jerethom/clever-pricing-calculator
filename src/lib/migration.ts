/**
 * Migration des données de l'ancien format vers le nouveau format de scaling
 *
 * Ancien format RuntimeConfig :
 * - defaultFlavorName: string
 * - scalingFlavorName?: string
 * - defaultMinInstances: number
 * - defaultMaxInstances: number
 * - weeklySchedule: Record<DayOfWeek, number[]> (nombre d'instances extra)
 *
 * Format intermédiaire (déprécié) :
 * - baseFlavorName: string
 * - baseInstances: number
 * - scalingProfiles: ScalingProfile[]
 * - weeklySchedule: Record<DayOfWeek, HourlyConfig[]>
 *
 * Nouveau format RuntimeConfig :
 * - scalingEnabled: boolean
 * - scalingProfiles: ScalingProfile[] (baseline obligatoire, contient la config de base)
 * - weeklySchedule?: Record<DayOfWeek, HourlyConfig[]> (seulement si scalingEnabled)
 */

import type { RuntimeConfig, Project, WeeklySchedule, LoadLevel, HourlyConfig } from '@/types'
import type { ScalingProfile } from '@/types/scaling'
import { createBaselineProfile } from '@/types/scaling'
import { DAYS_OF_WEEK, createBaselineConfig, createHourlyConfig } from '@/types/timeSlot'

/**
 * Ancien format de RuntimeConfig (pour la migration)
 */
interface LegacyRuntimeConfig {
  id: string
  instanceType: string
  instanceName: string
  variantLogo: string
  defaultFlavorName: string
  scalingFlavorName?: string
  defaultMinInstances: number
  defaultMaxInstances: number
  weeklySchedule: Record<string, number[]>
}

/**
 * Ancien format de Project (pour la migration)
 */
interface LegacyProject {
  id: string
  organizationId: string
  name: string
  createdAt: string
  updatedAt: string
  runtimes: LegacyRuntimeConfig[]
  addons: unknown[]
}

/**
 * Format intermédiaire (déprécié) avec baseFlavorName/baseInstances
 */
interface IntermediateRuntimeConfig {
  id: string
  instanceType: string
  instanceName: string
  variantLogo: string
  baseFlavorName: string
  baseInstances: number
  scalingProfiles: ScalingProfile[]
  weeklySchedule: WeeklySchedule
}

/**
 * Vérifie si un runtime utilise l'ancien format (très ancien)
 */
export function isLegacyRuntime(runtime: unknown): runtime is LegacyRuntimeConfig {
  const r = runtime as Record<string, unknown>
  return (
    typeof r.defaultMinInstances === 'number' &&
    typeof r.defaultMaxInstances === 'number' &&
    !('baseInstances' in r) &&
    !('scalingEnabled' in r)
  )
}

/**
 * Vérifie si un runtime utilise le format intermédiaire (avec baseFlavorName/baseInstances)
 */
export function isIntermediateRuntime(runtime: unknown): runtime is IntermediateRuntimeConfig {
  const r = runtime as Record<string, unknown>
  return (
    typeof r.baseFlavorName === 'string' &&
    typeof r.baseInstances === 'number' &&
    !('scalingEnabled' in r)
  )
}

/**
 * Vérifie si un schedule utilise l'ancien format (tableau de nombres)
 */
export function isLegacySchedule(schedule: unknown): schedule is Record<string, number[]> {
  if (!schedule || typeof schedule !== 'object') return false
  const s = schedule as Record<string, unknown>
  const firstDay = s['mon']
  return Array.isArray(firstDay) && typeof firstDay[0] === 'number'
}

/**
 * Convertit un niveau d'instances extra en niveau de charge
 *
 * Mapping : 0 -> 0 (baseline), puis proportionnel au max extra
 */
function extraInstancesToLoadLevel(
  extraInstances: number,
  maxExtraInstances: number
): LoadLevel {
  if (extraInstances === 0 || maxExtraInstances === 0) {
    return 0
  }

  // Calculer le ratio et convertir en niveau 1-5
  const ratio = Math.min(extraInstances / maxExtraInstances, 1)
  const level = Math.ceil(ratio * 5) as LoadLevel

  return Math.max(1, Math.min(5, level)) as LoadLevel
}

/**
 * Migre un WeeklySchedule de l'ancien format vers le nouveau
 */
export function migrateWeeklySchedule(
  legacySchedule: Record<string, number[]>,
  maxExtraInstances: number,
  defaultProfileId: string
): WeeklySchedule {
  const newSchedule: WeeklySchedule = {} as WeeklySchedule

  for (const day of DAYS_OF_WEEK) {
    const legacyDay = legacySchedule[day] || Array(24).fill(0)
    const newDay: HourlyConfig[] = []

    for (let hour = 0; hour < 24; hour++) {
      const extraInstances = legacyDay[hour] || 0
      const loadLevel = extraInstancesToLoadLevel(extraInstances, maxExtraInstances)

      if (loadLevel === 0) {
        newDay.push(createBaselineConfig())
      } else {
        newDay.push(createHourlyConfig(defaultProfileId, loadLevel))
      }
    }

    newSchedule[day] = newDay
  }

  return newSchedule
}

/**
 * Migre un RuntimeConfig de l'ancien format vers le nouveau
 */
export function migrateRuntimeConfig(legacy: LegacyRuntimeConfig): RuntimeConfig {
  const maxExtraInstances = legacy.defaultMaxInstances - legacy.defaultMinInstances
  const hasScaling = maxExtraInstances > 0

  // Créer le profil baseline avec la config de base
  const baselineProfile = createBaselineProfile()
  baselineProfile.minInstances = legacy.defaultMinInstances
  baselineProfile.maxInstances = legacy.defaultMinInstances
  baselineProfile.minFlavorName = legacy.defaultFlavorName
  baselineProfile.maxFlavorName = legacy.defaultFlavorName
  baselineProfile.enabled = true

  // Créer un profil de scaling par défaut si le scaling est possible
  const profiles: ScalingProfile[] = [baselineProfile]

  if (hasScaling) {
    const defaultProfile: ScalingProfile = {
      id: 'default',
      name: 'Standard',
      minInstances: legacy.defaultMinInstances,
      maxInstances: legacy.defaultMaxInstances,
      minFlavorName: legacy.defaultFlavorName,
      maxFlavorName: legacy.scalingFlavorName ?? legacy.defaultFlavorName,
      enabled: true,
    }
    profiles.push(defaultProfile)
  }

  // Migrer le schedule (seulement si scaling activé)
  const newSchedule = hasScaling && isLegacySchedule(legacy.weeklySchedule)
    ? migrateWeeklySchedule(legacy.weeklySchedule, maxExtraInstances, 'default')
    : undefined

  return {
    id: legacy.id,
    instanceType: legacy.instanceType,
    instanceName: legacy.instanceName,
    variantLogo: legacy.variantLogo,
    scalingEnabled: hasScaling,
    scalingProfiles: profiles,
    weeklySchedule: newSchedule,
  }
}

/**
 * Migre un RuntimeConfig du format intermédiaire vers le nouveau
 */
export function migrateIntermediateRuntime(intermediate: IntermediateRuntimeConfig): RuntimeConfig {
  // Déterminer si le scaling était activé (plus d'un profil ou profils avec scaling)
  const scalingProfiles = intermediate.scalingProfiles ?? []
  const hasScalingProfiles = scalingProfiles.some(
    p => p.id !== 'baseline' && p.enabled
  )

  // Mettre à jour le profil baseline avec les valeurs de baseInstances/baseFlavorName
  const updatedProfiles = scalingProfiles.map(profile => {
    if (profile.id === 'baseline') {
      return {
        ...profile,
        minInstances: intermediate.baseInstances,
        maxInstances: intermediate.baseInstances,
        minFlavorName: intermediate.baseFlavorName,
        maxFlavorName: intermediate.baseFlavorName,
        enabled: true,
      }
    }
    return profile
  })

  // Si pas de baseline, en créer un
  if (!updatedProfiles.find(p => p.id === 'baseline')) {
    const baselineProfile = createBaselineProfile()
    baselineProfile.minInstances = intermediate.baseInstances
    baselineProfile.maxInstances = intermediate.baseInstances
    baselineProfile.minFlavorName = intermediate.baseFlavorName
    baselineProfile.maxFlavorName = intermediate.baseFlavorName
    baselineProfile.enabled = true
    updatedProfiles.unshift(baselineProfile)
  }

  return {
    id: intermediate.id,
    instanceType: intermediate.instanceType,
    instanceName: intermediate.instanceName,
    variantLogo: intermediate.variantLogo,
    scalingEnabled: hasScalingProfiles,
    scalingProfiles: updatedProfiles,
    weeklySchedule: hasScalingProfiles ? intermediate.weeklySchedule : undefined,
  }
}

/**
 * Migre un Project entier
 */
export function migrateProject(legacy: LegacyProject): Project {
  return {
    ...legacy,
    runtimes: legacy.runtimes.map(runtime => ensureMigratedRuntime(runtime)),
    addons: legacy.addons as Project['addons'],
  }
}

/**
 * Migre un runtime si nécessaire, sinon le retourne tel quel
 */
export function ensureMigratedRuntime(runtime: unknown): RuntimeConfig {
  if (isLegacyRuntime(runtime)) {
    return migrateRuntimeConfig(runtime)
  }
  if (isIntermediateRuntime(runtime)) {
    return migrateIntermediateRuntime(runtime)
  }
  return runtime as RuntimeConfig
}

/**
 * Crée un nouveau RuntimeConfig avec la nouvelle structure
 * Par défaut, crée un runtime en mode fixe (sans scaling)
 */
export function createNewRuntimeConfig(
  id: string,
  instanceType: string,
  instanceName: string,
  variantLogo: string,
  flavorName: string,
  instances: number = 1,
  scalingEnabled: boolean = false
): RuntimeConfig {
  // Créer le profil baseline avec la config de base
  const baselineProfile = createBaselineProfile()
  baselineProfile.minInstances = instances
  baselineProfile.maxInstances = instances
  baselineProfile.minFlavorName = flavorName
  baselineProfile.maxFlavorName = flavorName
  baselineProfile.enabled = true

  return {
    id,
    instanceType,
    instanceName,
    variantLogo,
    scalingEnabled,
    scalingProfiles: [baselineProfile],
    weeklySchedule: undefined,
  }
}
