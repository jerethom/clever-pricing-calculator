import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useActiveProjectCost } from '@/hooks/useCostCalculation'
import { formatPrice } from '@/lib/costCalculator'
import { RuntimeList } from '@/components/runtime/RuntimeList'
import { AddonList } from '@/components/addon/AddonList'
import { CostSummary } from '@/components/project/CostSummary'
import { Icons, ConfirmDialog } from '@/components/ui'

export function ProjectView() {
  const activeProject = useProjectStore(state => state.getActiveProject())
  const updateProject = useProjectStore(state => state.updateProject)
  const deleteProject = useProjectStore(state => state.deleteProject)
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
      {/* En-tête du projet */}
      <div className="card bg-gradient-to-br from-base-100 via-base-100 to-primary/5 border border-base-300 shadow-xl overflow-hidden">
        {/* Barre décorative en haut */}
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

        <div className="card-body p-4 sm:p-6">
          {/* Ligne principale: Nom du projet + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Nom du projet avec icône */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="bg-base-200/80 backdrop-blur-sm p-4 rounded-xl border border-base-300 shadow-inner">
                    <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2 block">
                      Renommer le projet
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        className="input input-bordered input-lg flex-1 font-bold text-xl bg-base-100 focus:ring-2 focus:ring-primary/30"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') setIsEditing(false)
                        }}
                        autoFocus
                        placeholder="Nom du projet..."
                      />
                      <div className="flex gap-2 sm:flex-shrink-0">
                        <button
                          className="btn btn-primary flex-1 sm:flex-none gap-2 cursor-pointer"
                          onClick={handleSaveEdit}
                        >
                          <Icons.Check className="w-5 h-5" />
                          <span className="sm:inline">Sauvegarder</span>
                        </button>
                        <button
                          className="btn btn-ghost cursor-pointer"
                          onClick={() => setIsEditing(false)}
                          aria-label="Annuler"
                        >
                          <Icons.X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <div className="p-2.5 bg-primary/10 rounded-xl ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105">
                    <Icons.Folder className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                      {activeProject.name}
                    </h1>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {activeProject.runtimes.length + activeProject.addons.length} ressources configurées
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm btn-circle opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 cursor-pointer"
                    onClick={handleStartEdit}
                    aria-label="Modifier le nom du projet"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Bouton supprimer (visible uniquement hors mode édition) */}
            {!isEditing && (
              <div className="tooltip tooltip-left hidden sm:block" data-tip="Supprimer ce projet">
                <button
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label={`Supprimer le projet ${activeProject.name}`}
                >
                  <Icons.Trash className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Séparateur */}
          {!isEditing && <div className="divider my-3 sm:my-4" />}

          {/* Statistiques et coût total */}
          {!isEditing && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat: Runtimes */}
              <div className="bg-base-200/50 rounded-xl p-3 sm:p-4 border border-base-300/50 transition-all duration-200 hover:bg-base-200/80 hover:border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Icons.Server className="w-4 h-4 text-primary/70" />
                  <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Runtimes</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-base-content tabular-nums">
                    {activeProject.runtimes.length}
                  </span>
                  <span className="text-xs text-base-content/50">
                    {cost ? formatPrice(cost.runtimesCost) : '...'}
                  </span>
                </div>
              </div>

              {/* Stat: Addons */}
              <div className="bg-base-200/50 rounded-xl p-3 sm:p-4 border border-base-300/50 transition-all duration-200 hover:bg-base-200/80 hover:border-secondary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Icons.Puzzle className="w-4 h-4 text-secondary/70" />
                  <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Addons</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-base-content tabular-nums">
                    {activeProject.addons.length}
                  </span>
                  <span className="text-xs text-base-content/50">
                    {cost ? formatPrice(cost.addonsCost) : '...'}
                  </span>
                </div>
              </div>

              {/* Coût total - prend 2 colonnes sur mobile, 2 sur desktop */}
              <div className="col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-4 sm:p-5 border border-primary/20 relative overflow-hidden group transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                {/* Cercle décoratif */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Icons.Chart className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Coût mensuel total</span>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary tabular-nums tracking-tight">
                      {cost ? formatPrice(cost.totalMonthlyCost) : '...'}
                    </span>
                    <span className="text-base-content/50 text-sm font-medium">/mois</span>
                  </div>
                  {cost && cost.totalMonthlyCost > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-base-content/60">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary/60" />
                        Runtimes: {Math.round((cost.runtimesCost / cost.totalMonthlyCost) * 100)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-secondary/60" />
                        Addons: {Math.round((cost.addonsCost / cost.totalMonthlyCost) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bouton supprimer mobile (visible uniquement hors mode édition) */}
          {!isEditing && (
            <div className="sm:hidden mt-3 pt-3 border-t border-base-300/50">
              <button
                className="btn btn-ghost btn-sm text-error w-full justify-center gap-2 cursor-pointer"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={`Supprimer le projet ${activeProject.name}`}
              >
                <Icons.Trash className="w-4 h-4" />
                Supprimer ce projet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div
        role="tablist"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1 bg-base-200/50 rounded-2xl"
      >
        {/* Onglet Runtimes */}
        <button
          role="tab"
          aria-selected={activeTab === 'runtimes'}
          className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ease-out cursor-pointer
            ${activeTab === 'runtimes'
              ? 'bg-base-100 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
              : 'hover:bg-base-100/50 hover:shadow-md'
            }`}
          onClick={() => setActiveTab('runtimes')}
        >
          <div className={`flex items-center gap-2 transition-transform duration-300 ${activeTab === 'runtimes' ? 'scale-110' : 'group-hover:scale-105'}`}>
            <div className={`p-2 rounded-lg transition-colors duration-300 ${activeTab === 'runtimes' ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70 group-hover:bg-primary/20 group-hover:text-primary'}`}>
              <Icons.Server className="w-5 h-5" />
            </div>
            <span className={`font-semibold text-lg transition-colors duration-300 ${activeTab === 'runtimes' ? 'text-primary' : 'text-base-content/80 group-hover:text-base-content'}`}>
              Runtimes
            </span>
            <span className={`badge badge-sm transition-all duration-300 ${activeTab === 'runtimes' ? 'badge-primary' : 'badge-ghost group-hover:badge-primary/50'}`}>
              {activeProject.runtimes.length}
            </span>
          </div>
          <div className={`text-xs tabular-nums transition-all duration-300 ${activeTab === 'runtimes' ? 'text-primary font-medium' : 'text-base-content/50'}`}>
            {cost ? formatPrice(cost.runtimesCost) : '...'}/mois
          </div>
          {activeTab === 'runtimes' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
          )}
        </button>

        {/* Onglet Addons */}
        <button
          role="tab"
          aria-selected={activeTab === 'addons'}
          className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ease-out cursor-pointer
            ${activeTab === 'addons'
              ? 'bg-base-100 shadow-lg shadow-secondary/10 ring-2 ring-secondary/20'
              : 'hover:bg-base-100/50 hover:shadow-md'
            }`}
          onClick={() => setActiveTab('addons')}
        >
          <div className={`flex items-center gap-2 transition-transform duration-300 ${activeTab === 'addons' ? 'scale-110' : 'group-hover:scale-105'}`}>
            <div className={`p-2 rounded-lg transition-colors duration-300 ${activeTab === 'addons' ? 'bg-secondary text-secondary-content' : 'bg-base-300 text-base-content/70 group-hover:bg-secondary/20 group-hover:text-secondary'}`}>
              <Icons.Puzzle className="w-5 h-5" />
            </div>
            <span className={`font-semibold text-lg transition-colors duration-300 ${activeTab === 'addons' ? 'text-secondary' : 'text-base-content/80 group-hover:text-base-content'}`}>
              Addons
            </span>
            <span className={`badge badge-sm transition-all duration-300 ${activeTab === 'addons' ? 'badge-secondary' : 'badge-ghost group-hover:badge-secondary/50'}`}>
              {activeProject.addons.length}
            </span>
          </div>
          <div className={`text-xs tabular-nums transition-all duration-300 ${activeTab === 'addons' ? 'text-secondary font-medium' : 'text-base-content/50'}`}>
            {cost ? formatPrice(cost.addonsCost) : '...'}/mois
          </div>
          {activeTab === 'addons' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-secondary rounded-full" />
          )}
        </button>

        {/* Onglet Résumé */}
        <button
          role="tab"
          aria-selected={activeTab === 'summary'}
          className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ease-out cursor-pointer
            ${activeTab === 'summary'
              ? 'bg-base-100 shadow-lg shadow-accent/10 ring-2 ring-accent/20'
              : 'hover:bg-base-100/50 hover:shadow-md'
            }`}
          onClick={() => setActiveTab('summary')}
        >
          <div className={`flex items-center gap-2 transition-transform duration-300 ${activeTab === 'summary' ? 'scale-110' : 'group-hover:scale-105'}`}>
            <div className={`p-2 rounded-lg transition-colors duration-300 ${activeTab === 'summary' ? 'bg-accent text-accent-content' : 'bg-base-300 text-base-content/70 group-hover:bg-accent/20 group-hover:text-accent'}`}>
              <Icons.Chart className="w-5 h-5" />
            </div>
            <span className={`font-semibold text-lg transition-colors duration-300 ${activeTab === 'summary' ? 'text-accent' : 'text-base-content/80 group-hover:text-base-content'}`}>
              Résumé
            </span>
          </div>
          <div className={`text-xs tabular-nums transition-all duration-300 ${activeTab === 'summary' ? 'text-accent font-medium' : 'text-base-content/50'}`}>
            {cost ? formatPrice(cost.totalMonthlyCost) : '...'}/mois
          </div>
          {activeTab === 'summary' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'runtimes' && <RuntimeList projectId={activeProject.id} />}
      {activeTab === 'addons' && <AddonList projectId={activeProject.id} />}
      {activeTab === 'summary' && cost && <CostSummary cost={cost} />}

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
