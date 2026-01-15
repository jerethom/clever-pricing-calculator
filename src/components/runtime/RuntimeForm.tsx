import { useState } from 'react'
import { useInstances } from '@/hooks/useInstances'
import { useProjectStore } from '@/store/projectStore'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import { NumberInput } from '@/components/ui'
import { createEmptySchedule } from '@/types'

const HOURS_PER_MONTH = 730 // ~24h × 30.4j

interface RuntimeFormProps {
  projectId: string
  onClose: () => void
}

export function RuntimeForm({ projectId, onClose }: RuntimeFormProps) {
  const { data: instances, isLoading } = useInstances()
  const addRuntime = useProjectStore(state => state.addRuntime)

  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [minInstances, setMinInstances] = useState(1)
  const [maxInstances, setMaxInstances] = useState(1)

  const selectedInstance = instances?.find(i => i.variant.id === selectedVariantId)

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId)
    const instance = instances?.find(i => i.variant.id === variantId)
    if (instance) {
      setSelectedFlavor(instance.defaultFlavor.name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedInstance) return

    addRuntime(projectId, {
      instanceType: selectedInstance.type,
      instanceName: selectedInstance.name,
      variantLogo: selectedInstance.variant.logo,
      defaultFlavorName: selectedFlavor,
      defaultMinInstances: minInstances,
      defaultMaxInstances: maxInstances,
      weeklySchedule: createEmptySchedule(),
    })

    onClose()
  }

  // Grouper les instances par type de déploiement
  const groupedInstances = instances?.reduce(
    (acc, instance) => {
      const deployType = instance.variant.deployType
      if (!acc[deployType]) acc[deployType] = []
      acc[deployType].push(instance)
      return acc
    },
    {} as Record<string, typeof instances>
  )

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Ajouter un runtime</h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Sélection du type de runtime */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Type de runtime</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedVariantId}
                onChange={e => handleVariantChange(e.target.value)}
                required
              >
                <option value="">Sélectionnez un runtime...</option>
                {groupedInstances &&
                  Object.entries(groupedInstances).map(([deployType, group]) => (
                    <optgroup key={deployType} label={deployType}>
                      {group?.map(instance => (
                        <option key={instance.variant.id} value={instance.variant.id}>
                          {instance.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            </div>

            {selectedInstance && (
              <>
                {/* Aperçu du runtime sélectionné */}
                <div className="alert mb-4">
                  <div className="flex items-center gap-3">
                    {selectedInstance.variant.logo && (
                      <img
                        src={selectedInstance.variant.logo}
                        alt={selectedInstance.name}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div>
                      <h4 className="font-bold">{selectedInstance.name}</h4>
                      <p className="text-sm opacity-70">
                        {selectedInstance.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sélection du flavor */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Flavor (taille)</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={selectedFlavor}
                    onChange={e => setSelectedFlavor(e.target.value)}
                    required
                  >
                    {selectedInstance.flavors
                      .filter(f => f.available)
                      .map(flavor => (
                        <option key={flavor.name} value={flavor.name}>
                          {flavor.name} - {flavor.memory.formatted} / {flavor.cpus} CPU
                          ({formatMonthlyPrice(flavor.price * HOURS_PER_MONTH)})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Configuration de la scalabilité */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <NumberInput
                    label="Min instances"
                    value={minInstances}
                    onChange={setMinInstances}
                    min={1}
                    max={maxInstances}
                  />
                  <NumberInput
                    label="Max instances"
                    value={maxInstances}
                    onChange={setMaxInstances}
                    min={minInstances}
                    max={selectedInstance.maxInstances}
                  />
                </div>
              </>
            )}

            <div className="modal-action">
              <button type="button" className="btn" onClick={onClose}>
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedVariantId || !selectedFlavor}
              >
                Ajouter
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
