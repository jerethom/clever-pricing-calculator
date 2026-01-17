export interface RuntimeCostDetail {
	runtimeId: string;
	runtimeName: string;
	instanceType: string;
	// Configuration de base (24/7)
	baseFlavorName: string;
	baseInstances: number;
	baseHourlyPrice: number;
	baseMonthlyCost: number; // baseInstances × baseHourlyPrice × 730h
	// Estimation du scaling par niveau de charge
	estimatedScalingCost: number;
	estimatedTotalCost: number; // baseMonthlyCost + estimatedScalingCost
	// Plage de coûts
	minMonthlyCost: number; // Baseline uniquement (pas de scaling)
	maxMonthlyCost: number; // Scaling max 24/7
	// Statistiques
	scalingHours: number; // Nombre d'heures avec scaling > 0
	averageLoadLevel: number; // Niveau de charge moyen (0-5)
	scalingHoursByProfile: Record<string, number>; // Heures par profil
	scalingCostByProfile: Record<string, number>; // Cout mensuel par profil
}

export interface AddonCostDetail {
	addonId: string;
	providerName: string;
	planName: string;
	monthlyPrice: number;
}

export interface ProjectCostSummary {
	projectId: string;
	projectName: string;
	runtimesCost: number;
	runtimesDetail: RuntimeCostDetail[];
	addonsCost: number;
	addonsDetail: AddonCostDetail[];
	totalMonthlyCost: number;
}
