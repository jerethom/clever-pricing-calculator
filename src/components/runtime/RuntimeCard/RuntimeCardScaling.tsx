import { memo } from 'react'
import { NumberInput } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardScalingProps } from './types'

export const RuntimeCardScaling = memo(function RuntimeCardScaling({
  className = '',
}: RuntimeCardScalingProps) {
  const { runtime, instance, onMinInstancesChange, onMaxInstancesChange } =
    useRuntimeCardContext()

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="label py-1">
        <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
          Instances
        </span>
        <span className="label-text-alt text-base-content/60">
          {runtime.defaultMinInstances} - {runtime.defaultMaxInstances}
        </span>
      </label>

      {/* Visualisation des instances en blocs */}
      <div className="flex items-center gap-1 px-1">
        {Array.from({
          length: Math.min(runtime.defaultMaxInstances, 10),
        }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-6 transition-all ${
              i < runtime.defaultMinInstances
                ? 'bg-primary'
                : 'bg-primary/20 border border-dashed border-primary/40'
            }`}
            title={
              i < runtime.defaultMinInstances
                ? 'Instance de base'
                : 'Instance de scaling'
            }
          />
        ))}
        {runtime.defaultMaxInstances > 10 && (
          <span className="text-xs text-base-content/50 ml-1">
            +{runtime.defaultMaxInstances - 10}
          </span>
        )}
      </div>

      {/* Controles min/max */}
      <div className="space-y-2">
        <NumberInput
          label="Minimum (base)"
          labelPosition="left"
          value={runtime.defaultMinInstances}
          onChange={onMinInstancesChange}
          min={1}
          max={instance?.maxInstances ?? 40}
          size="sm"
        />
        <NumberInput
          label="Maximum (scaling)"
          labelPosition="left"
          value={runtime.defaultMaxInstances}
          onChange={onMaxInstancesChange}
          min={1}
          max={instance?.maxInstances ?? 40}
          size="sm"
        />
      </div>
    </div>
  )
})
