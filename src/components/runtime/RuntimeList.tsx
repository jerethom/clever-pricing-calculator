import { useState, useMemo } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useInstances } from '@/hooks/useInstances'
import {
  calculateRuntimeCost,
  buildFlavorPriceMap,
  formatPrice,
} from '@/lib/costCalculator'
import { RuntimeCard } from './RuntimeCard'
import { RuntimeForm } from './RuntimeForm'
import { Icons } from '@/components/ui'

interface RuntimeListProps {
  projectId: string
}

type SortOption = 'name' | 'cost-asc' | 'cost-desc' | 'instances'
type ViewMode = 'grid' | 'compact'

export function RuntimeList({ projectId }: RuntimeListProps) {
  const project = useProjectStore(state => state.getProject(projectId))
  const { data: instances } = useInstances()
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Calcul des couts pour chaque runtime
  const runtimesWithCosts = useMemo(() => {
    if (!project || !instances) return []

    return project.runtimes.map(runtime => {
      const flavorPrices = buildFlavorPriceMap(instances, runtime.instanceType)
      const cost = calculateRuntimeCost(runtime, flavorPrices)
      return { runtime, cost }
    })
  }, [project, instances])

  // Resume des couts globaux
  const costSummary = useMemo(() => {
    if (runtimesWithCosts.length === 0) {
      return { total: 0, min: 0, max: 0, instances: 0 }
    }

    return runtimesWithCosts.reduce(
      (acc, { runtime, cost }) => ({
        total: acc.total + cost.totalMonthlyCost,
        min: acc.min + cost.minMonthlyCost,
        max: acc.max + cost.maxMonthlyCost,
        instances: acc.instances + runtime.defaultMaxInstances,
      }),
      { total: 0, min: 0, max: 0, instances: 0 }
    )
  }, [runtimesWithCosts])

  // Types d'instances uniques pour le filtre
  const instanceTypes = useMemo(() => {
    if (!project) return []
    const types = new Set(project.runtimes.map(r => r.instanceType))
    return Array.from(types).sort()
  }, [project])

  // Filtrage et tri des runtimes
  const filteredAndSortedRuntimes = useMemo(() => {
    let result = [...runtimesWithCosts]

    // Filtre par type
    if (filterType !== 'all') {
      result = result.filter(({ runtime }) => runtime.instanceType === filterType)
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        ({ runtime }) =>
          runtime.instanceName.toLowerCase().includes(query) ||
          runtime.instanceType.toLowerCase().includes(query)
      )
    }

    // Tri
    switch (sortBy) {
      case 'name':
        result.sort((a, b) =>
          a.runtime.instanceName.localeCompare(b.runtime.instanceName)
        )
        break
      case 'cost-asc':
        result.sort((a, b) => a.cost.totalMonthlyCost - b.cost.totalMonthlyCost)
        break
      case 'cost-desc':
        result.sort((a, b) => b.cost.totalMonthlyCost - a.cost.totalMonthlyCost)
        break
      case 'instances':
        result.sort(
          (a, b) => b.runtime.defaultMaxInstances - a.runtime.defaultMaxInstances
        )
        break
    }

    return result
  }, [runtimesWithCosts, filterType, searchQuery, sortBy])

  if (!project) return null

  const hasRuntimes = project.runtimes.length > 0
  const showToolbar = hasRuntimes && project.runtimes.length > 1

  // Calcul position jauge globale
  const gaugePosition =
    costSummary.max > costSummary.min
      ? ((costSummary.total - costSummary.min) /
          (costSummary.max - costSummary.min)) *
        100
      : 0

  return (
    <div className="space-y-4">
      {/* Header avec compteur et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Runtimes</h2>
          {hasRuntimes && (
            <span className="badge badge-neutral badge-sm">
              {project.runtimes.length}
            </span>
          )}
        </div>
        <button
          className="btn btn-primary btn-sm gap-2 group"
          onClick={() => setShowForm(true)}
        >
          <Icons.Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Ajouter un runtime</span>
        </button>
      </div>

      {/* Resume des couts (visible uniquement s'il y a des runtimes) */}
      {hasRuntimes && (
        <div className="card bg-gradient-to-r from-base-200 to-base-100 border border-base-300">
          <div className="card-body p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Cout total */}
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icons.Chart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-base-content/60 font-medium">
                    Estimation mensuelle totale
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(costSummary.total)}
                  </p>
                </div>
              </div>

              {/* Jauge min-max */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-xs text-base-content/60 mb-1">
                  <span>{formatPrice(costSummary.min)}</span>
                  <span>{formatPrice(costSummary.max)}</span>
                </div>
                <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, gaugePosition)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-base-content/50 mt-1">
                  <span>Base</span>
                  <span>Scaling 24/7</span>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="flex gap-4">
                <div className="text-center px-4 border-l border-base-300">
                  <p className="text-2xl font-bold">{project.runtimes.length}</p>
                  <p className="text-xs text-base-content/60">Runtime(s)</p>
                </div>
                <div className="text-center px-4 border-l border-base-300">
                  <p className="text-2xl font-bold">{costSummary.instances}</p>
                  <p className="text-xs text-base-content/60">Instance(s) max</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils (filtrage/tri) - visible si > 1 runtime */}
      {showToolbar && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-base-100 p-3 rounded-lg border border-base-300">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Recherche (visible si > 4 runtimes) */}
            {project.runtimes.length > 4 && (
              <label className="input input-sm input-bordered flex items-center gap-2 w-48">
                <svg
                  className="w-4 h-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  className="grow"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </label>
            )}

            {/* Filtre par type */}
            {instanceTypes.length > 1 && (
              <select
                className="select select-sm select-bordered"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">Tous les types</option>
                {instanceTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}

            {/* Tri */}
            <select
              className="select select-sm select-bordered"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="name">Trier par nom</option>
              <option value="cost-desc">Cout decroissant</option>
              <option value="cost-asc">Cout croissant</option>
              <option value="instances">Nb instances</option>
            </select>
          </div>

          {/* Toggle vue */}
          <div className="join">
            <button
              className={`btn btn-sm join-item ${viewMode === 'grid' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Vue grille"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              className={`btn btn-sm join-item ${viewMode === 'compact' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('compact')}
              aria-label="Vue compacte"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {!hasRuntimes ? (
        /* Etat vide ameliore */
        <div className="card bg-base-100 border border-dashed border-base-300 hover:border-primary/30 transition-colors">
          <div className="card-body items-center text-center py-16">
            {/* Illustration animee */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-base-200 p-6 rounded-full">
                <Icons.Server className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-base-content">
              Aucun runtime configure
            </h3>
            <p className="text-base-content/60 max-w-md">
              Les runtimes sont les environnements d'execution de votre
              application (Node.js, Python, Java, etc.). Ajoutez-en un pour
              estimer vos couts.
            </p>

            <div className="card-actions mt-6">
              <button
                className="btn btn-primary gap-2"
                onClick={() => setShowForm(true)}
              >
                <Icons.Plus className="w-5 h-5" />
                Ajouter votre premier runtime
              </button>
            </div>

            {/* Lien vers documentation */}
            <p className="text-xs text-base-content/40 mt-4">
              <a
                href="https://www.clever-cloud.com/doc/quickstart/"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover"
              >
                En savoir plus sur les runtimes Clever Cloud
              </a>
            </p>
          </div>
        </div>
      ) : filteredAndSortedRuntimes.length === 0 ? (
        /* Etat aucun resultat de recherche/filtre */
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body items-center text-center py-12">
            <div className="bg-base-200 p-4 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-base-content/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <p className="text-base-content/60">
              Aucun runtime ne correspond a vos criteres
            </p>
            <button
              className="btn btn-ghost btn-sm mt-2"
              onClick={() => {
                setFilterType('all')
                setSearchQuery('')
              }}
            >
              Reinitialiser les filtres
            </button>
          </div>
        </div>
      ) : (
        /* Grille de runtimes */
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'
              : 'flex flex-col gap-3'
          }
        >
          {filteredAndSortedRuntimes.map(({ runtime }, index) => (
            <div
              key={runtime.id}
              className="animate-in-up"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <RuntimeCard
                projectId={projectId}
                runtime={runtime}
              />
            </div>
          ))}
        </div>
      )}

      {/* Message indicatif si filtres actifs */}
      {hasRuntimes &&
        filteredAndSortedRuntimes.length > 0 &&
        filteredAndSortedRuntimes.length < project.runtimes.length && (
          <p className="text-sm text-base-content/50 text-center">
            Affichage de {filteredAndSortedRuntimes.length} sur{' '}
            {project.runtimes.length} runtime(s)
          </p>
        )}

      {/* Modal d'ajout de runtime */}
      {showForm && (
        <RuntimeForm projectId={projectId} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
