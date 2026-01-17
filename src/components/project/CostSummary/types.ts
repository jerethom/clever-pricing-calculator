import type {
	AddonCostDetail,
	ProjectCostSummary,
	RuntimeCostDetail,
} from "@/types";

export interface CostSummaryProps {
	cost: ProjectCostSummary;
}

export interface DurationOption {
	months: number;
	label: string;
	shortLabel: string;
}

export interface CostBreakdownBarProps {
	runtimesCost: number;
	addonsCost: number;
	total: number;
}

export interface CostRuntimeCardProps {
	runtime: RuntimeCostDetail;
}

export interface CostAddonCardProps {
	addon: AddonCostDetail;
}

export const DURATION_OPTIONS: DurationOption[] = [
	{ months: 1, label: "1 mois", shortLabel: "1m" },
	{ months: 3, label: "3 mois", shortLabel: "3m" },
	{ months: 6, label: "6 mois", shortLabel: "6m" },
	{ months: 12, label: "1 an", shortLabel: "1a" },
	{ months: 24, label: "2 ans", shortLabel: "2a" },
	{ months: 36, label: "3 ans", shortLabel: "3a" },
];

export function formatDurationLabel(months: number): string {
	if (months === 1) return "1 mois";
	if (months < 12) return `${months} mois`;
	if (months === 12) return "1 an";
	const years = months / 12;
	return `${years} an${years > 1 ? "s" : ""}`;
}
