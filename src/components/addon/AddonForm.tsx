import { useState } from 'react'
import { useAddons } from '@/hooks/useAddons'
import { useProjectStore } from '@/store/projectStore'
import { formatMonthlyPrice } from '@/lib/costCalculator'

interface AddonFormProps {
  projectId: string
  onClose: () => void
}

export function AddonForm({ projectId, onClose }: AddonFormProps) {
  const { data: addonProviders, isLoading } = useAddons()
  const addAddon = useProjectStore(state => state.addAddon)

  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProviders = addonProviders?.filter(
    provider =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedProvider = addonProviders?.find(p => p.id === selectedProviderId)
  const selectedPlan = selectedProvider?.plans.find(p => p.id === selectedPlanId)

  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(providerId)
    const provider = addonProviders?.find(p => p.id === providerId)
    if (provider && provider.plans.length > 0) {
      setSelectedPlanId(provider.plans[0].id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProvider || !selectedPlan) return

    addAddon(projectId, {
      providerId: selectedProvider.id,
      providerName: selectedProvider.name,
      providerLogo: selectedProvider.logoUrl,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      monthlyPrice: selectedPlan.price,
    })

    onClose()
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg mb-4">Ajouter un addon</h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Recherche */}
            <div className="form-control mb-4">
              <input
                type="text"
                className="input input-bordered"
                placeholder="Rechercher un addon..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Liste des providers */}
            {!selectedProviderId ? (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredProviders?.map(provider => (
                  <button
                    key={provider.id}
                    type="button"
                    className="flex items-center gap-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors text-left"
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    {provider.logoUrl && (
                      <img
                        src={provider.logoUrl}
                        alt={provider.name}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold">{provider.name}</h4>
                      <p className="text-sm text-base-content/60 line-clamp-2">
                        {provider.shortDesc}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-base-content/60">
                        À partir de
                      </div>
                      <div className="font-bold">
                        {provider.plans[0]?.price === 0
                          ? 'Gratuit'
                          : formatMonthlyPrice(provider.plans[0]?.price ?? 0)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Provider sélectionné */}
                <div className="flex items-center gap-4 p-4 bg-base-200 rounded-lg mb-4">
                  {selectedProvider?.logoUrl && (
                    <img
                      src={selectedProvider.logoUrl}
                      alt={selectedProvider.name}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold">{selectedProvider?.name}</h4>
                    <p className="text-sm text-base-content/60">
                      {selectedProvider?.shortDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSelectedProviderId('')
                      setSelectedPlanId('')
                    }}
                  >
                    Changer
                  </button>
                </div>

                {/* Sélection du plan */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Plan</span>
                  </label>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {selectedProvider?.plans.map(plan => (
                      <label
                        key={plan.id}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                          selectedPlanId === plan.id
                            ? 'border-primary bg-primary/10'
                            : 'border-base-300 hover:border-base-content/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="plan"
                          className="radio radio-primary"
                          checked={selectedPlanId === plan.id}
                          onChange={() => setSelectedPlanId(plan.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-xs text-base-content/60">
                            {plan.features
                              .slice(0, 3)
                              .map(f => `${f.name}: ${f.value}`)
                              .join(' • ')}
                          </div>
                        </div>
                        <div className="font-bold">
                          {plan.price === 0 ? 'Gratuit' : formatMonthlyPrice(plan.price)}
                        </div>
                      </label>
                    ))}
                  </div>
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
                disabled={!selectedProviderId || !selectedPlanId}
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
