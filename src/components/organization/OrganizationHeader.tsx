import { memo, useState, useCallback } from 'react'
import type { Organization } from '@/types'
import { Icons, ConfirmDialog } from '@/components/ui'

// Formater les dates (hors du composant pour éviter les re-créations)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Date invalide'
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return 'Date invalide'
  }
}

interface OrganizationHeaderProps {
  organization: Organization
  onUpdateName: (name: string) => void
  onDelete: () => void
}

export const OrganizationHeader = memo(function OrganizationHeader({
  organization,
  onUpdateName,
  onDelete,
}: OrganizationHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleStartEdit = useCallback(() => {
    setEditName(organization.name)
    setIsEditing(true)
  }, [organization.name])

  const handleSaveEdit = useCallback(() => {
    if (editName.trim() && editName.trim() !== organization.name) {
      onUpdateName(editName.trim())
    }
    setIsEditing(false)
  }, [editName, organization.name, onUpdateName])

  const handleCancelEdit = () => setIsEditing(false)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }, [handleSaveEdit])

  return (
    <div className="space-y-4">
      {/* Ligne principale: Nom + Actions */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        {/* Nom de l'organisation */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="animate-in fade-in duration-200">
              <label
                htmlFor="org-name-input"
                className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2 block"
              >
                Renommer l'organisation
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="org-name-input"
                  type="text"
                  className="input input-bordered flex-1 font-semibold text-lg"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  placeholder="Nom de l'organisation..."
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary flex-1 sm:flex-none gap-2"
                    onClick={handleSaveEdit}
                  >
                    <Icons.Check className="w-4 h-4" />
                    <span>Sauvegarder</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleCancelEdit}
                    aria-label="Annuler"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 group">
                <Icons.Building className="w-5 h-5 text-primary shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {organization.name}
                </h1>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleStartEdit}
                  aria-label="Modifier le nom de l'organisation"
                >
                  <Icons.Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bouton supprimer desktop */}
        {!isEditing && (
          <div className="tooltip tooltip-left hidden sm:block" data-tip="Supprimer cette organisation">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label={`Supprimer l'organisation ${organization.name}`}
            >
              <Icons.Trash className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Metadata - dates */}
      {!isEditing && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/60">
          <div className="flex items-center gap-1.5">
            <Icons.Calendar className="w-3.5 h-3.5" />
            <span>Cree le {formatDate(organization.createdAt)}</span>
          </div>
          {organization.updatedAt !== organization.createdAt && (
            <>
              <span className="hidden sm:inline text-base-300" aria-hidden="true">|</span>
              <div className="flex items-center gap-1.5">
                <Icons.Clock className="w-3.5 h-3.5" />
                <span>Modifie le {formatDate(organization.updatedAt)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bouton supprimer mobile */}
      {!isEditing && (
        <div className="sm:hidden pt-1">
          <button
            type="button"
            className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10 w-full justify-center gap-2 cursor-pointer"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={`Supprimer l'organisation ${organization.name}`}
          >
            <Icons.Trash className="w-4 h-4" />
            Supprimer cette organisation
          </button>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer l'organisation"
        message={`Voulez-vous vraiment supprimer l'organisation "${organization.name}" et tous ses projets ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={onDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
})
