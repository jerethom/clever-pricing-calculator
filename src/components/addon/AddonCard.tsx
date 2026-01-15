import { useState } from 'react'
import type { AddonConfig } from '@/types'
import type { AddonFeature } from '@/api/types'
import { useProjectStore } from '@/store/projectStore'
import { useAddons } from '@/hooks/useAddons'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import { Icons, ConfirmDialog } from '@/components/ui'
import { AddonForm } from './AddonForm'

// Features prioritaires à afficher en premier (par ordre de priorité)
const PRIORITY_FEATURES = ['memory', 'max_db_size', 'disk', 'vcpus', 'cpu', 'storage', 'max_connection_limit']

// Trie les features par priorité pour un affichage cohérent
function sortFeaturesByPriority(features: AddonFeature[]): AddonFeature[] {
  return [...features].sort((a, b) => {
    const aIndex = PRIORITY_FEATURES.findIndex(p => a.name_code?.toLowerCase().includes(p))
    const bIndex = PRIORITY_FEATURES.findIndex(p => b.name_code?.toLowerCase().includes(p))
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return 0
  })
}

interface AddonCardProps {
  projectId: string
  addon: AddonConfig
}

export function AddonCard({ projectId, addon }: AddonCardProps) {
  const { data: addonProviders } = useAddons()
  const removeAddon = useProjectStore(state => state.removeAddon)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  // Récupérer les infos du provider et du plan
  const provider = addonProviders?.find(p => p.id === addon.providerId)
  const plan = provider?.plans.find(p => p.id === addon.planId)
  const features = plan?.features ? sortFeaturesByPriority(plan.features) : []

  const handleDelete = () => {
    removeAddon(projectId, addon.id)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
      <div className="card-body p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {addon.providerLogo ? (
              <img
                src={addon.providerLogo}
                alt=""
                className="w-12 h-12 object-contain bg-base-200 p-1.5 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-base-200 flex items-center justify-center flex-shrink-0">
                <Icons.Puzzle className="w-6 h-6 text-base-content/40" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{addon.providerName}</h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="badge badge-sm badge-outline">{addon.planName}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all"
              onClick={() => setShowEditForm(true)}
              aria-label={`Modifier ${addon.providerName}`}
            >
              <Icons.Edit className="w-4 h-4" />
            </button>
            <button
              className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label={`Supprimer ${addon.providerName}`}
            >
              <Icons.Trash className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Features du plan */}
        {features.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {features.slice(0, 4).map((feature, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-1.5 px-2 bg-base-200/50 text-sm"
              >
                <span className="text-base-content/60 truncate">{feature.name}</span>
                <span className="font-medium ml-2 flex-shrink-0">{feature.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Section coût */}
        <div className="mt-4 overflow-hidden border border-base-300">
          <div className="bg-base-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-base-content/70">Coût mensuel</span>
              <span className="text-2xl font-bold text-primary">
                {addon.monthlyPrice === 0 ? 'Gratuit' : formatMonthlyPrice(addon.monthlyPrice)}
              </span>
            </div>
          </div>

          {/* Détails supplémentaires */}
          {features.length > 4 && (
            <details className="group">
              <summary className="px-4 py-2 bg-base-200 cursor-pointer flex items-center justify-between hover:bg-base-300 transition-colors list-none">
                <span className="text-sm font-medium">Voir toutes les caractéristiques</span>
                <svg
                  className="w-4 h-4 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>

              <div className="p-4 bg-base-100 border-t border-base-300">
                <div className="grid grid-cols-2 gap-2">
                  {features.slice(4).map((feature, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-1.5 px-2 bg-base-200/30 text-sm"
                    >
                      <span className="text-base-content/60 truncate">{feature.name}</span>
                      <span className="font-medium ml-2 flex-shrink-0">{feature.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      {showEditForm && (
        <AddonForm
          projectId={projectId}
          onClose={() => setShowEditForm(false)}
          editingAddon={addon}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer l'addon"
        message={`Voulez-vous vraiment supprimer l'addon "${addon.providerName}" ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
