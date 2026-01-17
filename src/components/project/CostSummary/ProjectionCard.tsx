import { memo } from "react";
import { Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";
import { formatDurationLabel, type ProjectionCardProps } from "./types";

export const ProjectionCard = memo(function ProjectionCard({
	type,
	cost,
	selectedMonths,
	hasCostRange,
	minCost,
	maxCost,
}: ProjectionCardProps) {
	const isMonthly = type === "monthly";
	const periodLabel = isMonthly
		? "/mois"
		: `/${formatDurationLabel(selectedMonths)}`;

	if (isMonthly) {
		return (
			<div className="card bg-gradient-to-br from-primary/15 via-primary/5 to-base-100 border-2 border-primary/30 shadow-xl shadow-primary/10 overflow-hidden relative group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50">
				{/* Badge Estime */}
				<div className="absolute top-3 right-3">
					<span className="badge badge-primary badge-sm gap-1">
						<Icons.TrendingUp className="w-3 h-3" />
						Estime
					</span>
				</div>

				{/* Effet de brillance */}
				<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

				<div className="card-body p-6 relative">
					{/* Header avec icone */}
					<div className="flex items-center gap-3 mb-4">
						<div className="p-3 bg-primary/20 rounded-xl ring-2 ring-primary/30">
							<Icons.Calendar className="w-6 h-6 text-primary" />
						</div>
						<div>
							<span className="text-xs font-semibold text-primary uppercase tracking-wider">
								Cout mensuel
							</span>
							<p className="text-xs text-base-content/50">
								Reference sur 1 mois
							</p>
						</div>
					</div>

					{/* Montant principal */}
					<div className="text-center py-4">
						<div className="text-5xl md:text-6xl font-black text-primary tabular-nums tracking-tight animate-cost-scale-in">
							{formatPrice(cost)}
						</div>
						<div className="text-lg text-primary/70 font-medium mt-1">
							{periodLabel}
						</div>
					</div>

					{/* Fourchette si applicable */}
					{hasCostRange && (
						<div className="mt-4 pt-4 border-t border-primary/20">
							<div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
								<span>Fourchette:</span>
								<span className="font-semibold text-base-content">
									{formatPrice(minCost)}
								</span>
								<span>-</span>
								<span className="font-semibold text-base-content">
									{formatPrice(maxCost)}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="card bg-gradient-to-br from-accent/15 via-accent/5 to-base-100 border-2 border-accent/30 shadow-xl shadow-accent/10 overflow-hidden relative group transition-all duration-300 hover:shadow-2xl hover:shadow-accent/20 hover:border-accent/50">
			{/* Badge Projection */}
			<div className="absolute top-3 right-3">
				<span className="badge badge-accent badge-sm gap-1">
					<Icons.TrendingUp className="w-3 h-3" />
					Projection
				</span>
			</div>

			{/* Effet de brillance */}
			<div className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

			<div className="card-body p-6 relative">
				{/* Header avec icone */}
				<div className="flex items-center gap-3 mb-4">
					<div className="p-3 bg-accent/20 rounded-xl ring-2 ring-accent/30">
						<Icons.CalendarYear className="w-6 h-6 text-accent" />
					</div>
					<div>
						<span className="text-xs font-semibold text-accent uppercase tracking-wider">
							Cout total
						</span>
						<p className="text-xs text-base-content/50">
							Projection sur {formatDurationLabel(selectedMonths)}
						</p>
					</div>
				</div>

				{/* Montant principal */}
				<div className="text-center py-4">
					<div
						key={selectedMonths}
						className="text-5xl md:text-6xl font-black text-accent tabular-nums tracking-tight animate-cost-scale-in"
					>
						{formatPrice(cost)}
					</div>
					<div className="text-lg text-accent/70 font-medium mt-1">
						{periodLabel}
					</div>
				</div>

				{/* Fourchette projetee si applicable */}
				{hasCostRange && (
					<div className="mt-4 pt-4 border-t border-accent/20">
						<div className="flex items-center justify-center gap-2 text-sm text-base-content/60">
							<span>Fourchette:</span>
							<span className="font-semibold text-base-content">
								{formatPrice(minCost)}
							</span>
							<span>-</span>
							<span className="font-semibold text-base-content">
								{formatPrice(maxCost)}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
});
