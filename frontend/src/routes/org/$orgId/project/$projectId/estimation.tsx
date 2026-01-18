import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { CostSummarySkeleton } from "@/components/ui";
import { useProjectCost } from "@/hooks/useCostCalculation";

const CostSummary = lazy(() => import("@/components/project/CostSummary"));

export const Route = createFileRoute(
  "/org/$orgId/project/$projectId/estimation",
)({
  component: function EstimationTab() {
    const { projectId } = Route.useParams();
    const cost = useProjectCost(projectId);
    return (
      <div
        role="tabpanel"
        id="tabpanel-estimation"
        aria-labelledby="tab-estimation"
      >
        {cost && (
          <Suspense fallback={<CostSummarySkeleton />}>
            <CostSummary cost={cost} />
          </Suspense>
        )}
      </div>
    );
  },
});
