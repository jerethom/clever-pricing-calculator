import { memo, useMemo } from "react";
import { Portal } from "@/components/ui";
import type { DayOfWeek } from "@/types";
import { DAY_LABELS, DAYS_OF_WEEK } from "@/types";

// Precalculer les index des jours pour eviter les indexOf repetitifs
const DAY_INDEX_MAP: Record<DayOfWeek, number> = {
	mon: 0,
	tue: 1,
	wed: 2,
	thu: 3,
	fri: 4,
	sat: 5,
	sun: 6,
};

interface SelectionIndicatorProps {
	start: { day: DayOfWeek; hour: number } | null;
	end: { day: DayOfWeek; hour: number } | null;
	paintValue: number;
	isVisible: boolean;
}

export const SelectionIndicator = memo(function SelectionIndicator({
	start,
	end,
	paintValue,
	isVisible,
}: SelectionIndicatorProps) {
	// Memoiser les calculs derives
	const displayInfo = useMemo(() => {
		if (!start || !end) return null;

		const startHour = Math.min(start.hour, end.hour);
		const endHour = Math.max(start.hour, end.hour);
		const hoursCount = endHour - startHour + 1;

		const startDayIndex = DAY_INDEX_MAP[start.day];
		const endDayIndex = DAY_INDEX_MAP[end.day];
		const minDayIndex = Math.min(startDayIndex, endDayIndex);
		const maxDayIndex = Math.max(startDayIndex, endDayIndex);
		const daysCount = maxDayIndex - minDayIndex + 1;
		const totalCells = hoursCount * daysCount;

		const startDayLabel = DAY_LABELS[DAYS_OF_WEEK[minDayIndex]];
		const endDayLabel = DAY_LABELS[DAYS_OF_WEEK[maxDayIndex]];
		const isSameDay = minDayIndex === maxDayIndex;

		return {
			startHour,
			endHour,
			startDayLabel,
			endDayLabel,
			isSameDay,
			totalCells,
		};
	}, [start, end]);

	if (!isVisible || !displayInfo) return null;

	const {
		startHour,
		endHour,
		startDayLabel,
		endDayLabel,
		isSameDay,
		totalCells,
	} = displayInfo;

	return (
		<Portal>
			<div
				className="
          fixed bottom-4 left-1/2 -translate-x-1/2 z-50
          bg-accent text-accent-content
          px-4 py-2 shadow-lg
          flex items-center gap-3
          animate-in
        "
				role="status"
				aria-live="polite"
			>
				<div className="text-sm">
					<span className="font-semibold">
						{isSameDay
							? `${startDayLabel} ${startHour}h-${endHour + 1}h`
							: `${startDayLabel}-${endDayLabel} ${startHour}h-${endHour + 1}h`}
					</span>
				</div>
				<div className="w-px h-4 bg-accent-content/30" />
				<div className="text-sm">
					<span className="opacity-70">Valeur : </span>
					<span className="font-bold">+{paintValue}</span>
				</div>
				<div className="w-px h-4 bg-accent-content/30" />
				<div className="text-sm opacity-70">
					{totalCells} créneau{totalCells > 1 ? "x" : ""}
				</div>
			</div>
		</Portal>
	);
});
