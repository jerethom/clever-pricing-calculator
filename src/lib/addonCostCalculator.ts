import type {
  AddonConfig,
  AddonCostDetail,
  UsageEstimate,
  UsageMetric,
  UsageMetricCostDetail,
} from "@/types";
import {
  getUsageBasedPricing,
  isUsageBasedAddon,
} from "./addonPricingRegistry";

/**
 * Calcule le coût d'une métrique en fonction de sa valeur et des paliers de tarification
 */
export function calculateMetricCost(
  metric: UsageMetric,
  value: number,
): number {
  // Appliquer le quota gratuit
  const billableValue = Math.max(0, value - metric.freeQuota);

  if (billableValue === 0) return 0;

  let totalCost = 0;
  let remainingValue = billableValue;

  // Parcourir les paliers de tarification
  for (const tier of metric.tiers) {
    if (remainingValue <= 0) break;

    // Calculer la quantité dans ce palier
    const tierMax =
      tier.maxThreshold !== null
        ? tier.maxThreshold - tier.minThreshold
        : remainingValue;
    const quantityInTier = Math.min(remainingValue, tierMax);

    // Ajouter le coût pour ce palier
    totalCost += quantityInTier * tier.pricePerUnit;
    remainingValue -= quantityInTier;
  }

  return Math.round(totalCost * 100) / 100;
}

/**
 * Calcule le coût total d'un addon en fonction de ses estimations d'usage
 */
export function calculateAddonCost(addon: AddonConfig): AddonCostDetail {
  const baseDetail: AddonCostDetail = {
    addonId: addon.id,
    providerName: addon.providerName,
    planName: addon.planName,
    monthlyPrice: addon.monthlyPrice,
    isUsageBased: false,
    isEstimate: false,
  };

  // Vérifier si c'est un addon usage-based
  if (!isUsageBasedAddon(addon.providerId)) {
    return baseDetail;
  }

  const pricing = getUsageBasedPricing(addon.providerId);
  if (!pricing) {
    return baseDetail;
  }

  // Récupérer les estimations ou utiliser les valeurs par défaut
  const estimates = addon.usageEstimates ?? [];

  // Calculer le coût par métrique
  const usageDetails: UsageMetricCostDetail[] = pricing.metrics.map(
    (metric) => {
      const estimate = estimates.find((e) => e.metricId === metric.id);
      const value = estimate?.value ?? metric.defaultValue;
      const cost = calculateMetricCost(metric, value);
      const freeQuotaApplied = Math.min(value, metric.freeQuota);

      return {
        metricId: metric.id,
        metricName: metric.name,
        value,
        unit: metric.unit,
        cost,
        freeQuotaApplied,
      };
    },
  );

  // Calculer le coût total d'usage
  const usageCost = usageDetails.reduce((sum, detail) => sum + detail.cost, 0);

  // Le prix total = prix de base du plan + coût d'usage
  const totalMonthlyPrice = addon.monthlyPrice + usageCost;

  return {
    ...baseDetail,
    monthlyPrice: Math.round(totalMonthlyPrice * 100) / 100,
    isUsageBased: true,
    usageCost: Math.round(usageCost * 100) / 100,
    usageDetails,
    isEstimate: true,
  };
}

/**
 * Met à jour les estimations d'un addon
 */
export function updateAddonEstimates(
  addon: AddonConfig,
  estimates: UsageEstimate[],
): AddonConfig {
  return {
    ...addon,
    usageEstimates: estimates,
    isUsageBased: isUsageBasedAddon(addon.providerId),
  };
}
