import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { CostSummarySkeleton } from "@/components/ui";
import { useProjectCost } from "@/hooks/useCostCalculation";

const CostSummary = lazy(() => import("@/components/project/CostSummary"));

export const Route = createFileRoute(
	"/org/$orgId/project/$projectId/projection",
)({
	component: function ProjectionTab() {
		const { projectId } = Route.useParams();
		const cost = useProjectCost(projectId);
		return (
			<div
				role="tabpanel"
				id="tabpanel-projection"
				aria-labelledby="tab-projection"
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
