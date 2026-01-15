import type { ProjectCostSummary } from '@/types'
import { formatPrice, formatMonthlyPrice, formatHourlyPrice } from '@/lib/costCalculator'

interface CostSummaryProps {
  cost: ProjectCostSummary
}

export function CostSummary({ cost }: CostSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Résumé global */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Runtimes</div>
          <div className="stat-value text-lg">{formatPrice(cost.runtimesCost)}</div>
          <div className="stat-desc">{cost.runtimesDetail.length} runtime(s)</div>
        </div>
        <div className="stat">
          <div className="stat-title">Addons</div>
          <div className="stat-value text-lg">{formatPrice(cost.addonsCost)}</div>
          <div className="stat-desc">{cost.addonsDetail.length} addon(s)</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total mensuel</div>
          <div className="stat-value text-primary">{formatPrice(cost.totalMonthlyCost)}</div>
          <div className="stat-desc">Estimation</div>
        </div>
      </div>

      {/* Détail des runtimes */}
      {cost.runtimesDetail.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Détail des runtimes</h2>

            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>Runtime</th>
                    <th>Flavor</th>
                    <th>Prix/h</th>
                    <th>Inst-heures</th>
                    <th>Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.runtimesDetail.map(runtime => (
                    <>
                      {/* Ligne base */}
                      <tr key={`${runtime.runtimeId}-base`}>
                        <td className="font-medium" rowSpan={runtime.scalingHours > 0 ? 2 : 1}>
                          {runtime.runtimeName}
                        </td>
                        <td>
                          <span className="badge badge-outline badge-sm">{runtime.baseFlavorName}</span>
                          <span className="text-xs text-base-content/60 ml-1">base</span>
                        </td>
                        <td>{formatHourlyPrice(runtime.baseHourlyPrice)}</td>
                        <td>{runtime.baseInstanceHours}h/sem</td>
                        <td>{formatPrice(runtime.baseMonthlyCost)}</td>
                      </tr>
                      {/* Ligne scaling */}
                      {runtime.scalingHours > 0 && (
                        <tr key={`${runtime.runtimeId}-scaling`}>
                          <td>
                            <span className="badge badge-outline badge-sm">{runtime.scalingFlavorName}</span>
                            <span className="text-xs text-base-content/60 ml-1">scaling</span>
                          </td>
                          <td>{formatHourlyPrice(runtime.scalingHourlyPrice)}</td>
                          <td>{runtime.scalingInstanceHours}h/sem</td>
                          <td>{formatPrice(runtime.scalingMonthlyCost)}</td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right font-bold">
                      Total Runtimes
                    </td>
                    <td className="font-bold text-primary">
                      {formatMonthlyPrice(cost.runtimesCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Détail des addons */}
      {cost.addonsDetail.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Détail des addons</h2>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Addon</th>
                    <th>Plan</th>
                    <th>Prix mensuel</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.addonsDetail.map(addon => (
                    <tr key={addon.addonId}>
                      <td className="font-medium">{addon.providerName}</td>
                      <td>
                        <span className="badge badge-outline">{addon.planName}</span>
                      </td>
                      <td className="font-medium">{formatMonthlyPrice(addon.monthlyPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="text-right font-bold">
                      Total Addons
                    </td>
                    <td className="font-bold text-primary">
                      {formatMonthlyPrice(cost.addonsCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
