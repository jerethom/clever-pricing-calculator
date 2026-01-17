import { createFileRoute } from "@tanstack/react-router";
import { OrganizationOverview } from "@/components/organization/OrganizationOverview";

export const Route = createFileRoute("/org/$orgId/_dashboard/overview")({
  component: () => (
    <div
      role="tabpanel"
      id="tabpanel-org-overview"
      aria-labelledby="tab-org-overview"
    >
      <OrganizationOverview />
    </div>
  ),
});
