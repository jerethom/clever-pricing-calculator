import type { WeeklySchedule } from './timeSlot'
import type { ScalingProfile } from './scaling'

/**
 * Configuration de base du runtime (hors scaling)
 */
export interface BaselineConfig {
  instances: number
  flavorName: string
}

export interface RuntimeConfig {
  id: string
  instanceType: string // ex: "node", "python"
  instanceName: string // ex: "Node.js"
  variantLogo: string // URL du logo
  // Mode de fonctionnement
  scalingEnabled: boolean // false = config fixe, true = scaling dynamique
  // Configuration de base (instances et flavor fixes)
  baselineConfig: BaselineConfig
  // Profils de scaling (optionnel, uniquement si scalingEnabled)
  scalingProfiles: ScalingProfile[]
  // Grille hebdomadaire (seulement si scalingEnabled)
  weeklySchedule?: WeeklySchedule
}

export interface AddonConfig {
  id: string
  providerId: string // ex: "postgresql-addon"
  providerName: string // ex: "PostgreSQL"
  providerLogo: string
  planId: string
  planName: string
  monthlyPrice: number
}

export interface Project {
  id: string
  organizationId: string
  name: string
  createdAt: string
  updatedAt: string
  runtimes: RuntimeConfig[]
  addons: AddonConfig[]
}
