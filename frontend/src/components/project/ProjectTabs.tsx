import { Link, useLocation } from "@tanstack/react-router";
import { Icons } from "@/components/ui";
import { useProjectCost } from "@/hooks/useCostCalculation";
import { formatPrice } from "@/lib/costCalculator";
import type { Project } from "@/types";

interface ProjectTabsProps {
  project: Project;
  orgId: string;
}

type TabKey = "runtimes" | "addons" | "estimation";

const tabConfig: Record<
  TabKey,
  { icon: typeof Icons.Server; label: string; color: string }
> = {
  runtimes: { icon: Icons.Server, label: "Runtimes", color: "primary" },
  addons: { icon: Icons.Puzzle, label: "Addons", color: "secondary" },
  estimation: { icon: Icons.TrendingUp, label: "Estimation", color: "accent" },
};

export function ProjectTabs({ project, orgId }: ProjectTabsProps) {
  const { pathname } = useLocation();
  const cost = useProjectCost(project.id);

  const activeTab: TabKey = pathname.endsWith("/addons")
    ? "addons"
    : pathname.endsWith("/estimation")
      ? "estimation"
      : "runtimes";

  const getTabCost = (tab: TabKey): string | null => {
    if (!cost) return null;
    switch (tab) {
      case "runtimes":
        return formatPrice(cost.runtimesCost);
      case "addons":
        return formatPrice(cost.addonsCost);
      case "estimation":
        return formatPrice(cost.totalMonthlyCost);
    }
  };

  return (
    <div className="border-b border-base-300">
      <div role="tablist" aria-label="Sections du projet" className="flex">
        {(["runtimes", "addons", "estimation"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const { icon: Icon, label, color } = tabConfig[tab];
          const count =
            tab === "runtimes"
              ? project.runtimes.length
              : tab === "addons"
                ? project.addons.length
                : null;
          const tabCost = getTabCost(tab);

          return (
            <Link
              key={tab}
              to={`/org/$orgId/project/$projectId/${tab}`}
              params={{ orgId, projectId: project.id }}
              role="tab"
              id={`tab-${tab}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab}`}
              className={`
                relative flex-1 flex items-center justify-center gap-2 px-4 py-3
                font-medium text-sm transition-all duration-200
                ${
                  isActive
                    ? "text-base-content bg-base-100"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-200/50"
                }
              `}
            >
              <Icon
                className={`w-4 h-4 transition-colors duration-200 ${isActive ? `text-${color}` : ""}`}
              />
              <span>{label}</span>
              {count !== null && (
                <span
                  className={`
                    px-1.5 py-0.5 text-xs rounded transition-colors duration-200
                    ${isActive ? `bg-${color}/10 text-${color}` : "bg-base-300 text-base-content/50"}
                  `}
                >
                  {count}
                </span>
              )}
              {tabCost && (
                <span
                  className={`
                    text-xs transition-colors duration-200
                    ${tab === "estimation" && isActive ? "font-medium text-primary" : "text-base-content/50"}
                  `}
                >
                  {tabCost}
                </span>
              )}

              {/* Indicateur actif */}
              <span
                className={`
                  absolute bottom-0 left-0 right-0 h-0.5
                  transition-all duration-200
                  ${isActive ? `bg-${color} opacity-100` : "opacity-0"}
                `}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
