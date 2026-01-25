import { lazy, memo, Suspense } from "react";
import { useRuntimeCardContext } from "./RuntimeCardContext";
import type { RuntimeCardScheduleProps } from "./types";

const TimeSlotEditor = lazy(
  () => import("@/components/timeSlot/TimeSlotEditor"),
);

export const RuntimeCardSchedule = memo(function RuntimeCardSchedule({
  className = "",
}: RuntimeCardScheduleProps) {
  const { projectId, runtime } = useRuntimeCardContext();

  if (!runtime.scalingEnabled) return null;

  return (
    <div className={className}>
      <Suspense fallback={null}>
        <TimeSlotEditor
          projectId={projectId}
          runtimeId={runtime.id}
          runtime={runtime}
        />
      </Suspense>
    </div>
  );
});
