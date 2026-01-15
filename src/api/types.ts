// Types pour les réponses de l'API Clever Cloud

// ============================================
// Types pour les Instances (Runtimes)
// ============================================

export interface InstanceMemory {
  unit: string
  value: number
  formatted: string
}

export interface InstanceFlavor {
  name: string
  mem: number
  cpus: number
  gpus: number
  disk: number
  price: number
  price_id: string
  available: boolean
  microservice: boolean
  machine_learning: boolean
  nice: number
  memory: InstanceMemory
}

export interface InstanceVariant {
  id: string
  slug: string
  name: string
  deployType: string
  logo: string
}

export interface Instance {
  type: string
  version: string
  name: string
  description: string
  enabled: boolean
  comingSoon: boolean
  variant: InstanceVariant
  maxInstances: number
  maxAllowedInstances: number
  minFlavor: InstanceFlavor
  maxFlavor: InstanceFlavor
  flavors: InstanceFlavor[]
  defaultFlavor: InstanceFlavor
  buildFlavor: InstanceFlavor
  deployments: string[]
  tags?: string[]
}

// ============================================
// Types pour les Addon Providers
// ============================================

export interface AddonFeature {
  name: string
  type: 'NUMBER' | 'BYTES' | 'STRING' | 'BOOLEAN' | 'BOOLEAN_SHARED' | 'OBJECT'
  value: string
  computable_value?: string | number | null
  name_code: string
}

export interface AddonPlan {
  id: string
  name: string
  slug: string
  price: number
  price_id: string | null
  features: AddonFeature[]
  zones: string[]
}

export interface AddonProvider {
  id: string
  name: string
  website?: string
  supportEmail?: string
  googlePlusName?: string
  twitterName?: string
  analyticsId?: string
  shortDesc: string
  longDesc: string
  logoUrl: string
  status: string
  openInNewTab: boolean
  canUpgrade: boolean
  regions: string[]
  plans: AddonPlan[]
  features: AddonFeature[]
}

// ============================================
// Types pour les Zones
// ============================================

export interface Zone {
  name: string
  displayName: string
  country: string
  countryCode: string
  city: string
  lat: number
  lon: number
  outboundIps: string[]
  tags: string[]
}
