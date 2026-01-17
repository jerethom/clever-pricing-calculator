import { memo } from "react";
import { Icons } from "@/components/ui";
import { DAY_LETTERS } from "@/constants";
import { DAYS_OF_WEEK } from "@/types";
import { useRuntimeCardContext } from "./RuntimeCardContext";
import type { RuntimeCardScheduleProps } from "./types";

export const RuntimeCardSchedule = memo(function RuntimeCardSchedule({
	className = "",
}: RuntimeCardScheduleProps) {
	const { runtime, cost, showTimeSlots, onToggleTimeSlots } =
		useRuntimeCardContext();

	if (!runtime.scalingEnabled) return null;

	const btnClass = showTimeSlots ? "btn-primary" : "btn-outline";

	return (
		<div className={className}>
			<button
				type="button"
				className={`btn w-full justify-between h-auto py-3 px-4 ${btnClass}`}
				onClick={onToggleTimeSlots}
			>
				<div className="flex items-center gap-2">
					<Icons.Clock className="w-4 h-4" />
					<span>Planning hebdomadaire</span>
				</div>

				<div className="flex items-center gap-2">
					<div className="hidden sm:flex gap-0.5">
						{DAYS_OF_WEEK.map((dayKey, i) => {
							const hasScaling =
								runtime.weeklySchedule?.[dayKey]?.some(
									(h) => h.loadLevel > 0,
								) ?? false;
							const dayClass = hasScaling
								? "bg-warning text-warning-content"
								: showTimeSlots
									? "bg-primary-content/20 text-primary-content/50"
									: "bg-base-300 text-base-content/50";

							return (
								<div
									key={dayKey}
									className={`w-4 h-4 text-[8px] flex items-center justify-center font-bold ${dayClass}`}
								>
									{DAY_LETTERS[i]}
								</div>
							);
						})}
					</div>

					<span
						className={`badge badge-sm ${showTimeSlots ? "badge-ghost" : ""}`}
					>
						{cost.scalingHours > 0 ? `${cost.scalingHours}h` : "24/7"}
					</span>
				</div>
			</button>
		</div>
	);
});
