import { createFileRoute } from "@tanstack/react-router";
import { useShallow } from "zustand/shallow";
import { OrganizationEstimations } from "@/components/organization/OrganizationEstimations";
import { useActiveOrganizationCosts } from "@/hooks/useCostCalculation";
import {
  selectActiveOrganization,
  selectActiveOrganizationProjects,
  useSelector,
} from "@/store";
import { useProjectStore } from "@/store/projectStore";

export const Route = createFileRoute("/org/$orgId/_dashboard/estimations")({
  component: function OrganizationEstimationsTab() {
    const organization = useSelector(selectActiveOrganization);
    const projects = useProjectStore(
      useShallow(selectActiveOrganizationProjects),
    );
    const projectCosts = useActiveOrganizationCosts();

    if (!organization) {
      return null;
    }

    return (
      <div
        role="tabpanel"
        id="tabpanel-org-estimations"
        aria-labelledby="tab-org-estimations"
      >
        <OrganizationEstimations
          projects={projects}
          projectCosts={projectCosts}
          budgetTarget={organization.budgetTarget}
        />
      </div>
    );
  },
});
