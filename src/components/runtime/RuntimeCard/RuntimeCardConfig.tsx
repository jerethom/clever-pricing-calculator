import { memo } from 'react'
import { HOURS_PER_MONTH } from '@/constants'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardConfigProps } from './types'

export const RuntimeCardConfig = memo(function RuntimeCardConfig({
  className = '',
}: RuntimeCardConfigProps) {
  const { runtime, currentFlavor, onOpenFlavorPicker } = useRuntimeCardContext()

  return (
    <div className={className}>
      <label className="label py-1">
        <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
          Configuration
        </span>
      </label>
      <button
        className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-primary/50 hover:bg-base-200"
        onClick={onOpenFlavorPicker}
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-semibold text-base">
            {runtime.defaultFlavorName}
          </span>
          <span className="text-xs text-base-content/60">
            {currentFlavor?.memory.formatted} - {currentFlavor?.cpus} vCPU
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-primary font-bold">
            {formatMonthlyPrice(
              (currentFlavor?.price ?? 0) * HOURS_PER_MONTH
            )}
          </span>
        </div>
      </button>
    </div>
  )
})
