import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { memo, type ReactNode, useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { Icons } from "@/components/ui";
import { useActiveOrganizationCostsWithDescendants } from "@/hooks/useCostCalculation";
import {
  selectActiveOrganization,
  selectActiveOrganizationProjects,
  selectOrganizations,
  useProjectActions,
  useSelector,
} from "@/store";
import { useProjectStore } from "@/store/projectStore";
import { OrganizationHeader } from "./OrganizationHeader";

type TabType = "overview" | "estimations";

interface OrganizationDashboardProps {
  children?: ReactNode;
}

export const OrganizationDashboard = memo(function OrganizationDashboard({
  children,
}: OrganizationDashboardProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const organization = useSelector(selectActiveOrganization);
  const organizations = useSelector(selectOrganizations);
  const projects = useProjectStore(
    useShallow(selectActiveOrganizationProjects),
  );
  const projectCosts = useActiveOrganizationCostsWithDescendants();
  const { updateOrganization, deleteOrganization } = useProjectActions();

  const activeTab: TabType = pathname.endsWith("/estimations")
    ? "estimations"
    : "overview";

  const handleUpdateName = useCallback(
    (name: string) => {
      if (organization) {
        updateOrganization(organization.id, { name });
      }
    },
    [organization, updateOrganization],
  );

  const handleDelete = useCallback(() => {
    if (organization) {
      // Trouver une autre organisation vers laquelle naviguer
      const otherOrg = organizations.find((o) => o.id !== organization.id);
      deleteOrganization(organization.id);
      if (otherOrg) {
        navigate({ to: "/org/$orgId", params: { orgId: otherOrg.id } });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [organization, organizations, deleteOrganization, navigate]);

  if (!organization) {
    return null;
  }

  const tabs = [
    { key: "overview" as const, icon: Icons.Chart, label: "Vue d'ensemble" },
    {
      key: "estimations" as const,
      icon: Icons.TrendingUp,
      label: "Estimations",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <OrganizationHeader
        organization={organization}
        projects={projects}
        projectCosts={projectCosts}
        onUpdateName={handleUpdateName}
        onDelete={handleDelete}
      />

      <div
        role="tablist"
        aria-label="Sections de l'organisation"
        className="flex bg-base-200 p-1 gap-1"
      >
        {tabs.map(({ key, icon: Icon, label }) => {
          const isActive = activeTab === key;
          return (
            <Link
              key={key}
              to={`/org/$orgId/${key}`}
              params={{ orgId: organization.id }}
              role="tab"
              id={`tab-org-${key}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-org-${key}`}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                font-medium text-sm transition-all duration-200
                ${
                  isActive
                    ? "bg-base-100 shadow-sm text-base-content"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-100/50"
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-2">{children}</div>
    </div>
  );
});
