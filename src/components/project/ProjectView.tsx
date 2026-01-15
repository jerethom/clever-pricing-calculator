import { useState, lazy, Suspense } from 'react'
import {
  useSelector,
  useProjectActions,
  selectActiveProject,
} from '@/store'
import { useActiveProjectCost } from '@/hooks/useCostCalculation'
import { formatPrice } from '@/lib/costCalculator'
import { RuntimeList } from '@/components/runtime/RuntimeList'
import { AddonList } from '@/components/addon/AddonList'
import { Icons, ConfirmDialog, CostSummarySkeleton } from '@/components/ui'

const CostSummary = lazy(() => import('@/components/project/CostSummary'))

export function ProjectView() {
  const activeProject = useSelector(selectActiveProject)
  const { updateProject, deleteProject } = useProjectActions()
  const cost = useActiveProjectCost()

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [activeTab, setActiveTab] = useState<'runtimes' | 'addons' | 'summary'>('runtimes')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="bg-base-200 rounded-full p-6 mb-6">
          <Icons.Folder className="w-16 h-16 text-base-content/30" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Aucun projet sélectionné</h2>
        <p className="text-base-content/70 max-w-md">
          Sélectionnez un projet dans la barre latérale ou créez-en un nouveau
        </p>
      </div>
    )
  }

  const handleStartEdit = () => {
    setEditName(activeProject.name)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editName.trim()) {
      updateProject(activeProject.id, { name: editName.trim() })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteProject(activeProject.id)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="space-y-6">
      {/* En-tete du projet */}
      <div className="space-y-4">
        {/* Ligne principale: Nom du projet + Actions */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          {/* Nom du projet */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="animate-in">
                <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2 block">
                  Renommer le projet
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1 font-semibold text-lg"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') setIsEditing(false)
                    }}
                    autoFocus
                    placeholder="Nom du projet..."
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary flex-1 sm:flex-none gap-2 cursor-pointer"
                      onClick={handleSaveEdit}
                    >
                      <Icons.Check className="w-4 h-4" />
                      <span>Sauvegarder</span>
                    </button>
                    <button
                      className="btn btn-ghost cursor-pointer"
                      onClick={() => setIsEditing(false)}
                      aria-label="Annuler"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <Icons.Folder className="w-5 h-5 text-primary shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {activeProject.name}
                </h1>
                <button
                  className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleStartEdit}
                  aria-label="Modifier le nom du projet"
                >
                  <Icons.Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Bouton supprimer desktop */}
          {!isEditing && (
            <div className="tooltip tooltip-left hidden sm:block" data-tip="Supprimer ce projet">
              <button
                className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={`Supprimer le projet ${activeProject.name}`}
              >
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Statistiques */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {/* Runtimes */}
            <div className="flex items-center gap-2">
              <Icons.Server className="w-4 h-4 text-primary" />
              <span className="font-medium">{activeProject.runtimes.length}</span>
              <span className="text-base-content/60">
                runtime{activeProject.runtimes.length !== 1 ? 's' : ''}
              </span>
              <span className="text-base-content/40">
                ({cost ? formatPrice(cost.runtimesCost) : '...'})
              </span>
            </div>

            {/* Separateur */}
            <span className="hidden sm:block text-base-300">|</span>

            {/* Addons */}
            <div className="flex items-center gap-2">
              <Icons.Puzzle className="w-4 h-4 text-secondary" />
              <span className="font-medium">{activeProject.addons.length}</span>
              <span className="text-base-content/60">
                addon{activeProject.addons.length !== 1 ? 's' : ''}
              </span>
              <span className="text-base-content/40">
                ({cost ? formatPrice(cost.addonsCost) : '...'})
              </span>
            </div>

            {/* Separateur */}
            <span className="hidden sm:block text-base-300">|</span>

            {/* Cout total */}
            <div className="flex items-center gap-2">
              <Icons.Chart className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary text-base">
                {cost ? formatPrice(cost.totalMonthlyCost) : '...'}
              </span>
              <span className="text-base-content/60">/mois</span>
            </div>
          </div>
        )}

        {/* Bouton supprimer mobile */}
        {!isEditing && (
          <div className="sm:hidden pt-1">
            <button
              className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10 w-full justify-center gap-2 cursor-pointer"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label={`Supprimer le projet ${activeProject.name}`}
            >
              <Icons.Trash className="w-4 h-4" />
              Supprimer ce projet
            </button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div
        role="tablist"
        className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-base-200/50 rounded-xl pb-8"
      >
        {/* Onglet Runtimes */}
        <button
          role="tab"
          aria-selected={activeTab === 'runtimes'}
          className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer
            ${activeTab === 'runtimes'
              ? 'bg-base-100 border-b-2 border-primary'
              : 'bg-base-100 hover:bg-primary/10'
            }`}
          onClick={() => setActiveTab('runtimes')}
        >
          <div className={`p-1.5 rounded-md transition-colors duration-200 ${activeTab === 'runtimes' ? 'bg-primary/10 text-primary' : 'text-base-content/60 group-hover:text-primary'}`}>
            <Icons.Server className="w-4 h-4" />
          </div>
          <span className={`font-medium transition-colors duration-200 ${activeTab === 'runtimes' ? 'text-primary' : 'text-base-content/70 group-hover:text-base-content'}`}>
            Runtimes
          </span>
          <span className={`badge badge-sm ${activeTab === 'runtimes' ? 'badge-primary' : 'badge-ghost'}`}>
            {activeProject.runtimes.length}
          </span>
        </button>

        {/* Onglet Addons */}
        <button
          role="tab"
          aria-selected={activeTab === 'addons'}
          className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer
            ${activeTab === 'addons'
              ? 'bg-base-100 border-b-2 border-secondary'
              : 'bg-base-100 hover:bg-secondary/10'
            }`}
          onClick={() => setActiveTab('addons')}
        >
          <div className={`p-1.5 rounded-md transition-colors duration-200 ${activeTab === 'addons' ? 'bg-secondary/10 text-secondary' : 'text-base-content/60 group-hover:text-secondary'}`}>
            <Icons.Puzzle className="w-4 h-4" />
          </div>
          <span className={`font-medium transition-colors duration-200 ${activeTab === 'addons' ? 'text-secondary' : 'text-base-content/70 group-hover:text-base-content'}`}>
            Addons
          </span>
          <span className={`badge badge-sm ${activeTab === 'addons' ? 'badge-secondary' : 'badge-ghost'}`}>
            {activeProject.addons.length}
          </span>
        </button>

        {/* Onglet Projection */}
        <button
          role="tab"
          aria-selected={activeTab === 'summary'}
          className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer
            ${activeTab === 'summary'
              ? 'bg-base-100 border-b-2 border-accent'
              : 'bg-base-100 hover:bg-accent/10'
            }`}
          onClick={() => setActiveTab('summary')}
        >
          <div className={`p-1.5 rounded-md transition-colors duration-200 ${activeTab === 'summary' ? 'bg-accent/10 text-accent' : 'text-base-content/60 group-hover:text-accent'}`}>
            <Icons.TrendingUp className="w-4 h-4" />
          </div>
          <span className={`font-medium transition-colors duration-200 ${activeTab === 'summary' ? 'text-accent' : 'text-base-content/70 group-hover:text-base-content'}`}>
            Projection
          </span>
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="mt-2">
        {activeTab === 'runtimes' && <RuntimeList projectId={activeProject.id} />}
        {activeTab === 'addons' && <AddonList projectId={activeProject.id} />}
        {activeTab === 'summary' && cost && (
          <Suspense fallback={<CostSummarySkeleton />}>
            <CostSummary cost={cost} />
          </Suspense>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer le projet"
        message={`Voulez-vous vraiment supprimer le projet "${activeProject.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="error"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
