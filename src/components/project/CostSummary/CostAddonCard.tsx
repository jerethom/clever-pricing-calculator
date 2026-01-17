import { memo } from "react";
import { Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";
import type { CostAddonCardProps } from "./types";

export const CostAddonCard = memo(function CostAddonCard({
	addon,
}: CostAddonCardProps) {
	return (
		<div className="card bg-base-100 border border-base-300 hover:border-secondary/30 transition-colors duration-200">
			<div className="card-body p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-secondary/10 rounded-lg">
							<Icons.Puzzle className="w-5 h-5 text-secondary" />
						</div>
						<div>
							<h3 className="font-semibold text-base">{addon.providerName}</h3>
							<span className="badge badge-secondary badge-sm badge-outline">
								{addon.planName}
							</span>
						</div>
					</div>
					<div className="text-right">
						<div className="font-bold text-secondary text-lg">
							{formatPrice(addon.monthlyPrice)}
						</div>
						<div className="text-xs text-base-content/60">/mois</div>
					</div>
				</div>
			</div>
		</div>
	);
});
