import type { WeeklySchedule } from './timeSlot'

export interface RuntimeConfig {
  id: string
  instanceType: string // ex: "node", "python"
  instanceName: string // ex: "Node.js"
  variantLogo: string // URL du logo
  defaultFlavorName: string // ex: "S", "M" - flavor pour les instances de base
  scalingFlavorName?: string // flavor pour les instances de scaling (>= defaultFlavorName en prix)
  defaultMinInstances: number
  defaultMaxInstances: number
  weeklySchedule: WeeklySchedule
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
