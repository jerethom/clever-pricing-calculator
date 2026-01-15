interface ScheduleLegendProps {
  maxExtraInstances: number
  baseInstances: number
}

export function ScheduleLegend({
  maxExtraInstances,
  baseInstances,
}: ScheduleLegendProps) {
  // Générer les niveaux de la légende
  const levels: { value: number; label: string; sublabel: string }[] = [
    { value: 0, label: `${baseInstances}`, sublabel: 'baseline' },
  ]

  if (maxExtraInstances > 0) {
    // Ajouter des niveaux intermédiaires si pertinent
    if (maxExtraInstances >= 3) {
      const mid = Math.ceil(maxExtraInstances / 2)
      levels.push({
        value: mid,
        label: `${baseInstances + mid}`,
        sublabel: `+${mid}`,
      })
    }
    levels.push({
      value: maxExtraInstances,
      label: `${baseInstances + maxExtraInstances}`,
      sublabel: 'max',
    })
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-base-content/50 mr-2">Instances :</span>

      {/* Gradient visuel */}
      <div className="flex items-center">
        {levels.map((level, index) => (
          <div key={level.value} className="flex items-center">
            {index > 0 && (
              <div
                className="w-8 h-2"
                style={{
                  background: `linear-gradient(to right,
                    ${index === 1 ? 'rgb(249 249 251)' : 'rgba(87, 84, 170, 0.4)'},
                    ${index === levels.length - 1 ? 'rgb(87, 84, 170)' : 'rgba(87, 84, 170, 0.7)'}
                  )`,
                }}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-6 h-6 flex items-center justify-center text-xs font-bold border border-base-300
                  ${
                    level.value === 0
                      ? 'bg-base-200 text-base-content'
                      : level.value === maxExtraInstances
                        ? 'bg-[#5754aa] text-white'
                        : 'bg-[#5754aa]/50 text-white'
                  }
                `}
              >
                {level.label}
              </div>
              <span className="text-[10px] text-base-content/50 mt-0.5">
                {level.sublabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
