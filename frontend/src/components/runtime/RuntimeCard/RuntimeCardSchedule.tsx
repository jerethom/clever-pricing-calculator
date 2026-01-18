import { lazy, memo, Suspense, useCallback } from "react";
import { Icons } from "@/components/ui";
import { DAY_LETTERS } from "@/constants";
import { DAYS_OF_WEEK } from "@/types";
import { useRuntimeCardContext } from "./RuntimeCardContext";
import type { RuntimeCardScheduleProps } from "./types";

const TimeSlotEditor = lazy(
  () => import("@/components/timeSlot/TimeSlotEditor"),
);

export const RuntimeCardSchedule = memo(function RuntimeCardSchedule({
  className = "",
}: RuntimeCardScheduleProps) {
  const { projectId, runtime, cost, showTimeSlots, onToggleTimeSlots } =
    useRuntimeCardContext();

  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      const isOpen = e.currentTarget.open;
      if (isOpen !== showTimeSlots) {
        onToggleTimeSlots();
      }
    },
    [showTimeSlots, onToggleTimeSlots],
  );

  if (!runtime.scalingEnabled) return null;

  const summaryClass = showTimeSlots
    ? "bg-primary text-primary-content"
    : "bg-base-100 border border-base-300 hover:border-primary/30";

  return (
    <details
      className={`group ${className}`}
      open={showTimeSlots}
      onToggle={handleToggle}
    >
      <summary
        className={`w-full flex justify-between items-center h-auto py-3 px-4 cursor-pointer list-none ${summaryClass}`}
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

          <svg
            className="w-4 h-4 transition-transform group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </summary>

      <div className="p-4 bg-base-100 border border-base-300 border-t-0 animate-in fade-in slide-in-from-top-2 duration-200">
        <Suspense fallback={null}>
          <TimeSlotEditor
            projectId={projectId}
            runtimeId={runtime.id}
            runtime={runtime}
          />
        </Suspense>
      </div>
    </details>
  );
});
