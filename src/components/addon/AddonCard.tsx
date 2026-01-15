import { useState } from 'react'
import type { AddonConfig } from '@/types'
import type { AddonFeature } from '@/api/types'
import { useProjectStore } from '@/store/projectStore'
import { useAddons } from '@/hooks/useAddons'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import { Icons, ConfirmDialog } from '@/components/ui'
import { AddonForm } from './AddonForm'

// Features prioritaires a afficher en premier (par ordre de priorite)
const PRIORITY_FEATURES = ['memory', 'max_db_size', 'disk', 'vcpus', 'cpu', 'storage', 'max_connection_limit']

// Trie les features par priorite pour un affichage coherent
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

  // Recuperer les infos du provider et du plan
  const provider = addonProviders?.find(p => p.id === addon.providerId)
  const plan = provider?.plans.find(p => p.id === addon.planId)
  const features = plan?.features ? sortFeaturesByPriority(plan.features) : []

  // Extraire les features principales pour le bouton de configuration
  const mainFeatures = features.slice(0, 2)
  const mainFeatureText = mainFeatures.map(f => f.value).join(' - ')

  const handleDelete = () => {
    removeAddon(projectId, addon.id)
    setShowDeleteConfirm(false)
  }

  const isFree = addon.monthlyPrice === 0

  return (
    <div className="card bg-base-100 border border-base-300 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
      <div className="card-body p-4 sm:p-6">
        {/* Header avec statut visuel */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {addon.providerLogo ? (
              <div className="relative flex-shrink-0">
                <img
                  src={addon.providerLogo}
                  alt=""
                  className="w-12 h-12 object-contain bg-base-200 p-1.5"
                />
                {/* Indicateur de statut */}
                <span
                  className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-base-100 ${
                    isFree ? 'bg-success' : 'bg-primary'
                  }`}
                  title={isFree ? 'Plan gratuit' : 'Plan payant'}
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-base-200 flex items-center justify-center flex-shrink-0">
                <Icons.Puzzle className="w-6 h-6 text-base-content/40" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{addon.providerName}</h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="badge badge-sm badge-ghost">{addon.planName}</span>
                {isFree && (
                  <span className="badge badge-sm badge-success badge-outline">Gratuit</span>
                )}
              </div>
            </div>
          </div>

          {/* Action supprimer */}
          <button
            className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={`Supprimer ${addon.providerName}`}
          >
            <Icons.Trash className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration du plan - Bouton compact */}
        <div className="mt-4">
          <label className="label py-1">
            <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/60">
              Plan actuel
            </span>
          </label>
          <button
            className="btn btn-ghost btn-block justify-between h-auto py-3 px-4 border border-base-300 hover:border-primary/50 hover:bg-base-200"
            onClick={() => setShowEditForm(true)}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-semibold text-base">{addon.planName}</span>
              {mainFeatureText && (
                <span className="text-xs text-base-content/60">
                  {mainFeatureText}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-primary font-bold">
                {isFree ? 'Gratuit' : formatMonthlyPrice(addon.monthlyPrice)}
              </span>
              <span className="text-xs text-base-content/60">
                <Icons.Edit className="w-3 h-3 inline mr-1" />
                Modifier
              </span>
            </div>
          </button>
        </div>

        {/* Section cout */}
        <div className="mt-4 overflow-hidden border border-base-300">
          {/* Cout principal mis en evidence */}
          <div className="bg-base-200 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/70">Estimation mensuelle</p>
                <p className="text-2xl font-bold text-primary">
                  {isFree ? 'Gratuit' : formatMonthlyPrice(addon.monthlyPrice)}
                </p>
              </div>
              {isFree && (
                <span className="badge badge-success badge-sm">
                  <Icons.Check className="w-3 h-3 mr-1" />
                  Inclus
                </span>
              )}
            </div>
          </div>

          {/* Detail collapse avec features */}
          {features.length > 0 && (
            <details className="group">
              <summary className="px-4 py-2 bg-base-200 cursor-pointer flex items-center justify-between hover:bg-base-300 transition-colors list-none">
                <span className="text-sm font-medium">Voir les caracteristiques</span>
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
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 px-3 bg-base-200/50 text-sm"
                    >
                      <span className="text-base-content/70">{feature.name}</span>
                      <span className="font-medium font-mono tabular-nums">
                        {feature.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Modal d'edition */}
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
