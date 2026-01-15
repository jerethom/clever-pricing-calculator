export interface RuntimeCostDetail {
  runtimeId: string
  runtimeName: string
  instanceType: string
  // Flavor de base
  baseFlavorName: string
  baseHourlyPrice: number
  baseInstanceHours: number // minInstances × 168h
  baseMonthlyCost: number
  // Flavor de scaling
  scalingFlavorName: string
  scalingHourlyPrice: number
  scalingInstanceHours: number // instances supplémentaires × heures de scaling
  scalingMonthlyCost: number
  // Statistiques
  baselineHours: number // 168h (24×7)
  scalingHours: number // Nombre d'heures avec scaling > 0
  // Coûts
  minMonthlyCost: number // Coût minimum (base seulement, sans scaling)
  maxMonthlyCost: number // Coût maximum (base + scaling max 24/7)
  totalMonthlyCost: number // Coût actuel selon le planning
}

export interface AddonCostDetail {
  addonId: string
  providerName: string
  planName: string
  monthlyPrice: number
}

export interface ProjectCostSummary {
  projectId: string
  projectName: string
  runtimesCost: number
  runtimesDetail: RuntimeCostDetail[]
  addonsCost: number
  addonsDetail: AddonCostDetail[]
  totalMonthlyCost: number
}
