import { memo } from "react";
import { Icons } from "@/components/ui";
import { DURATION_OPTIONS, type DurationSelectorProps } from "./types";

export const DurationSelector = memo(function DurationSelector({
	selectedMonths,
	onSelect,
}: DurationSelectorProps) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-3">
			<div className="flex items-center gap-2 text-sm text-base-content/70">
				<Icons.Clock className="w-4 h-4" />
				<span className="font-medium">Periode de projection</span>
			</div>
			<div className="join join-horizontal flex-wrap">
				{DURATION_OPTIONS.map((option) => (
					<button
						key={option.months}
						type="button"
						onClick={() => onSelect(option.months)}
						className={`join-item btn btn-sm transition-all duration-200 ${
							selectedMonths === option.months
								? "btn-accent"
								: "btn-ghost hover:bg-accent/10"
						}`}
					>
						<span className="hidden sm:inline">{option.label}</span>
						<span className="sm:hidden">{option.shortLabel}</span>
					</button>
				))}
			</div>
		</div>
	);
});
