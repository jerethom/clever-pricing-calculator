import type { Instance, AddonProvider, Zone } from './types'

const API_BASE_URL = 'https://api.clever-cloud.com'

interface RuntimePrice {
  slug_id: string
  price: number
}

/**
 * Récupère les prix réels depuis l'API v4
 */
async function fetchRuntimePrices(): Promise<Map<string, number>> {
  const response = await fetch(`${API_BASE_URL}/v4/billing/price-system?zone_id=par`)

  if (!response.ok) {
    console.warn('Impossible de récupérer les prix v4, utilisation des prix par défaut')
    return new Map()
  }

  const data = await response.json()
  const priceMap = new Map<string, number>()

  for (const item of data.runtime as RuntimePrice[]) {
    // Normaliser le slug_id (ex: "apps.XS" -> "apps.XS")
    priceMap.set(item.slug_id, item.price)
  }

  return priceMap
}

/**
 * Récupère la liste des instances (runtimes) disponibles
 * avec leurs flavors et prix horaires corrigés
 */
export async function fetchInstances(): Promise<Instance[]> {
  const [instancesResponse, priceMap] = await Promise.all([
    fetch(`${API_BASE_URL}/v2/products/instances`),
    fetchRuntimePrices(),
  ])

  if (!instancesResponse.ok) {
    throw new Error(`Erreur lors de la récupération des instances: ${instancesResponse.status}`)
  }

  const data: Instance[] = await instancesResponse.json()

  // Corriger les prix avec les données de l'API v4
  for (const instance of data) {
    for (const flavor of instance.flavors) {
      const realPrice = priceMap.get(flavor.price_id)
      if (realPrice !== undefined) {
        flavor.price = realPrice
      }
    }
    // Corriger aussi defaultFlavor
    const defaultPrice = priceMap.get(instance.defaultFlavor.price_id)
    if (defaultPrice !== undefined) {
      instance.defaultFlavor.price = defaultPrice
    }
  }

  // Filtrer uniquement les instances activées
  return data.filter(instance => instance.enabled && !instance.comingSoon)
}

/**
 * Récupère la liste des fournisseurs d'addons
 * avec leurs plans et prix mensuels
 */
export async function fetchAddonProviders(): Promise<AddonProvider[]> {
  const response = await fetch(`${API_BASE_URL}/v2/products/addonproviders`)

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des addons: ${response.status}`)
  }

  const data: AddonProvider[] = await response.json()

  // Filtrer uniquement les addons en release
  return data.filter(addon => addon.status === 'RELEASE')
}

/**
 * Récupère la liste des zones disponibles
 */
export async function fetchZones(): Promise<Zone[]> {
  const response = await fetch(`${API_BASE_URL}/v4/products/zones`)

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des zones: ${response.status}`)
  }

  return response.json()
}
