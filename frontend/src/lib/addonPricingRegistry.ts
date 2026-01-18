import type { UsageBasedPricing, UsageEstimate } from "@/types";

/**
 * Registre des configurations de tarification à l'usage par provider d'addon
 *
 * Sources :
 * - Cellar S3 : https://www.clever-cloud.com/pricing/ (~20€/TB/mois stockage, 0.09€/GB transfert)
 * - FS Bucket : https://www.clever-cloud.com/pricing/ (100MB gratuits, ~1.65€/GB/mois)
 * - Pulsar : Tarifs dégressifs
 * - Heptapod : ~0.02€/GB/mois stockage, ~7€/user/mois
 * - Materia KV : Gratuit (beta)
 */
export const USAGE_BASED_PRICING_REGISTRY: UsageBasedPricing[] = [
  {
    providerId: "cellar-addon",
    pricingDescription: "Facturation au stockage et à la bande passante",
    metrics: [
      {
        id: "storage_gb",
        name: "Stockage",
        unit: "GB",
        freeQuota: 0,
        tiers: [{ minThreshold: 0, maxThreshold: null, pricePerUnit: 0.02 }],
        defaultValue: 100,
        minValue: 0,
        maxValue: 10000,
        step: 10,
      },
      {
        id: "bandwidth_gb",
        name: "Bande passante sortante",
        unit: "GB",
        freeQuota: 0,
        tiers: [{ minThreshold: 0, maxThreshold: null, pricePerUnit: 0.09 }],
        defaultValue: 50,
        minValue: 0,
        maxValue: 5000,
        step: 10,
      },
    ],
  },
  {
    providerId: "fs-bucket",
    pricingDescription: "100 Mo gratuits, puis facturation au stockage",
    metrics: [
      {
        id: "storage_gb",
        name: "Stockage",
        unit: "GB",
        freeQuota: 0.1, // 100 Mo gratuits
        tiers: [{ minThreshold: 0, maxThreshold: null, pricePerUnit: 1.65 }],
        defaultValue: 5,
        minValue: 0,
        maxValue: 1000,
        step: 1,
      },
    ],
  },
  {
    providerId: "addon-pulsar",
    pricingDescription: "Facturation au stockage et aux I/O",
    metrics: [
      {
        id: "storage_gb",
        name: "Stockage",
        unit: "GB",
        freeQuota: 0,
        tiers: [
          { minThreshold: 0, maxThreshold: 100, pricePerUnit: 0.1 },
          { minThreshold: 100, maxThreshold: 1000, pricePerUnit: 0.08 },
          { minThreshold: 1000, maxThreshold: null, pricePerUnit: 0.05 },
        ],
        defaultValue: 50,
        minValue: 0,
        maxValue: 5000,
        step: 10,
      },
      {
        id: "io_operations",
        name: "Operations I/O",
        unit: "M ops",
        freeQuota: 1, // 1 million gratuit
        tiers: [{ minThreshold: 0, maxThreshold: null, pricePerUnit: 0.5 }],
        defaultValue: 10,
        minValue: 0,
        maxValue: 1000,
        step: 1,
      },
    ],
  },
  {
    providerId: "heptapod",
    pricingDescription: "Facturation au stockage et par utilisateur",
    metrics: [
      {
        id: "storage_gb",
        name: "Stockage Git",
        unit: "GB",
        freeQuota: 0,
        tiers: [{ minThreshold: 0, maxThreshold: null, pricePerUnit: 0.02 }],
        defaultValue: 10,
        minValue: 0,
        maxValue: 500,
        step: 1,
      },
      {
        id: "users",
        name: "Utilisateurs",
        unit: "utilisateurs",
        freeQuota: 0,
        tiers: [{ minThreshold: 0, maxThreshold: null, pricePerUnit: 7 }],
        defaultValue: 5,
        minValue: 1,
        maxValue: 100,
        step: 1,
      },
    ],
  },
  {
    providerId: "kv",
    pricingDescription: "Gratuit (beta)",
    metrics: [
      {
        id: "storage_gb",
        name: "Stockage",
        unit: "GB",
        freeQuota: 1000, // Tout est gratuit en beta
        tiers: [{ minThreshold: 0, maxThreshold: null, pricePerUnit: 0 }],
        defaultValue: 1,
        minValue: 0,
        maxValue: 100,
        step: 1,
      },
    ],
  },
];

/**
 * Vérifie si un addon a une tarification à l'usage
 */
export function isUsageBasedAddon(providerId: string): boolean {
  return USAGE_BASED_PRICING_REGISTRY.some((p) => p.providerId === providerId);
}

/**
 * Récupère la configuration de tarification pour un provider
 */
export function getUsageBasedPricing(
  providerId: string,
): UsageBasedPricing | undefined {
  return USAGE_BASED_PRICING_REGISTRY.find((p) => p.providerId === providerId);
}

/**
 * Génère les estimations par défaut pour un addon usage-based
 */
export function getDefaultUsageEstimates(
  providerId: string,
): UsageEstimate[] | undefined {
  const pricing = getUsageBasedPricing(providerId);
  if (!pricing) return undefined;

  return pricing.metrics.map((metric) => ({
    metricId: metric.id,
    value: metric.defaultValue,
  }));
}
