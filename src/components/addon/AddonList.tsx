import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { AddonCard } from './AddonCard'
import { AddonForm } from './AddonForm'

interface AddonListProps {
  projectId: string
}

export function AddonList({ projectId }: AddonListProps) {
  const project = useProjectStore(state => state.getProject(projectId))
  const [showForm, setShowForm] = useState(false)

  if (!project) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Addons ({project.addons.length})</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(true)}
        >
          + Ajouter un addon
        </button>
      </div>

      {project.addons.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <p className="text-base-content/60">Aucun addon configuré</p>
            <p className="text-sm text-base-content/40">
              Ajoutez des addons comme PostgreSQL, Redis, etc.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {project.addons.map(addon => (
            <AddonCard key={addon.id} projectId={projectId} addon={addon} />
          ))}
        </div>
      )}

      {showForm && (
        <AddonForm projectId={projectId} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
