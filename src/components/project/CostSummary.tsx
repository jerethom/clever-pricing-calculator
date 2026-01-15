import type { ProjectCostSummary, RuntimeCostDetail, AddonCostDetail } from '@/types'
import { formatPrice, formatMonthlyPrice, formatHourlyPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'

interface CostSummaryProps {
  cost: ProjectCostSummary
}

function CostBreakdownBar({ runtimesCost, addonsCost, total }: { runtimesCost: number; addonsCost: number; total: number }) {
  const runtimesPercent = total > 0 ? (runtimesCost / total) * 100 : 0
  const addonsPercent = total > 0 ? (addonsCost / total) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Repartition des couts</span>
        <span className="text-base-content/60">{formatPrice(total)}/mois</span>
      </div>
      <div className="h-4 bg-base-200 rounded-full overflow-hidden flex">
        {runtimesPercent > 0 && (
          <div
            className="bg-primary h-full transition-all duration-700 ease-out"
            style={{ width: `${runtimesPercent}%` }}
          />
        )}
        {addonsPercent > 0 && (
          <div
            className="bg-secondary h-full transition-all duration-700 ease-out"
            style={{ width: `${addonsPercent}%` }}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Runtimes ({runtimesPercent.toFixed(0)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span>Addons ({addonsPercent.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  )
}

function RuntimeCard({ runtime }: { runtime: RuntimeCostDetail }) {
  const hasScaling = runtime.scalingHours > 0
  const hasCostRange = runtime.minMonthlyCost !== runtime.maxMonthlyCost

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-colors duration-200">
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icons.Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{runtime.runtimeName}</h3>
              <p className="text-xs text-base-content/60">{runtime.instanceType}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-primary text-lg">
              {formatPrice(runtime.totalMonthlyCost)}
            </div>
            <div className="text-xs text-base-content/60">/mois</div>
          </div>
        </div>

        <div className="divider my-2" />

        {/* Configuration de base */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm">{runtime.baseFlavorName}</span>
              <span className="text-base-content/60">base</span>
            </div>
            <span className="font-medium">{formatPrice(runtime.baseMonthlyCost)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-base-content/60">
            <span>{runtime.baseInstanceHours} inst-h/sem</span>
            <span>{formatHourlyPrice(runtime.baseHourlyPrice)}</span>
          </div>
        </div>

        {/* Configuration de scaling */}
        {hasScaling && (
          <>
            <div className="divider my-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="badge badge-outline badge-sm">{runtime.scalingFlavorName}</span>
                  <span className="text-base-content/60">scaling</span>
                </div>
                <span className="font-medium">{formatPrice(runtime.scalingMonthlyCost)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-base-content/60">
                <span>{runtime.scalingInstanceHours} inst-h/sem ({runtime.scalingHours}h actives)</span>
                <span>{formatHourlyPrice(runtime.scalingHourlyPrice)}</span>
              </div>
            </div>
          </>
        )}

        {/* Fourchette de couts */}
        {hasCostRange && (
          <>
            <div className="divider my-2" />
            <div className="bg-base-200/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icons.Chart className="w-4 h-4 text-primary/70" />
                <span className="text-xs font-medium">Fourchette de couts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <div className="text-xs text-base-content/60">Min</div>
                  <div className="font-medium">{formatPrice(runtime.minMonthlyCost)}</div>
                </div>
                <div className="flex-1 mx-3 h-1 bg-gradient-to-r from-success via-warning to-error rounded-full" />
                <div className="text-center">
                  <div className="text-xs text-base-content/60">Max</div>
                  <div className="font-medium">{formatPrice(runtime.maxMonthlyCost)}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AddonCard({ addon }: { addon: AddonCostDetail }) {
  return (
    <div className="card bg-base-100 border border-base-300 hover:border-secondary/30 transition-colors duration-200">
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Icons.Puzzle className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{addon.providerName}</h3>
              <span className="badge badge-secondary badge-sm badge-outline">{addon.planName}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-secondary text-lg">
              {formatPrice(addon.monthlyPrice)}
            </div>
            <div className="text-xs text-base-content/60">/mois</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CostSummary({ cost }: CostSummaryProps) {
  const totalMinCost = cost.runtimesDetail.reduce((sum, r) => sum + r.minMonthlyCost, 0) + cost.addonsCost
  const totalMaxCost = cost.runtimesDetail.reduce((sum, r) => sum + r.maxMonthlyCost, 0) + cost.addonsCost
  const hasCostRange = totalMinCost !== totalMaxCost

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Header avec cout total */}
      <div className="card bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 border border-base-300 overflow-hidden">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Cout total principal */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Icons.Chart className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-base-content/70 uppercase tracking-wide">
                  Cout mensuel estime
                </span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-primary animate-[scaleIn_0.3s_ease-out]">
                {formatPrice(cost.totalMonthlyCost)}
              </div>
              {hasCostRange && (
                <div className="mt-2 text-sm text-base-content/60">
                  Fourchette: {formatPrice(totalMinCost)} - {formatPrice(totalMaxCost)}
                </div>
              )}
            </div>

            {/* Stats rapides */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icons.Server className="w-4 h-4 text-primary" />
                  <span className="text-xs text-base-content/60">Runtimes</span>
                </div>
                <div className="font-bold text-xl text-primary">{formatPrice(cost.runtimesCost)}</div>
                <div className="text-xs text-base-content/50">{cost.runtimesDetail.length} instance(s)</div>
              </div>
              <div className="divider divider-horizontal mx-0" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icons.Puzzle className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-base-content/60">Addons</span>
                </div>
                <div className="font-bold text-xl text-secondary">{formatPrice(cost.addonsCost)}</div>
                <div className="text-xs text-base-content/50">{cost.addonsDetail.length} service(s)</div>
              </div>
            </div>
          </div>

          {/* Barre de repartition */}
          {cost.totalMonthlyCost > 0 && (
            <>
              <div className="divider my-4" />
              <CostBreakdownBar
                runtimesCost={cost.runtimesCost}
                addonsCost={cost.addonsCost}
                total={cost.totalMonthlyCost}
              />
            </>
          )}
        </div>
      </div>

      {/* Detail des runtimes */}
      {cost.runtimesDetail.length > 0 && (
        <div className="space-y-4 animate-[slideUp_0.4s_ease-out_0.1s_both]">
          <div className="flex items-center gap-2">
            <Icons.Server className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Runtimes</h2>
            <span className="badge badge-primary badge-sm">{cost.runtimesDetail.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cost.runtimesDetail.map((runtime, index) => (
              <div
                key={runtime.runtimeId}
                className="animate-[fadeIn_0.3s_ease-out_both]"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <RuntimeCard runtime={runtime} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
              <span className="text-sm text-base-content/70">Total Runtimes: </span>
              <span className="font-bold text-primary">{formatMonthlyPrice(cost.runtimesCost)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail des addons */}
      {cost.addonsDetail.length > 0 && (
        <div className="space-y-4 animate-[slideUp_0.4s_ease-out_0.2s_both]">
          <div className="flex items-center gap-2">
            <Icons.Puzzle className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold">Addons</h2>
            <span className="badge badge-secondary badge-sm">{cost.addonsDetail.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cost.addonsDetail.map((addon, index) => (
              <div
                key={addon.addonId}
                className="animate-[fadeIn_0.3s_ease-out_both]"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <AddonCard addon={addon} />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="bg-secondary/5 border border-secondary/20 rounded-lg px-4 py-2">
              <span className="text-sm text-base-content/70">Total Addons: </span>
              <span className="font-bold text-secondary">{formatMonthlyPrice(cost.addonsCost)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Message si vide */}
      {cost.runtimesDetail.length === 0 && cost.addonsDetail.length === 0 && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center py-12">
            <Icons.Chart className="w-12 h-12 text-base-content/20 mb-4" />
            <h3 className="font-semibold text-lg">Aucun element a facturer</h3>
            <p className="text-base-content/60">
              Ajoutez des runtimes ou des addons pour voir l'estimation des couts.
            </p>
          </div>
        </div>
      )}

      {/* Styles pour les animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
