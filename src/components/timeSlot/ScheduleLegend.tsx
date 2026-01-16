import { memo, useMemo } from 'react'
import { BASELINE_PROFILE_ID } from '@/types'
import type { ScalingProfile } from '@/types'
import { PROFILE_COLORS } from '@/constants'

interface ScheduleLegendProps {
  scalingProfiles: ScalingProfile[]
}

/**
 * Legende du calendrier montrant les profils et les niveaux de charge
 */
export const ScheduleLegend = memo(function ScheduleLegend({
  scalingProfiles,
}: ScheduleLegendProps) {
  // Filtrer les profils actifs (non baseline)
  const activeProfiles = useMemo(() =>
    scalingProfiles.filter(p => p.id !== BASELINE_PROFILE_ID),
    [scalingProfiles]
  )

  if (activeProfiles.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-base-content/50">Profils :</span>
      <div className="flex items-center gap-1">
        {activeProfiles.map((profile, index) => {
          const color = PROFILE_COLORS[index % PROFILE_COLORS.length]
          return (
            <div
              key={profile.id}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: color.hex, color: '#fff' }}
              title={`${profile.name}: ${profile.minInstances}-${profile.maxInstances} instances`}
            >
              <span>{profile.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
