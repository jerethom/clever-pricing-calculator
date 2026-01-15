import { useState } from 'react'
import { useAddons } from '@/hooks/useAddons'
import { useProjectStore } from '@/store/projectStore'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import type { AddonFeature } from '@/api/types'
import type { AddonConfig } from '@/types/project'

// Features prioritaires à afficher en premier (par ordre de priorité)
const PRIORITY_FEATURES = ['memory', 'max_db_size', 'disk', 'vcpus', 'cpu', 'storage', 'max_connection_limit']

// Trie les features par priorité pour un affichage cohérent
function sortFeaturesByPriority(features: AddonFeature[]): AddonFeature[] {
  return [...features].sort((a, b) => {
    const aIndex = PRIORITY_FEATURES.findIndex(p => a.name_code?.toLowerCase().includes(p))
    const bIndex = PRIORITY_FEATURES.findIndex(p => b.name_code?.toLowerCase().includes(p))
    // Si les deux ont une priorité, trier par priorité
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    // Les features prioritaires viennent en premier
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    // Sinon garder l'ordre original
    return 0
  })
}

interface AddonFormProps {
  projectId: string
  onClose: () => void
  editingAddon?: AddonConfig
}

export function AddonForm({ projectId, onClose, editingAddon }: AddonFormProps) {
  const { data: addonProviders, isLoading } = useAddons()
  const addAddon = useProjectStore(state => state.addAddon)
  const updateAddon = useProjectStore(state => state.updateAddon)

  const isEditMode = !!editingAddon

  const [selectedProviderId, setSelectedProviderId] = useState(editingAddon?.providerId ?? '')
  const [selectedPlanId, setSelectedPlanId] = useState(editingAddon?.planId ?? '')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProviders = addonProviders
    ?.filter(
      provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const selectedProvider = addonProviders?.find(p => p.id === selectedProviderId)
  const selectedPlan = selectedProvider?.plans.find(p => p.id === selectedPlanId)

  const filteredPlans = selectedProvider?.plans
    .filter(plan => plan.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.price - b.price)

  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(providerId)
    setSearchQuery('')
    const provider = addonProviders?.find(p => p.id === providerId)
    if (provider && provider.plans.length > 0) {
      // Sélectionner le plan le moins cher par défaut
      const sortedPlans = [...provider.plans].sort((a, b) => a.price - b.price)
      setSelectedPlanId(sortedPlans[0].id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProvider || !selectedPlan) return

    if (isEditMode && editingAddon) {
      updateAddon(projectId, editingAddon.id, {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        monthlyPrice: selectedPlan.price,
      })
    } else {
      addAddon(projectId, {
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        providerLogo: selectedProvider.logoUrl,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        monthlyPrice: selectedPlan.price,
      })
    }

    onClose()
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <h3 className="font-bold text-lg mb-4">
          {isEditMode ? 'Modifier l\'addon' : 'Ajouter un addon'}
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Recherche */}
            <div className="form-control mb-4">
              <div className="relative">
                <input
                  type="text"
                  className="input input-bordered w-full pr-10"
                  placeholder={selectedProviderId ? 'Rechercher un plan...' : 'Rechercher un addon...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                    onClick={() => setSearchQuery('')}
                    aria-label="Effacer la recherche"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Liste des providers */}
            {!selectedProviderId && !isEditMode ? (
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
                  {!isEditMode && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSelectedProviderId('')
                        setSelectedPlanId('')
                        setSearchQuery('')
                      }}
                    >
                      Changer
                    </button>
                  )}
                </div>

                {/* Sélection du plan */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Plan</span>
                  </label>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {filteredPlans?.map(plan => (
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
                            {sortFeaturesByPriority(plan.features)
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
                {isEditMode ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  )
}
