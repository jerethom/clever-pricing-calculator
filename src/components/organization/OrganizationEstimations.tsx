import { memo, useMemo, useState } from "react";
import {
  DURATION_OPTIONS,
  formatDurationLabel,
} from "@/components/project/CostSummary/types";
import { Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";
import type { Project, ProjectCostSummary } from "@/types";

interface ProjectEstimationItemProps {
  project: Project;
  cost: ProjectCostSummary;
  selectedMonths: number;
  totalOrgCost: number;
}

const ProjectEstimationItem = memo(function ProjectEstimationItem({
  project,
  cost,
  selectedMonths,
  totalOrgCost,
}: ProjectEstimationItemProps) {
  // Calcul des estimations min/max pour ce projet
  const minMonthlyCost =
    cost.runtimesDetail.reduce((sum, r) => sum + r.minMonthlyCost, 0) +
    cost.addonsCost;

  const maxMonthlyCost =
    cost.runtimesDetail.reduce((sum, r) => sum + r.maxMonthlyCost, 0) +
    cost.addonsCost;

  const estimatedCost = cost.totalMonthlyCost;
  const hasCostRange = minMonthlyCost !== maxMonthlyCost;

  // Estimation selon la duree selectionnee
  const projectedCost = estimatedCost * selectedMonths;
  const projectedMin = minMonthlyCost * selectedMonths;
  const projectedMax = maxMonthlyCost * selectedMonths;

  // Pourcentage du cout total de l'organisation
  const percentage =
    totalOrgCost > 0 ? (estimatedCost / totalOrgCost) * 100 : 0;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Info projet */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icons.Folder className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold truncate text-sm">{project.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-base-content/60">
                <span>
                  {project.runtimes.length} runtime
                  {project.runtimes.length !== 1 ? "s" : ""}
                </span>
                <span>-</span>
                <span>
                  {project.addons.length} addon
                  {project.addons.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Estimation */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-primary tabular-nums">
              {formatPrice(projectedCost)}
            </p>
            {hasCostRange && (
              <p className="text-xs text-base-content/50 tabular-nums">
                {formatPrice(projectedMin)} - {formatPrice(projectedMax)}
              </p>
            )}
          </div>
        </div>

        {/* Barre de pourcentage */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-base-content/60 mb-1">
            <span>Part du budget</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-base-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Detail mensuel */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-base-200 text-xs">
          <span className="text-base-content/60">Cout mensuel estime</span>
          <span className="font-medium tabular-nums">
            {formatPrice(estimatedCost)}/mois
            {hasCostRange && (
              <span className="text-base-content/50 ml-1">
                ({formatPrice(minMonthlyCost)} - {formatPrice(maxMonthlyCost)})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
});

interface OrganizationEstimationsProps {
  projects: Project[];
  projectCosts: Map<string, ProjectCostSummary>;
  budgetTarget?: number;
}

export const OrganizationEstimations = memo(function OrganizationEstimations({
  projects,
  projectCosts,
  budgetTarget,
}: OrganizationEstimationsProps) {
  const [selectedMonths, setSelectedMonths] = useState(12);

  // Calcul des totaux globaux avec plages min/max
  const totals = useMemo(() => {
    let totalMonthlyCost = 0;
    let totalMinCost = 0;
    let totalMaxCost = 0;

    for (const project of projects) {
      const cost = projectCosts.get(project.id);
      if (cost) {
        totalMonthlyCost += cost.totalMonthlyCost;

        // Calcul min/max
        const minCost =
          cost.runtimesDetail.reduce((sum, r) => sum + r.minMonthlyCost, 0) +
          cost.addonsCost;

        const maxCost =
          cost.runtimesDetail.reduce((sum, r) => sum + r.maxMonthlyCost, 0) +
          cost.addonsCost;

        totalMinCost += minCost;
        totalMaxCost += maxCost;
      }
    }

    return {
      monthly: totalMonthlyCost,
      minMonthly: totalMinCost,
      maxMonthly: totalMaxCost,
      hasCostRange: totalMinCost !== totalMaxCost,
    };
  }, [projects, projectCosts]);

  // Projets avec leurs couts (filtres pour n'afficher que ceux avec des couts)
  const projectsWithCosts = useMemo(() => {
    return projects
      .map((project) => ({
        project,
        cost: projectCosts.get(project.id),
      }))
      .filter(
        (item): item is { project: Project; cost: ProjectCostSummary } =>
          item.cost !== undefined && item.cost.totalMonthlyCost > 0,
      )
      .sort((a, b) => b.cost.totalMonthlyCost - a.cost.totalMonthlyCost);
  }, [projects, projectCosts]);

  const projectedTotal = totals.monthly * selectedMonths;
  const projectedMin = totals.minMonthly * selectedMonths;
  const projectedMax = totals.maxMonthly * selectedMonths;

  return (
    <div className="space-y-6">
      {/* Carte principale d'estimation */}
      <div className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-300">
        <div className="card-body p-4 sm:p-6">
          {/* Header avec selecteur de duree */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Icons.TrendingUp className="w-5 h-5 text-primary" />
              Estimations
            </h3>
            <div className="flex flex-wrap gap-1">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.months}
                  type="button"
                  onClick={() => setSelectedMonths(option.months)}
                  className={`
                    px-3 py-1.5 text-xs font-medium transition-all rounded
                    ${
                      selectedMonths === option.months
                        ? "bg-primary text-primary-content"
                        : "bg-base-200 text-base-content/70 hover:bg-base-300"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grille mensuel / projection */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Cout mensuel */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base-content/60 text-sm">
                <Icons.Clock className="w-4 h-4" />
                <span>Mensuel</span>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {formatPrice(totals.monthly)}
              </p>
              {totals.hasCostRange && (
                <p className="text-sm text-base-content/50 tabular-nums">
                  Plage: {formatPrice(totals.minMonthly)} -{" "}
                  {formatPrice(totals.maxMonthly)}
                </p>
              )}
              {budgetTarget &&
                totals.hasCostRange &&
                totals.maxMonthly > budgetTarget &&
                totals.monthly <= budgetTarget && (
                  <div className="flex items-center gap-1.5 text-warning text-xs mt-1">
                    <Icons.Info className="w-3.5 h-3.5" />
                    <span>
                      Max peut depasser le budget ({formatPrice(budgetTarget)})
                    </span>
                  </div>
                )}
            </div>

            {/* Fleche et estimation */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base-content/60 text-sm">
                <Icons.Calendar className="w-4 h-4" />
                <span>{formatDurationLabel(selectedMonths)}</span>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {formatPrice(projectedTotal)}
              </p>
              {totals.hasCostRange && (
                <p className="text-sm text-base-content/50 tabular-nums">
                  Plage: {formatPrice(projectedMin)} -{" "}
                  {formatPrice(projectedMax)}
                </p>
              )}
              {budgetTarget &&
                totals.hasCostRange &&
                projectedMax > budgetTarget * selectedMonths &&
                projectedTotal <= budgetTarget * selectedMonths && (
                  <div className="flex items-center gap-1.5 text-warning text-xs mt-1">
                    <Icons.Info className="w-3.5 h-3.5" />
                    <span>
                      Max peut depasser{" "}
                      {formatPrice(budgetTarget * selectedMonths)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des projets avec estimations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Icons.Folder className="w-4 h-4 text-primary" />
            Estimations par projet
            <span className="badge badge-primary badge-sm">
              {projectsWithCosts.length}
            </span>
          </h3>
          <span className="text-sm text-base-content/60">
            sur {formatDurationLabel(selectedMonths)}
          </span>
        </div>

        {projectsWithCosts.length > 0 ? (
          <div className="grid gap-3">
            {projectsWithCosts.map(({ project, cost }) => (
              <ProjectEstimationItem
                key={project.id}
                project={project}
                cost={cost}
                selectedMonths={selectedMonths}
                totalOrgCost={totals.monthly}
              />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-300 border-dashed">
            <div className="card-body items-center text-center py-12">
              <div className="bg-base-200 rounded-full p-4 mb-4">
                <Icons.Chart className="w-8 h-8 text-base-content/30" />
              </div>
              <h4 className="font-semibold">Aucune estimation</h4>
              <p className="text-sm text-base-content/60 max-w-xs">
                Ajoutez des runtimes ou addons a vos projets pour voir les
                estimations de couts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
