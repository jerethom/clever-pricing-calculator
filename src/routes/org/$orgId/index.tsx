import { createFileRoute } from "@tanstack/react-router";
import { OrganizationDashboard } from "@/components/organization";

export const Route = createFileRoute("/org/$orgId/")({
	component: OrganizationDashboard,
});
