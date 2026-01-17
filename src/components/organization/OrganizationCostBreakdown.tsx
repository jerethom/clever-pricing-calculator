import { memo, useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";
import type { Project, ProjectCostSummary } from "@/types";

// Couleurs pour le donut chart (utilisant les couleurs DaisyUI)
const DONUT_COLORS = [
  "hsl(var(--p))", // primary
  "hsl(var(--s))", // secondary
  "hsl(var(--a))", // accent
  "hsl(var(--in))", // info
  "hsl(var(--su))", // success
  "hsl(var(--wa))", // warning
  "hsl(var(--er))", // error
  "hsl(var(--n))", // neutral
];

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

// Interface pour les donnees du BarChart
interface ResourceBarData {
  name: string;
  runtimes: number;
  addons: number;
}

// Custom legend pour le BarChart
interface LegendPayload {
  value: string;
  color: string;
  dataKey: string;
}

interface CustomLegendProps {
  payload?: LegendPayload[];
  runtimesPercent: number;
  addonsPercent: number;
  totalRuntimesCost: number;
  totalAddonsCost: number;
}

const CustomBarLegend = ({
  payload,
  runtimesPercent,
  addonsPercent,
  totalRuntimesCost,
  totalAddonsCost,
}: CustomLegendProps) => {
  if (!payload) return null;

  const dataMap: Record<
    string,
    { percent: number; cost: number; label: string }
  > = {
    runtimes: {
      percent: runtimesPercent,
      cost: totalRuntimesCost,
      label: "Runtimes",
    },
    addons: { percent: addonsPercent, cost: totalAddonsCost, label: "Addons" },
  };

  return (
    <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 justify-center">
      {payload.map((entry) => {
        const data = dataMap[entry.dataKey];
        if (!data || data.cost === 0) return null;
        return (
          <div key={entry.dataKey} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium">{data.label}</span>
            </div>
            <div className="text-right">
              <span
                className="text-sm font-bold"
                style={{ color: entry.color }}
              >
                {formatPrice(data.cost)}
              </span>
              <span className="text-xs text-base-content/50 ml-1">
                ({data.percent.toFixed(0)}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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

    // Donnees pour le BarChart horizontal
    const resourceBarData = useMemo((): ResourceBarData[] => {
      return [
        {
          name: "Ressources",
          runtimes: totalRuntimesCost,
          addons: totalAddonsCost,
        },
      ];
    }, [totalRuntimesCost, totalAddonsCost]);

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

          {/* BarChart horizontal stacke */}
          <div
            className="w-full"
            role="img"
            aria-label={`Repartition: Runtimes ${runtimesPercent.toFixed(0)}%, Addons ${addonsPercent.toFixed(0)}%`}
          >
            <ResponsiveContainer width="100%" height={60}>
              <BarChart
                data={resourceBarData}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide domain={[0, totalMonthlyCost]} />
                <YAxis type="category" dataKey="name" hide />
                <Legend
                  content={
                    <CustomBarLegend
                      runtimesPercent={runtimesPercent}
                      addonsPercent={addonsPercent}
                      totalRuntimesCost={totalRuntimesCost}
                      totalAddonsCost={totalAddonsCost}
                    />
                  }
                />
                {totalRuntimesCost > 0 && (
                  <Bar
                    dataKey="runtimes"
                    stackId="a"
                    fill="hsl(var(--p))"
                    name="Runtimes"
                    radius={totalAddonsCost > 0 ? [8, 0, 0, 8] : [8, 8, 8, 8]}
                    animationBegin={0}
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                )}
                {totalAddonsCost > 0 && (
                  <Bar
                    dataKey="addons"
                    stackId="a"
                    fill="hsl(var(--s))"
                    name="Addons"
                    radius={totalRuntimesCost > 0 ? [0, 8, 8, 0] : [8, 8, 8, 8]}
                    animationBegin={0}
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
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
