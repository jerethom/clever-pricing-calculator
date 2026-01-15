import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { RuntimeCard } from './RuntimeCard'
import { RuntimeForm } from './RuntimeForm'

interface RuntimeListProps {
  projectId: string
}

export function RuntimeList({ projectId }: RuntimeListProps) {
  const project = useProjectStore(state => state.getProject(projectId))
  const [showForm, setShowForm] = useState(false)

  if (!project) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Runtimes ({project.runtimes.length})</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(true)}
        >
          + Ajouter un runtime
        </button>
      </div>

      {project.runtimes.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <p className="text-base-content/60">Aucun runtime configuré</p>
            <p className="text-sm text-base-content/40">
              Ajoutez un runtime pour commencer à calculer les coûts
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {project.runtimes.map(runtime => (
            <RuntimeCard
              key={runtime.id}
              projectId={projectId}
              runtime={runtime}
            />
          ))}
        </div>
      )}

      {showForm && (
        <RuntimeForm
          projectId={projectId}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
