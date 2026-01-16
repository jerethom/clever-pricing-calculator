import { memo } from 'react'
import { Icons } from '@/components/ui'
import { useRuntimeCardContext } from './RuntimeCardContext'
import type { RuntimeCardHeaderProps } from './types'

export const RuntimeCardHeader = memo(function RuntimeCardHeader({
  className = '',
}: RuntimeCardHeaderProps) {
  const {
    runtime,
    cost,
    defaultName,
    baseConfig,
    isEditingName,
    editName,
    onStartEditName,
    onSaveEditName,
    onCancelEditName,
    onResetName,
    onEditNameChange,
    onEditNameKeyDown,
    onOpenDeleteConfirm,
  } = useRuntimeCardContext()

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {runtime.variantLogo ? (
          <div className="relative flex-shrink-0">
            <img
              src={runtime.variantLogo}
              alt=""
              className="w-12 h-12 object-contain bg-base-200 p-1.5"
            />
            {/* Indicateur de statut */}
            <span
              className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-base-100 ${
                cost.averageLoadLevel > 0
                  ? 'bg-warning animate-pulse'
                  : 'bg-success'
              }`}
              title={
                cost.averageLoadLevel > 0 ? 'Scaling actif' : 'Baseline 24/7'
              }
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-base-200 flex items-center justify-center flex-shrink-0">
            <Icons.Server className="w-6 h-6 text-base-content/40" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  className="input input-bordered input-sm flex-1 font-bold text-base min-w-0"
                  value={editName}
                  onChange={onEditNameChange}
                  onKeyDown={onEditNameKeyDown}
                  autoFocus
                  placeholder="Nom du runtime..."
                />
                <button
                  className="btn btn-ghost btn-xs btn-square text-success hover:bg-success/10 cursor-pointer"
                  onClick={onSaveEditName}
                  aria-label="Sauvegarder"
                >
                  <Icons.Check className="w-3.5 h-3.5" />
                </button>
                <div className="tooltip tooltip-bottom" data-tip={`Reset: ${defaultName}`}>
                  <button
                    className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-warning hover:bg-warning/10 cursor-pointer"
                    onClick={onResetName}
                    aria-label="Reinitialiser le nom"
                  >
                    <Icons.Refresh className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
                  onClick={onCancelEditName}
                  aria-label="Annuler"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 group/name">
              <h3 className="font-bold text-base truncate">
                {runtime.instanceName}
              </h3>
              <button
                className="btn btn-ghost btn-xs btn-square opacity-0 group-hover/name:opacity-100 transition-opacity cursor-pointer"
                onClick={onStartEditName}
                aria-label="Modifier le nom du runtime"
              >
                <Icons.Edit className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="badge badge-sm badge-ghost">
              {runtime.instanceType}
            </span>
            <span className="badge badge-sm badge-outline">
              {baseConfig.instances} inst.
            </span>
            {runtime.scalingEnabled ? (
              <span className="badge badge-sm badge-primary">
                Scaling
              </span>
            ) : (
              <span className="badge badge-sm badge-neutral">
                Fixe
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action supprimer */}
      <button
        className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
        onClick={onOpenDeleteConfirm}
        aria-label={`Supprimer ${runtime.instanceName}`}
      >
        <Icons.Trash className="w-4 h-4" />
      </button>
    </div>
  )
})
