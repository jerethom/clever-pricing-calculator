import { memo, useState } from "react";
import { Icons } from "@/components/ui";
import { formatMonthlyPrice, formatPrice } from "@/lib/costCalculator";
import type { ProjectCostSummary } from "@/types";
import { CostAddonCard } from "./CostAddonCard";
import { CostBreakdownBar } from "./CostBreakdownBar";
import { CostRuntimeCard } from "./CostRuntimeCard";
import { DurationSelector } from "./DurationSelector";
import { ProjectionCard } from "./ProjectionCard";

interface CostSummaryProps {
	cost: ProjectCostSummary;
}

const CostSummary = memo(function CostSummary({ cost }: CostSummaryProps) {
	const [selectedMonths, setSelectedMonths] = useState(12);

	const totalMinCost =
		cost.runtimesDetail.reduce((sum, r) => sum + r.minMonthlyCost, 0) +
		cost.addonsCost;
	const totalMaxCost =
		cost.runtimesDetail.reduce((sum, r) => sum + r.maxMonthlyCost, 0) +
		cost.addonsCost;
	const hasCostRange = totalMinCost !== totalMaxCost;

	const projectedCost = cost.totalMonthlyCost * selectedMonths;
	const projectedMinCost = totalMinCost * selectedMonths;
	const projectedMaxCost = totalMaxCost * selectedMonths;

	return (
		<div className="space-y-6 animate-cost-fade-in">
			{/* Selecteur de duree */}
			<div className="card bg-base-100 border border-base-300">
				<div className="card-body p-4">
					<DurationSelector
						selectedMonths={selectedMonths}
						onSelect={setSelectedMonths}
					/>
				</div>
			</div>

			{/* Section Projection - Cartes Mensuel et Projection */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Carte Mensuel - Reference fixe */}
				<ProjectionCard
					type="monthly"
					cost={cost.totalMonthlyCost}
					selectedMonths={selectedMonths}
					hasCostRange={hasCostRange}
					minCost={totalMinCost}
					maxCost={totalMaxCost}
				/>

				{/* Carte Projection - Dynamique selon la duree selectionnee */}
				<ProjectionCard
					type="projection"
					cost={projectedCost}
					selectedMonths={selectedMonths}
					hasCostRange={hasCostRange}
					minCost={projectedMinCost}
					maxCost={projectedMaxCost}
				/>
			</div>

			{/* Stats rapides et repartition */}
			<div className="card bg-base-100 border border-base-300 overflow-hidden">
				<div className="card-body p-5">
					{/* Stats rapides */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-center gap-6 mb-6">
						<div className="text-center">
							<div className="flex items-center justify-center gap-1.5 mb-1">
								<Icons.Server className="w-4 h-4 text-primary" />
								<span className="text-xs text-base-content/60 uppercase tracking-wide">
									Runtimes
								</span>
							</div>
							<div className="font-bold text-2xl text-primary">
								{formatPrice(cost.runtimesCost)}
							</div>
							<div className="text-xs text-base-content/50">
								{cost.runtimesDetail.length} instance(s)
							</div>
						</div>
						<div className="hidden sm:block divider divider-horizontal mx-0 h-16" />
						<div className="sm:hidden divider my-0" />
						<div className="text-center">
							<div className="flex items-center justify-center gap-1.5 mb-1">
								<Icons.Puzzle className="w-4 h-4 text-secondary" />
								<span className="text-xs text-base-content/60 uppercase tracking-wide">
									Addons
								</span>
							</div>
							<div className="font-bold text-2xl text-secondary">
								{formatPrice(cost.addonsCost)}
							</div>
							<div className="text-xs text-base-content/50">
								{cost.addonsDetail.length} service(s)
							</div>
						</div>
					</div>

					{/* Barre de repartition */}
					{cost.totalMonthlyCost > 0 && (
						<>
							<div className="divider my-2" />
							<CostBreakdownBar
								runtimesCost={cost.runtimesCost}
								addonsCost={cost.addonsCost}
								total={cost.totalMonthlyCost}
							/>
						</>
					)}
				</div>
			</div>

			{/* Detail des runtimes */}
			{cost.runtimesDetail.length > 0 && (
				<div
					className="space-y-4 animate-cost-slide-up"
					style={{ animationDelay: "0.1s" }}
				>
					<div className="flex items-center gap-2">
						<Icons.Server className="w-5 h-5 text-primary" />
						<h2 className="text-lg font-semibold">Runtimes</h2>
						<span className="badge badge-primary badge-sm">
							{cost.runtimesDetail.length}
						</span>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{cost.runtimesDetail.map((runtime, index) => (
							<div
								key={runtime.runtimeId}
								className="animate-cost-item-fade-in"
								style={{ animationDelay: `${0.1 + index * 0.05}s` }}
							>
								<CostRuntimeCard runtime={runtime} />
							</div>
						))}
					</div>
					<div className="flex justify-end">
						<div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
							<span className="text-sm text-base-content/70">
								Total Runtimes:{" "}
							</span>
							<span className="font-bold text-primary">
								{formatMonthlyPrice(cost.runtimesCost)}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Detail des addons */}
			{cost.addonsDetail.length > 0 && (
				<div
					className="space-y-4 animate-cost-slide-up"
					style={{ animationDelay: "0.2s" }}
				>
					<div className="flex items-center gap-2">
						<Icons.Puzzle className="w-5 h-5 text-secondary" />
						<h2 className="text-lg font-semibold">Addons</h2>
						<span className="badge badge-secondary badge-sm">
							{cost.addonsDetail.length}
						</span>
					</div>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{cost.addonsDetail.map((addon, index) => (
							<div
								key={addon.addonId}
								className="animate-cost-item-fade-in"
								style={{ animationDelay: `${0.2 + index * 0.05}s` }}
							>
								<CostAddonCard addon={addon} />
							</div>
						))}
					</div>
					<div className="flex justify-end">
						<div className="bg-secondary/5 border border-secondary/20 rounded-lg px-4 py-2">
							<span className="text-sm text-base-content/70">
								Total Addons:{" "}
							</span>
							<span className="font-bold text-secondary">
								{formatMonthlyPrice(cost.addonsCost)}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Message si vide */}
			{cost.runtimesDetail.length === 0 && cost.addonsDetail.length === 0 && (
				<div className="card bg-base-100 border border-base-300">
					<div className="card-body items-center text-center py-12">
						<Icons.TrendingUp className="w-12 h-12 text-base-content/20 mb-4" />
						<h3 className="font-semibold text-lg">Aucun element a facturer</h3>
						<p className="text-base-content/60">
							Ajoutez des runtimes ou des addons pour voir la projection des
							couts.
						</p>
					</div>
				</div>
			)}
		</div>
	);
});

export { CostSummary };
export default CostSummary;
