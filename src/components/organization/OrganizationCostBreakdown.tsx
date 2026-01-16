import { memo, useState, useMemo } from 'react'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'
import type { Project, ProjectCostSummary } from '@/types'

// Couleurs pour le donut chart (utilisant les couleurs DaisyUI)
const DONUT_COLORS = [
  'hsl(var(--p))',      // primary
  'hsl(var(--s))',      // secondary
  'hsl(var(--a))',      // accent
  'hsl(var(--in))',     // info
  'hsl(var(--su))',     // success
  'hsl(var(--wa))',     // warning
  'hsl(var(--er))',     // error
  'hsl(var(--n))',      // neutral
]

interface ProjectCostData {
  project: Project
  cost: number
  percent: number
  color: string
}

interface DonutChartProps {
  data: ProjectCostData[]
  total: number
  hoveredId: string | null
  onHover: (id: string | null) => void
}

const DonutChart = memo(function DonutChart({
  data,
  total,
  hoveredId,
  onHover,
}: DonutChartProps) {
  // Calculer les segments du donut
  const segments = useMemo(() => {
    const result: Array<{
      id: string
      color: string
      dasharray: string
      dashoffset: number
      name: string
      cost: number
      percent: number
    }> = []

    const circumference = 2 * Math.PI * 40 // rayon = 40
    let offset = 0

    for (const item of data) {
      const segmentLength = (item.percent / 100) * circumference
      result.push({
        id: item.project.id,
        color: item.color,
        dasharray: `${segmentLength} ${circumference - segmentLength}`,
        dashoffset: -offset,
        name: item.project.name,
        cost: item.cost,
        percent: item.percent,
      })
      offset += segmentLength
    }

    return result
  }, [data])

  const hoveredSegment = hoveredId ? segments.find(s => s.id === hoveredId) : null

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-40 h-40 sm:w-48 sm:h-48 -rotate-90"
        aria-label="Repartition des couts par projet"
      >
        {/* Cercle de fond */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          stroke="hsl(var(--b2))"
          strokeWidth="15"
        />
        {/* Segments */}
        {segments.map(segment => (
          <circle
            key={segment.id}
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={segment.color}
            strokeWidth={hoveredId === segment.id ? 18 : 15}
            strokeDasharray={segment.dasharray}
            strokeDashoffset={segment.dashoffset}
            className="transition-all duration-200 cursor-pointer"
            onMouseEnter={() => onHover(segment.id)}
            onMouseLeave={() => onHover(null)}
            style={{ opacity: hoveredId && hoveredId !== segment.id ? 0.5 : 1 }}
          />
        ))}
      </svg>
      {/* Centre avec texte */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {hoveredSegment ? (
          <>
            <p className="text-xs text-base-content/60 truncate max-w-[100px]">
              {hoveredSegment.name}
            </p>
            <p className="text-lg font-bold text-base-content tabular-nums">
              {formatPrice(hoveredSegment.cost)}
            </p>
            <p className="text-xs text-base-content/50">
              {hoveredSegment.percent.toFixed(1)}%
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-base-content/60">Total</p>
            <p className="text-lg font-bold text-base-content tabular-nums">
              {formatPrice(total)}
            </p>
          </>
        )}
      </div>
    </div>
  )
})

interface OrganizationCostBreakdownProps {
  totalRuntimesCost: number
  totalAddonsCost: number
  totalMonthlyCost: number
  totalBaseCost: number
  totalScalingCost: number
  projects: Project[]
  projectCosts: Map<string, ProjectCostSummary>
}

export const OrganizationCostBreakdown = memo(function OrganizationCostBreakdown(
  props: OrganizationCostBreakdownProps
) {
  const {
    totalRuntimesCost,
    totalAddonsCost,
    totalMonthlyCost,
    // totalBaseCost reserve pour usage futur
    totalScalingCost,
    projects,
    projectCosts,
  } = props
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)

  const runtimesPercent = totalMonthlyCost > 0 ? (totalRuntimesCost / totalMonthlyCost) * 100 : 0
  const addonsPercent = totalMonthlyCost > 0 ? (totalAddonsCost / totalMonthlyCost) * 100 : 0
  const scalingPercent = totalMonthlyCost > 0 ? (totalScalingCost / totalMonthlyCost) * 100 : 0

  // Preparer les donnees pour le donut chart
  const projectCostData = useMemo((): ProjectCostData[] => {
    return projects
      .map((project, index) => {
        const cost = projectCosts.get(project.id)?.totalMonthlyCost ?? 0
        return {
          project,
          cost,
          percent: totalMonthlyCost > 0 ? (cost / totalMonthlyCost) * 100 : 0,
          color: DONUT_COLORS[index % DONUT_COLORS.length],
        }
      })
      .filter(item => item.cost > 0)
      .sort((a, b) => b.cost - a.cost)
  }, [projects, projectCosts, totalMonthlyCost])

  const showDonutChart = projectCostData.length > 1

  if (totalMonthlyCost === 0) {
    return null
  }

  return (
    <div
      className="card bg-base-100 border border-base-300"
      role="region"
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
          <div className="flex flex-col lg:flex-row items-center gap-6 mb-6">
            <DonutChart
              data={projectCostData}
              total={totalMonthlyCost}
              hoveredId={hoveredProjectId}
              onHover={setHoveredProjectId}
            />
            {/* Legende des projets */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {projectCostData.map(item => (
                <button
                  key={item.project.id}
                  type="button"
                  className={`
                    flex items-center gap-2 p-2 rounded-lg text-left transition-all
                    hover:bg-base-200 cursor-pointer
                    ${hoveredProjectId === item.project.id ? 'bg-base-200 ring-1 ring-base-300' : ''}
                  `}
                  onMouseEnter={() => setHoveredProjectId(item.project.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.project.name}</p>
                    <p className="text-xs text-base-content/60">
                      {formatPrice(item.cost)} ({item.percent.toFixed(1)}%)
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Titre section Runtimes/Addons */}
        {showDonutChart && (
          <h4 className="text-sm font-medium text-base-content/60 mb-3">
            Par type de ressource
          </h4>
        )}

        {/* Barre de progression */}
        <div className="h-4 bg-base-200 rounded-full overflow-hidden flex">
          {runtimesPercent > 0 && (
            <div
              className="bg-primary h-full transition-all duration-700 ease-out"
              style={{ width: `${runtimesPercent}%` }}
              role="progressbar"
              aria-valuenow={runtimesPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Runtimes: ${runtimesPercent.toFixed(0)}%`}
            />
          )}
          {addonsPercent > 0 && (
            <div
              className="bg-secondary h-full transition-all duration-700 ease-out"
              style={{ width: `${addonsPercent}%` }}
              role="progressbar"
              aria-valuenow={addonsPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Addons: ${addonsPercent.toFixed(0)}%`}
            />
          )}
        </div>

        {/* Legende */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Runtimes</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-primary">{formatPrice(totalRuntimesCost)}</span>
              <span className="text-xs text-base-content/50 ml-1">({runtimesPercent.toFixed(0)}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" aria-hidden="true" />
              <span className="text-sm font-medium">Addons</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-secondary">{formatPrice(totalAddonsCost)}</span>
              <span className="text-xs text-base-content/50 ml-1">({addonsPercent.toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* Indicateur de scaling */}
        {scalingPercent > 0 && (
          <div className="mt-4 pt-4 border-t border-base-200">
            <div className="flex items-center gap-2 text-sm">
              <div className="tooltip tooltip-right" data-tip="Le scaling dynamique correspond aux couts supplementaires generes par l'ajustement automatique des ressources selon la charge.">
                <Icons.TrendingUp className="w-4 h-4 text-info cursor-help" />
              </div>
              <span className="text-base-content/70">
                <span className="font-semibold text-info">{scalingPercent.toFixed(0)}%</span> de vos couts viennent du scaling dynamique
              </span>
              <span className="text-base-content/50">
                ({formatPrice(totalScalingCost)})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
