import type { Instance, InstanceFlavor } from "@/api/types";
import { WEEKS_PER_MONTH } from "@/constants";
import type {
  AddonCostDetail,
  Project,
  ProjectCostSummary,
  RuntimeConfig,
  RuntimeCostDetail,
} from "@/types";
import { createEmptySchedule, DAYS_OF_WEEK, getBaseConfig } from "@/types";
import { calculateAddonCost } from "./addonCostCalculator";
import {
  calculateMaxScalingCost,
  calculateScalingAtLevel,
} from "./scalingCalculator";

const HOURS_PER_MONTH = 730; // ~24h × 30.4j

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
  availableFlavors?: InstanceFlavor[],
): RuntimeCostDetail {
  // Extraire la config baseline depuis baselineConfig
  const baseConfig = getBaseConfig(runtime.baselineConfig);
  const baseFlavorName = baseConfig.flavorName;
  const baseInstances = baseConfig.instances;

  // Prix du flavor de base
  const baseHourlyPrice = flavorPrices.get(baseFlavorName) ?? 0;

  // Coût de base : baseInstances tournent 24/7
  const baseMonthlyCost = baseInstances * baseHourlyPrice * HOURS_PER_MONTH;

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
      scalingCostByProfile: {},
    };
  }

  // Mode scaling : calcul basé entièrement sur le planning
  // La configuration de base n'est plus utilisée, c'est le planning qui détermine le coût
  const schedule = runtime.weeklySchedule ?? createEmptySchedule();

  // Statistiques de scaling
  let scalingHours = 0; // Heures avec loadLevel > 0
  let totalLoadLevel = 0;
  const scalingHoursByProfile: Record<string, number> = {};
  const scalingCostByProfile: Record<string, number> = {}; // Cout hebdomadaire par profil
  let totalWeeklyCost = 0;

  // Trouver le profil par défaut (premier profil actif)
  const defaultProfile = runtime.scalingProfiles?.find((p) => p.enabled);

  // Parcourir TOUTES les cellules de la grille (168 heures)
  for (const day of DAYS_OF_WEEK) {
    for (let hour = 0; hour < 24; hour++) {
      const config = schedule[day][hour];

      // Trouver le profil correspondant à cette cellule
      let profile =
        config?.profileId !== null
          ? runtime.scalingProfiles?.find(
              (p) => p.id === config.profileId && p.enabled,
            )
          : null;

      // Si pas de profil assigné (null = baseline), utiliser le profil par défaut
      if (!profile) {
        profile = defaultProfile;
      }

      // Si toujours pas de profil, utiliser la config baseline (fallback)
      if (!profile) {
        totalWeeklyCost += baseHourlyPrice * baseInstances;
        continue;
      }

      const loadLevel = config?.loadLevel ?? 0;

      // Compter les heures de scaling actif (loadLevel > 0)
      if (loadLevel > 0) {
        scalingHours++;
        totalLoadLevel += loadLevel;
        scalingHoursByProfile[profile.id] =
          (scalingHoursByProfile[profile.id] || 0) + 1;
      }

      // Calculer le coût pour cette heure selon le profil et le niveau
      let hourlyCost = 0;
      if (availableFlavors && availableFlavors.length > 0) {
        const scalingState = calculateScalingAtLevel(
          profile,
          loadLevel,
          availableFlavors,
        );
        hourlyCost = scalingState.hourlyCost;
      } else {
        // Fallback : estimation basée sur le profil
        const minFlavorPrice =
          flavorPrices.get(profile.minFlavorName) ?? baseHourlyPrice;
        const maxFlavorPrice =
          flavorPrices.get(profile.maxFlavorName) ?? baseHourlyPrice;

        if (loadLevel === 0) {
          // Niveau 0 : configuration minimum du profil
          hourlyCost = minFlavorPrice * profile.minInstances;
        } else {
          // Niveaux 1-5 : interpolation entre min et max
          const progressRatio = loadLevel / 5;
          const minCost = minFlavorPrice * profile.minInstances;
          const maxCost = maxFlavorPrice * profile.maxInstances;
          hourlyCost = minCost + progressRatio * (maxCost - minCost);
        }
      }

      totalWeeklyCost += hourlyCost;
      // Accumuler le cout par profil
      scalingCostByProfile[profile.id] =
        (scalingCostByProfile[profile.id] || 0) + hourlyCost;
    }
  }

  // Convertir en coût mensuel (168h/semaine → ~730h/mois)
  const estimatedTotalCost = totalWeeklyCost * WEEKS_PER_MONTH;

  // Le coût de base n'existe plus en mode scaling, c'est le coût du planning niveau 0
  // Calculer le coût si tout était à niveau 0
  let minWeeklyCost = 0;
  if (defaultProfile && availableFlavors && availableFlavors.length > 0) {
    const minState = calculateScalingAtLevel(
      defaultProfile,
      0,
      availableFlavors,
    );
    minWeeklyCost = minState.hourlyCost * 168; // 7 jours × 24h
  } else if (defaultProfile) {
    const minFlavorPrice =
      flavorPrices.get(defaultProfile.minFlavorName) ?? baseHourlyPrice;
    minWeeklyCost = minFlavorPrice * defaultProfile.minInstances * 168;
  } else {
    minWeeklyCost = baseHourlyPrice * baseInstances * 168;
  }
  const minMonthlyCost = minWeeklyCost * WEEKS_PER_MONTH;

  // Calculer le niveau de charge moyen
  const averageLoadLevel = scalingHours > 0 ? totalLoadLevel / scalingHours : 0;

  // Le coût de base affiché = coût minimum (config min du profil)
  const baseMonthlyCostScaling = minMonthlyCost;
  const estimatedScalingCost = Math.max(
    0,
    estimatedTotalCost - baseMonthlyCostScaling,
  );

  // Coût maximum = trouver le profil avec le coût max et l'appliquer 24/7
  let maxScalingHourlyCost = 0;
  const profiles = runtime.scalingProfiles ?? [];
  if (availableFlavors && availableFlavors.length > 0) {
    for (const profile of profiles) {
      if (profile.enabled) {
        const profileMaxCost = calculateMaxScalingCost(
          profile,
          availableFlavors,
          baseFlavorName,
        );
        maxScalingHourlyCost = Math.max(maxScalingHourlyCost, profileMaxCost);
      }
    }
  } else {
    // Fallback : estimer le coût max à partir des profils
    for (const profile of profiles) {
      if (profile.enabled) {
        const profileFlavorPrice =
          flavorPrices.get(profile.maxFlavorName) ?? baseHourlyPrice;
        const profileMaxCost = profile.maxInstances * profileFlavorPrice;
        maxScalingHourlyCost = Math.max(maxScalingHourlyCost, profileMaxCost);
      }
    }
  }

  const maxMonthlyCost =
    maxScalingHourlyCost > 0
      ? maxScalingHourlyCost * HOURS_PER_MONTH
      : minMonthlyCost;

  // En mode scaling, utiliser la config du profil par défaut pour les infos de base
  const displayBaseFlavorName = defaultProfile?.minFlavorName ?? baseFlavorName;
  const displayBaseInstances = defaultProfile?.minInstances ?? baseInstances;
  const displayBaseHourlyPrice =
    flavorPrices.get(displayBaseFlavorName) ?? baseHourlyPrice;

  return {
    runtimeId: runtime.id,
    runtimeName: runtime.instanceName,
    instanceType: runtime.instanceType,
    // Base (en mode scaling = config min du profil par défaut)
    baseFlavorName: displayBaseFlavorName,
    baseInstances: displayBaseInstances,
    baseHourlyPrice: displayBaseHourlyPrice,
    baseMonthlyCost: Math.round(baseMonthlyCostScaling * 100) / 100,
    // Scaling estimé (différence entre total et min)
    estimatedScalingCost: Math.round(estimatedScalingCost * 100) / 100,
    estimatedTotalCost: Math.round(estimatedTotalCost * 100) / 100,
    // Plage de coûts
    minMonthlyCost: Math.round(minMonthlyCost * 100) / 100,
    maxMonthlyCost: Math.round(maxMonthlyCost * 100) / 100,
    // Stats
    scalingHours,
    averageLoadLevel: Math.round(averageLoadLevel * 10) / 10,
    scalingHoursByProfile,
    // Convertir les couts hebdomadaires par profil en couts mensuels
    scalingCostByProfile: Object.fromEntries(
      Object.entries(scalingCostByProfile).map(([id, weeklyCost]) => [
        id,
        Math.round(weeklyCost * WEEKS_PER_MONTH * 100) / 100,
      ]),
    ),
  };
}

/**
 * Construit un map des prix par flavor pour un type d'instance donné
 */
export function buildFlavorPriceMap(
  instances: Instance[],
  instanceType: string,
): Map<string, number> {
  const instance = instances.find((i) => i.type === instanceType);
  const priceMap = new Map<string, number>();

  if (instance) {
    for (const flavor of instance.flavors) {
      priceMap.set(flavor.name, flavor.price);
    }
  }

  return priceMap;
}

/**
 * Obtient les flavors disponibles pour un type d'instance
 */
export function getAvailableFlavors(
  instances: Instance[],
  instanceType: string,
): InstanceFlavor[] {
  const instance = instances.find((i) => i.type === instanceType);
  return instance?.flavors.filter((f) => f.available) ?? [];
}

/**
 * Calcule le résumé complet des coûts pour un projet
 */
export function calculateProjectCost(
  project: Project,
  instances: Instance[],
): ProjectCostSummary {
  // Calculer les coûts des runtimes
  const runtimesDetail = project.runtimes.map((runtime) => {
    const flavorPrices = buildFlavorPriceMap(instances, runtime.instanceType);
    const availableFlavors = getAvailableFlavors(
      instances,
      runtime.instanceType,
    );
    return calculateRuntimeCost(runtime, flavorPrices, availableFlavors);
  });

  const runtimesCost = runtimesDetail.reduce(
    (sum, r) => sum + r.estimatedTotalCost,
    0,
  );

  // Calculer les coûts des addons (utilise le nouveau calculateur pour les addons usage-based)
  const addonsDetail: AddonCostDetail[] = project.addons.map((addon) =>
    calculateAddonCost(addon),
  );

  const addonsCost = addonsDetail.reduce((sum, a) => sum + a.monthlyPrice, 0);

  return {
    projectId: project.id,
    projectName: project.name,
    runtimesCost: Math.round(runtimesCost * 100) / 100,
    runtimesDetail,
    addonsCost: Math.round(addonsCost * 100) / 100,
    addonsDetail,
    totalMonthlyCost: Math.round((runtimesCost + addonsCost) * 100) / 100,
  };
}

/**
 * Formate un prix en euros avec une meilleure lisibilité
 * - Pas de décimales pour les montants >= 10€
 * - 2 décimales pour les petits montants
 */
export function formatPrice(price: number): string {
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "EUR",
    // Pas de centimes pour les montants >= 10€
    minimumFractionDigits: price >= 10 ? 0 : 2,
    maximumFractionDigits: price >= 10 ? 0 : 2,
  };
  return new Intl.NumberFormat("fr-FR", options).format(price);
}

/**
 * Formate un prix horaire
 */
export function formatHourlyPrice(price: number): string {
  return `${formatPrice(price)}/h`;
}

/**
 * Formate un prix mensuel
 */
export function formatMonthlyPrice(price: number): string {
  return `${formatPrice(price)}/mois`;
}
