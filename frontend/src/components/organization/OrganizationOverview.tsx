import { memo, useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useActiveOrganizationCosts } from "@/hooks/useCostCalculation";
import {
  selectActiveOrganization,
  selectActiveOrganizationProjects,
  useProjectActions,
  useSelector,
} from "@/store";
import { useProjectStore } from "@/store/projectStore";
import { OrganizationBudgetGauge } from "./OrganizationBudgetGauge";
import { OrganizationCostBreakdown } from "./OrganizationCostBreakdown";
import { OrganizationProjectList } from "./OrganizationProjectList";
import { OrganizationStats } from "./OrganizationStats";

export const OrganizationOverview = memo(function OrganizationOverview() {
  const organization = useSelector(selectActiveOrganization);
  const projects = useProjectStore(
    useShallow(selectActiveOrganizationProjects),
  );
  const projectCosts = useActiveOrganizationCosts();
  const { updateOrganization, createProject } = useProjectActions();

  // Calculer les statistiques (une seule iteration)
  const stats = useMemo(() => {
    let totalRuntimes = 0;
    let totalAddons = 0;
    let totalMonthlyCost = 0;
    let totalRuntimesCost = 0;
    let totalAddonsCost = 0;
    let totalMinCost = 0;
    let totalMaxCost = 0;
    let totalScalingCost = 0;

    for (const project of projects) {
      totalRuntimes += project.runtimes.length;
      totalAddons += project.addons.length;
      const cost = projectCosts.get(project.id);
      if (cost) {
        totalMonthlyCost += cost.totalMonthlyCost;
        totalRuntimesCost += cost.runtimesCost;
        totalAddonsCost += cost.addonsCost;
        // Calcul des plages min/max
        totalMinCost +=
          cost.runtimesDetail.reduce((s, r) => s + r.minMonthlyCost, 0) +
          cost.addonsCost;
        totalMaxCost +=
          cost.runtimesDetail.reduce((s, r) => s + r.maxMonthlyCost, 0) +
          cost.addonsCost;
        totalScalingCost += cost.runtimesDetail.reduce(
          (s, r) => s + r.estimatedScalingCost,
          0,
        );
      }
    }

    return {
      projectsCount: projects.length,
      runtimesCount: totalRuntimes,
      addonsCount: totalAddons,
      totalMonthlyCost,
      totalRuntimesCost,
      totalAddonsCost,
      totalMinCost,
      totalMaxCost,
      totalScalingCost,
    };
  }, [projects, projectCosts]);

  const handleUpdateBudget = useCallback(
    (budget: number | undefined) => {
      if (organization) {
        updateOrganization(organization.id, { budgetTarget: budget });
      }
    },
    [organization, updateOrganization],
  );

  const handleCreateProject = useCallback(() => {
    if (organization) {
      const name = `Projet ${projects.length + 1}`;
      createProject(organization.id, name);
    }
  }, [organization, projects.length, createProject]);

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      <OrganizationBudgetGauge
        currentCost={stats.totalMonthlyCost}
        minCost={stats.totalMinCost}
        maxCost={stats.totalMaxCost}
        budgetTarget={organization.budgetTarget}
        onUpdateBudget={handleUpdateBudget}
      />
      <OrganizationStats
        projectsCount={stats.projectsCount}
        runtimesCount={stats.runtimesCount}
        addonsCount={stats.addonsCount}
        totalMonthlyCost={stats.totalMonthlyCost}
        minMonthlyCost={stats.totalMinCost}
        maxMonthlyCost={stats.totalMaxCost}
      />
      <OrganizationCostBreakdown
        totalRuntimesCost={stats.totalRuntimesCost}
        totalAddonsCost={stats.totalAddonsCost}
        totalMonthlyCost={stats.totalMonthlyCost}
        totalScalingCost={stats.totalScalingCost}
        projects={projects}
        projectCosts={projectCosts}
      />
      <OrganizationProjectList
        projects={projects}
        projectCosts={projectCosts}
        orgId={organization.id}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
});
