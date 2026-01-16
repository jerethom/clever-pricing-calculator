import { memo, useMemo } from 'react'
import { LOAD_LEVELS, LOAD_LEVEL_LABELS, BASELINE_PROFILE_ID } from '@/types'
import type { ScalingProfile } from '@/types'
import {
  PROFILE_COLORS,
  LOAD_LEVEL_OPACITIES,
  hexToRgba,
  shouldUseWhiteText,
} from '@/constants'

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

  // Couleur de reference pour l'echelle d'opacite (premier profil ou bleu par defaut)
  const referenceColor = PROFILE_COLORS[0]

  return (
    <div className="flex flex-wrap items-start gap-4">
      {/* Section Profils */}
      {activeProfiles.length > 0 && (
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
      )}

      {/* Section Niveaux d'opacite */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-base-content/50 mr-1">Charge estimée :</span>
        <div className="flex items-center gap-0.5">
          {LOAD_LEVELS.map((level) => {
            // Niveau 0 = gris neutre
            const isBaseline = level === 0
            const opacity = LOAD_LEVEL_OPACITIES[level] ?? 1
            const bgColor = isBaseline ? undefined : hexToRgba(referenceColor.hex, opacity)
            const useWhiteText = !isBaseline && shouldUseWhiteText(referenceColor.hex, opacity)

            return (
              <div key={level} className="flex flex-col items-center">
                <div
                  className={`
                    w-6 h-6 flex items-center justify-center text-xs font-bold border border-base-300 rounded-sm
                    ${isBaseline ? 'bg-base-200 text-base-content' : ''}
                    ${!isBaseline && useWhiteText ? 'text-white' : ''}
                    ${!isBaseline && !useWhiteText ? 'text-gray-900' : ''}
                  `}
                  style={isBaseline ? undefined : { backgroundColor: bgColor }}
                  title={LOAD_LEVEL_LABELS[level]}
                >
                  {level}
                </div>
                {(level === 0 || level === 5) && (
                  <span className="text-[10px] text-base-content/50 mt-0.5">
                    {level === 0 ? 'base' : 'max'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
