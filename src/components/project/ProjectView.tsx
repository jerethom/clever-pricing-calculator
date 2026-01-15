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
      <div role="tablist" className="tabs tabs-bordered tabs-lg">
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === 'runtimes' ? 'tab-active font-semibold' : ''}`}
          onClick={() => setActiveTab('runtimes')}
        >
          <Icons.Server className="w-5 h-5" />
          Runtimes
          <span className="badge badge-sm badge-primary">
            {activeProject.runtimes.length}
          </span>
        </button>
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === 'addons' ? 'tab-active font-semibold' : ''}`}
          onClick={() => setActiveTab('addons')}
        >
          <Icons.Puzzle className="w-5 h-5" />
          Addons
          <span className="badge badge-sm badge-secondary">
            {activeProject.addons.length}
          </span>
        </button>
        <button
          role="tab"
          className={`tab gap-2 ${activeTab === 'summary' ? 'tab-active font-semibold' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <Icons.Chart className="w-5 h-5" />
          Résumé des coûts
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
