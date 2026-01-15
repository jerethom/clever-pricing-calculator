import type { InstanceFlavor } from '@/api/types'
import { formatMonthlyPrice, formatHourlyPrice } from '@/lib/costCalculator'

const HOURS_PER_MONTH = 730

interface FlavorPickerProps {
  isOpen: boolean
  onClose: () => void
  flavors: InstanceFlavor[]
  selectedFlavor: string
  onSelect: (flavorName: string) => void
}

export function FlavorPicker({
  isOpen,
  onClose,
  flavors,
  selectedFlavor,
  onSelect,
}: FlavorPickerProps) {
  if (!isOpen) return null

  const availableFlavors = flavors.filter(f => f.available)
  const maxCpus = Math.max(...availableFlavors.map(f => f.cpus))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#13172e]/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-base-100 max-w-2xl w-full mx-4 border border-base-300 animate-in max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-base-300">
          <h3 className="font-bold text-lg">Choisir une configuration</h3>
          <p className="text-sm text-base-content/60 mt-1">
            Sélectionnez la taille de votre instance
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid gap-2">
            {availableFlavors.map(flavor => {
              const isSelected = selectedFlavor === flavor.name
              const powerLevel = Math.ceil((flavor.cpus / maxCpus) * 5)

              return (
                <button
                  key={flavor.name}
                  onClick={() => {
                    onSelect(flavor.name)
                    onClose()
                  }}
                  className={`
                    flex items-center justify-between p-4 border-2 transition-all text-left
                    ${isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-primary/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Barre de puissance visuelle */}
                    <div className="flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-5 ${
                            i < powerLevel ? 'bg-primary' : 'bg-base-300'
                          }`}
                        />
                      ))}
                    </div>

                    <div>
                      <div className="font-semibold">{flavor.name}</div>
                      <div className="text-sm text-base-content/60">
                        {flavor.memory.formatted} RAM • {flavor.cpus} vCPU
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {formatMonthlyPrice(flavor.price * HOURS_PER_MONTH)}
                    </div>
                    <div className="text-xs text-base-content/50">
                      {formatHourlyPrice(flavor.price)}/h
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 bg-base-200 border-t border-base-300">
          <button className="btn btn-ghost w-full" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
