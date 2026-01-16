import { memo } from 'react'
import { LOAD_LEVELS, LOAD_LEVEL_LABELS } from '@/types'

// Constantes statiques hors du composant pour eviter les re-creations
const LEVEL_COLORS = [
  'bg-base-200',      // 0 - Baseline
  'bg-[#5754aa]/20',  // 1
  'bg-[#5754aa]/40',  // 2
  'bg-[#5754aa]/60',  // 3
  'bg-[#5754aa]/80',  // 4
  'bg-[#5754aa]',     // 5
]

const TEXT_COLORS = [
  'text-base-content',
  'text-[#1c2045]',
  'text-[#1c2045]',
  'text-white',
  'text-white',
  'text-white',
]

// Composant memoise car il n'a pas de props et ne change jamais
export const ScheduleLegend = memo(function ScheduleLegend() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-base-content/50 mr-2">Niveau :</span>

      {/* Affichage des niveaux */}
      <div className="flex items-center gap-0.5">
        {LOAD_LEVELS.map((level, index) => (
          <div key={level} className="flex flex-col items-center">
            <div
              className={`
                w-6 h-6 flex items-center justify-center text-xs font-bold border border-base-300
                ${LEVEL_COLORS[index]}
                ${TEXT_COLORS[index]}
              `}
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
        ))}
      </div>
    </div>
  )
})
