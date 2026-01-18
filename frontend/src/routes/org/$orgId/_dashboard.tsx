import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OrganizationDashboard } from "@/components/organization";

export const Route = createFileRoute("/org/$orgId/_dashboard")({
  component: function DashboardLayout() {
    return (
      <OrganizationDashboard>
        <Outlet />
      </OrganizationDashboard>
    );
  },
});
