import { memo } from 'react'
import { formatPrice, formatHourlyPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardCostsProps } from './types'

export const RuntimeCardCosts = memo(function RuntimeCardCosts({
  className = '',
}: RuntimeCardCostsProps) {
  const { runtime, cost, gaugePosition } = useRuntimeCardContext()

  return (
    <div className={`overflow-hidden border border-base-300 ${className}`}>
      {/* Cout principal mis en evidence */}
      <div className="bg-base-200 p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-base-content/70">
              Estimation mensuelle
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatPrice(cost.totalMonthlyCost)}
            </p>
          </div>
          {cost.scalingHours > 0 && (
            <span className="badge badge-warning badge-sm">
              <Icons.Clock className="w-3 h-3 mr-1" />
              {cost.scalingHours}h/sem
            </span>
          )}
        </div>

        {/* Jauge min-actuel-max */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-base-content/60 mb-1">
            <span>{formatPrice(cost.minMonthlyCost)}</span>
            <span>{formatPrice(cost.maxMonthlyCost)}</span>
          </div>
          <div className="h-2 bg-base-300 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, gaugePosition)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-base-content/50">Base seule</span>
            <span className="text-base-content/50">Scaling 24/7</span>
          </div>
        </div>
      </div>

      {/* Detail collapse */}
      <details className="group">
        <summary className="px-4 py-2 bg-base-200 cursor-pointer flex items-center justify-between hover:bg-base-300 transition-colors list-none">
          <span className="text-sm font-medium">Voir le detail</span>
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>

        <div className="p-4 bg-base-100 space-y-3 text-sm border-t border-base-300">
          {/* Cout de base */}
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">Base</span>
              <span className="text-base-content/60 text-xs block">
                {runtime.defaultMinInstances} inst. x {cost.baselineHours}h
                x {formatHourlyPrice(cost.baseHourlyPrice)} x 4,33
              </span>
            </div>
            <span className="font-mono tabular-nums">
              {formatPrice(cost.baseMonthlyCost)}
            </span>
          </div>

          {/* Cout scaling */}
          {cost.scalingHours > 0 && (
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium">Scaling</span>
                {cost.scalingFlavorName !== cost.baseFlavorName && (
                  <span className="badge badge-xs badge-info ml-2">
                    {cost.scalingFlavorName}
                  </span>
                )}
                <span className="text-base-content/60 text-xs block">
                  {cost.scalingInstanceHours} inst-h x{' '}
                  {formatHourlyPrice(cost.scalingHourlyPrice)} x 4,33
                </span>
              </div>
              <span className="font-mono tabular-nums">
                {formatPrice(cost.scalingMonthlyCost)}
              </span>
            </div>
          )}
        </div>
      </details>
    </div>
  )
})
