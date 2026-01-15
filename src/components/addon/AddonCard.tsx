import { useState } from 'react'
import type { AddonConfig } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { formatMonthlyPrice } from '@/lib/costCalculator'
import { Icons, ConfirmDialog } from '@/components/ui'

interface AddonCardProps {
  projectId: string
  addon: AddonConfig
}

export function AddonCard({ projectId, addon }: AddonCardProps) {
  const removeAddon = useProjectStore(state => state.removeAddon)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    removeAddon(projectId, addon.id)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {addon.providerLogo && (
              <img
                src={addon.providerLogo}
                alt={addon.providerName}
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              <h3 className="font-bold">{addon.providerName}</h3>
              <span className="badge badge-outline badge-sm">{addon.planName}</span>
            </div>
          </div>
          <div className="tooltip tooltip-left" data-tip="Supprimer cet addon">
            <button
              className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label={`Supprimer ${addon.providerName}`}
            >
              <Icons.Trash className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="divider my-2"></div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-base-content/70">Prix mensuel</span>
          <span className="text-lg font-bold text-primary">
            {addon.monthlyPrice === 0 ? 'Gratuit' : formatMonthlyPrice(addon.monthlyPrice)}
          </span>
        </div>
      </div>

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
