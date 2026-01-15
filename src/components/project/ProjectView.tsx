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
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div
              className={`transition-all duration-200 ${
                isEditing ? 'bg-base-200 p-3 rounded-lg -mx-3' : ''
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    className="input input-bordered input-lg flex-1 max-w-md font-bold"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') setIsEditing(false)
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      className="btn btn-primary btn-sm gap-1"
                      onClick={handleSaveEdit}
                    >
                      <Icons.Check className="w-4 h-4" />
                      Sauvegarder
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsEditing(false)}
                      aria-label="Annuler"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    {activeProject.name}
                  </h1>
                  <button
                    className="btn btn-ghost btn-sm btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleStartEdit}
                    aria-label="Modifier le nom du projet"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-primary/10 px-4 py-2 border border-primary/20">
                <div className="text-xs text-base-content/70 uppercase tracking-wide">
                  Coût mensuel
                </div>
                <div className="text-2xl font-bold text-primary tabular-nums">
                  {cost ? formatPrice(cost.totalMonthlyCost) : '...'}
                </div>
              </div>
              <div className="tooltip tooltip-left" data-tip="Supprimer ce projet">
                <button
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label={`Supprimer le projet ${activeProject.name}`}
                >
                  <Icons.Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
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
