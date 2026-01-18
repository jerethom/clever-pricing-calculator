import { memo, useCallback, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";
import type { Project, ProjectCostSummary } from "@/types";

// Palette de couleurs data-friendly pour le donut chart
// Couleurs distinctes, sans connotation sémantique, bonne accessibilité
const DONUT_COLORS = [
  "oklch(55% 0.15 280)", // violet
  "oklch(55% 0.15 250)", // bleu
  "oklch(58% 0.12 200)", // cyan
  "oklch(55% 0.12 170)", // teal
  "oklch(60% 0.14 145)", // vert-teal
  "oklch(72% 0.15 85)", // jaune-or
  "oklch(65% 0.17 45)", // orange
  "oklch(62% 0.16 350)", // rose
];

// Couleurs pour la barre Runtimes/Addons (réutilise la palette du donut)
const RUNTIME_COLOR = "oklch(49.02% 0.1046 281.52)";
const ADDON_COLOR = "oklch(60.54% 0.1752 230.9)";

interface ProjectCostData {
  project: Project;
  cost: number;
  percent: number;
  color: string;
  name: string;
  [key: string]: unknown;
}

interface DonutChartProps {
  data: ProjectCostData[];
  total: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

const MAX_VISIBLE_PROJECTS = 5;

const DonutChart = memo(function DonutChart({
  data,
  total,
  hoveredId,
  onHover,
}: DonutChartProps) {
  const hoveredData = hoveredId
    ? data.find((d) => d.project.id === hoveredId)
    : null;

  const handleMouseEnter = useCallback(
    (_: unknown, index: number) => {
      onHover(data[index].project.id);
    },
    [data, onHover],
  );

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      role="img"
      aria-label="Repartition des couts par projet"
    >
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={68}
            paddingAngle={1}
            dataKey="cost"
            nameKey="name"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
            onMouseLeave={handleMouseLeave}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.project.id}
                fill={entry.color}
                stroke="transparent"
                style={{
                  opacity:
                    hoveredId && hoveredId !== entry.project.id ? 0.5 : 1,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => handleMouseEnter(e, index)}
                tabIndex={0}
                onFocus={() => onHover(entry.project.id)}
                onBlur={() => onHover(null)}
                aria-label={`${entry.name}: ${formatPrice(entry.cost)} (${entry.percent.toFixed(1)}%)`}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {hoveredData ? (
          <>
            <p className="text-xs text-base-content/60 truncate max-w-[80px]">
              {hoveredData.name}
            </p>
            <p className="text-base font-bold text-base-content tabular-nums">
              {formatPrice(hoveredData.cost)}
            </p>
            <p className="text-xs text-base-content/50">
              {hoveredData.percent.toFixed(1)}%
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-base-content/60">Total</p>
            <p className="text-base font-bold text-base-content tabular-nums">
              {formatPrice(total)}
            </p>
          </>
        )}
      </div>
    </div>
  );
});

interface OrganizationCostBreakdownProps {
  totalRuntimesCost: number;
  totalAddonsCost: number;
  totalMonthlyCost: number;
  totalScalingCost: number;
  projects: Project[];
  projectCosts: Map<string, ProjectCostSummary>;
}

export const OrganizationCostBreakdown = memo(
  function OrganizationCostBreakdown({
    totalRuntimesCost,
    totalAddonsCost,
    totalMonthlyCost,
    totalScalingCost,
    projects,
    projectCosts,
  }: OrganizationCostBreakdownProps) {
    const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(
      null,
    );
    const [showAllProjects, setShowAllProjects] = useState(false);

    const runtimesPercent =
      totalMonthlyCost > 0 ? (totalRuntimesCost / totalMonthlyCost) * 100 : 0;
    const addonsPercent =
      totalMonthlyCost > 0 ? (totalAddonsCost / totalMonthlyCost) * 100 : 0;
    const scalingPercent =
      totalMonthlyCost > 0 ? (totalScalingCost / totalMonthlyCost) * 100 : 0;

    // Preparer les donnees pour le donut chart
    const projectCostData = useMemo((): ProjectCostData[] => {
      return projects
        .map((project, index) => {
          const cost = projectCosts.get(project.id)?.totalMonthlyCost ?? 0;
          return {
            project,
            cost,
            percent: totalMonthlyCost > 0 ? (cost / totalMonthlyCost) * 100 : 0,
            color: DONUT_COLORS[index % DONUT_COLORS.length],
            name: project.name,
          };
        })
        .filter((item) => item.cost > 0)
        .sort((a, b) => b.cost - a.cost);
    }, [projects, projectCosts, totalMonthlyCost]);

    const visibleProjects = showAllProjects
      ? projectCostData
      : projectCostData.slice(0, MAX_VISIBLE_PROJECTS);
    const hiddenCount = projectCostData.length - MAX_VISIBLE_PROJECTS;

    const showDonutChart = projectCostData.length > 1;

    if (totalMonthlyCost === 0) {
      return null;
    }

    return (
      <section
        className="card bg-base-100 border border-base-300"
        aria-label="Repartition des couts"
      >
        <div className="card-body p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Icons.Chart className="w-4 h-4 text-primary" />
              Repartition des couts
            </h3>
            <span className="text-sm text-base-content/60">
              {formatPrice(totalMonthlyCost)}/mois
            </span>
          </div>

          {/* Donut chart par projet */}
          {showDonutChart && (
            <div className="flex flex-col lg:flex-row items-start gap-4 mb-6">
              <DonutChart
                data={projectCostData}
                total={totalMonthlyCost}
                hoveredId={hoveredProjectId}
                onHover={setHoveredProjectId}
              />
              {/* Liste des projets compacte */}
              <div className="flex-1 w-full">
                <div className="flex flex-col gap-1">
                  {visibleProjects.map((item) => (
                    <button
                      key={item.project.id}
                      type="button"
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all
                        hover:bg-base-200 cursor-pointer
                        ${hoveredProjectId === item.project.id ? "bg-base-200" : ""}
                      `}
                      onMouseEnter={() => setHoveredProjectId(item.project.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-sm truncate min-w-0">
                        {item.project.name}
                      </span>
                      <span className="text-xs text-base-content/60 tabular-nums flex-shrink-0">
                        {item.percent.toFixed(0)}%
                      </span>
                      <span className="text-sm font-medium tabular-nums flex-shrink-0 w-20 text-right">
                        {formatPrice(item.cost)}
                      </span>
                    </button>
                  ))}
                </div>
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-primary hover:text-primary-focus transition-colors pl-2"
                    onClick={() => setShowAllProjects(!showAllProjects)}
                  >
                    {showAllProjects
                      ? "Voir moins"
                      : `Voir ${hiddenCount} autre${hiddenCount > 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Titre section Runtimes/Addons */}
          {showDonutChart && (
            <h4 className="text-sm font-medium text-base-content/60 mb-3">
              Par type de ressource
            </h4>
          )}

          {/* Barre horizontale stackée (HTML natif) */}
          <div
            className="w-full"
            role="img"
            aria-label={`Repartition: Runtimes ${runtimesPercent.toFixed(0)}%, Addons ${addonsPercent.toFixed(0)}%`}
          >
            {/* Barre de progression */}
            <div className="h-3 bg-base-200 rounded-full overflow-hidden flex">
              {runtimesPercent > 0 && (
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${runtimesPercent}%`,
                    backgroundColor: RUNTIME_COLOR,
                    borderRadius:
                      addonsPercent > 0 ? "9999px 0 0 9999px" : "9999px",
                  }}
                />
              )}
              {addonsPercent > 0 && (
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${addonsPercent}%`,
                    backgroundColor: ADDON_COLOR,
                    borderRadius:
                      runtimesPercent > 0 ? "0 9999px 9999px 0" : "9999px",
                  }}
                />
              )}
            </div>

            {/* Légende */}
            <div className="flex flex-wrap gap-4 sm:gap-6 mt-3 justify-start">
              {totalRuntimesCost > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: RUNTIME_COLOR }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">Runtimes</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: RUNTIME_COLOR }}
                  >
                    {formatPrice(totalRuntimesCost)}
                  </span>
                  <span className="text-xs text-base-content/50">
                    ({runtimesPercent.toFixed(0)}%)
                  </span>
                </div>
              )}
              {totalAddonsCost > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ADDON_COLOR }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">Addons</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: ADDON_COLOR }}
                  >
                    {formatPrice(totalAddonsCost)}
                  </span>
                  <span className="text-xs text-base-content/50">
                    ({addonsPercent.toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Indicateur de scaling */}
          {scalingPercent > 0 && (
            <div className="mt-4 pt-4 border-t border-base-200">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="tooltip tooltip-right"
                  data-tip="Le scaling dynamique correspond aux couts supplementaires generes par l'ajustement automatique des ressources selon la charge."
                >
                  <Icons.TrendingUp className="w-4 h-4 text-info cursor-help" />
                </div>
                <span className="text-base-content/70">
                  <span className="font-semibold text-info">
                    {scalingPercent.toFixed(0)}%
                  </span>{" "}
                  de vos couts viennent du scaling dynamique
                </span>
                <span className="text-base-content/50">
                  ({formatPrice(totalScalingCost)})
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  },
);
