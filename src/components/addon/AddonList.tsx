import { useState, useMemo } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { formatPrice } from '@/lib/costCalculator'
import { AddonCard } from './AddonCard'
import { AddonForm } from './AddonForm'
import { Icons } from '@/components/ui'

interface AddonListProps {
  projectId: string
}

type SortOption = 'name' | 'cost-asc' | 'cost-desc'
type ViewMode = 'grid' | 'compact'

export function AddonList({ projectId }: AddonListProps) {
  const project = useProjectStore(state => state.getProject(projectId))
  const [showForm, setShowForm] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Resume des couts des addons
  const costSummary = useMemo(() => {
    if (!project || project.addons.length === 0) {
      return { total: 0, count: 0 }
    }

    return {
      total: project.addons.reduce((sum, addon) => sum + addon.monthlyPrice, 0),
      count: project.addons.length,
    }
  }, [project])

  // Providers uniques pour le filtre
  const providers = useMemo(() => {
    if (!project) return []
    const providerSet = new Set(project.addons.map(a => a.providerName))
    return Array.from(providerSet).sort()
  }, [project])

  // Filtrage et tri des addons
  const filteredAndSortedAddons = useMemo(() => {
    if (!project) return []

    let result = [...project.addons]

    // Filtre par provider
    if (filterProvider !== 'all') {
      result = result.filter(addon => addon.providerName === filterProvider)
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        addon =>
          addon.providerName.toLowerCase().includes(query) ||
          addon.planName.toLowerCase().includes(query)
      )
    }

    // Tri
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.providerName.localeCompare(b.providerName))
        break
      case 'cost-asc':
        result.sort((a, b) => a.monthlyPrice - b.monthlyPrice)
        break
      case 'cost-desc':
        result.sort((a, b) => b.monthlyPrice - a.monthlyPrice)
        break
    }

    return result
  }, [project, filterProvider, searchQuery, sortBy])

  if (!project) return null

  const hasAddons = project.addons.length > 0
  const showToolbar = hasAddons

  return (
    <div className="space-y-4">
      {/* Header avec compteur et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Addons</h2>
          {hasAddons && (
            <span className="badge badge-neutral badge-sm">
              {project.addons.length}
            </span>
          )}
        </div>
        <button
          className="btn btn-secondary btn-sm gap-2 group"
          onClick={() => setShowForm(true)}
        >
          <Icons.Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Ajouter un addon</span>
        </button>
      </div>

      {/* Resume des couts (visible uniquement s'il y a des addons) */}
      {hasAddons && (
        <div className="card bg-gradient-to-r from-base-200 to-base-100 border border-base-300">
          <div className="card-body p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Cout total */}
              <div className="flex items-center gap-4">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Icons.Puzzle className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-base-content/60 font-medium">
                    Cout mensuel total
                  </p>
                  <p className="text-2xl font-bold text-secondary">
                    {formatPrice(costSummary.total)}
                  </p>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="flex gap-4">
                <div className="text-center px-4 border-l border-base-300">
                  <p className="text-2xl font-bold">{providers.length}</p>
                  <p className="text-xs text-base-content/60">Provider(s)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils (filtrage/tri) - visible si addons presents */}
      {showToolbar && (
        <div className="bg-base-100 border border-base-300">
          <div className="flex flex-col lg:flex-row gap-3 p-3">
            {/* Section gauche: Filtres et recherche */}
            <div className="flex flex-wrap gap-2 items-center flex-1">
              {/* Recherche */}
              <div className="relative">
                <label className="input input-sm input-bordered flex items-center gap-2 w-52 pr-8 transition-all focus-within:border-secondary focus-within:shadow-sm">
                  <svg
                    className="w-4 h-4 text-base-content/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                    className="grow bg-transparent"
                    placeholder="Rechercher un addon..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </label>
                {searchQuery && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs p-0 h-5 w-5 min-h-0 hover:bg-base-300"
                    onClick={() => setSearchQuery('')}
                    aria-label="Effacer la recherche"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Separateur visuel */}
              <div className="hidden sm:block w-px h-6 bg-base-300" />

              {/* Filtre par provider avec dropdown */}
              <div className="dropdown dropdown-bottom">
                <div
                  tabIndex={0}
                  role="button"
                  className={`btn btn-sm gap-2 cursor-pointer ${
                    filterProvider !== 'all'
                      ? 'btn-secondary'
                      : 'btn-ghost border border-base-300 hover:border-base-content/20'
                  }`}
                >
                  <Icons.Puzzle className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {filterProvider === 'all' ? 'Provider' : filterProvider}
                  </span>
                  {filterProvider !== 'all' && (
                    <span className="sm:hidden">{filterProvider}</span>
                  )}
                  <svg
                    className="w-3 h-3 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-10 w-52 p-2 mt-1"
                >
                  <li>
                    <button
                      className={`cursor-pointer ${filterProvider === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterProvider('all')}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${filterProvider === 'all' ? 'opacity-100' : 'opacity-0'}`}
                      />
                      Tous les providers
                      <span className="badge badge-sm badge-ghost ml-auto">
                        {project.addons.length}
                      </span>
                    </button>
                  </li>
                  <li className="menu-title mt-2">
                    <span>Providers disponibles</span>
                  </li>
                  {providers.map(provider => {
                    const count = project.addons.filter(
                      a => a.providerName === provider
                    ).length
                    return (
                      <li key={provider}>
                        <button
                          className={`cursor-pointer ${filterProvider === provider ? 'active' : ''}`}
                          onClick={() => setFilterProvider(provider)}
                        >
                          <Icons.Check
                            className={`w-4 h-4 ${filterProvider === provider ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {provider}
                          <span className="badge badge-sm badge-ghost ml-auto">
                            {count}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Tri avec dropdown */}
              <div className="dropdown dropdown-bottom">
                <div
                  tabIndex={0}
                  role="button"
                  className={`btn btn-sm gap-2 cursor-pointer ${
                    sortBy !== 'name'
                      ? 'btn-accent'
                      : 'btn-ghost border border-base-300 hover:border-base-content/20'
                  }`}
                >
                  <Icons.Chart className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {sortBy === 'name' && 'Trier'}
                    {sortBy === 'cost-desc' && 'Cout max'}
                    {sortBy === 'cost-asc' && 'Cout min'}
                  </span>
                  <svg
                    className="w-3 h-3 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-10 w-48 p-2 mt-1"
                >
                  <li>
                    <button
                      className={`cursor-pointer ${sortBy === 'name' ? 'active' : ''}`}
                      onClick={() => setSortBy('name')}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${sortBy === 'name' ? 'opacity-100' : 'opacity-0'}`}
                      />
                      Par nom
                    </button>
                  </li>
                  <li>
                    <button
                      className={`cursor-pointer ${sortBy === 'cost-desc' ? 'active' : ''}`}
                      onClick={() => setSortBy('cost-desc')}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${sortBy === 'cost-desc' ? 'opacity-100' : 'opacity-0'}`}
                      />
                      Cout decroissant
                    </button>
                  </li>
                  <li>
                    <button
                      className={`cursor-pointer ${sortBy === 'cost-asc' ? 'active' : ''}`}
                      onClick={() => setSortBy('cost-asc')}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${sortBy === 'cost-asc' ? 'opacity-100' : 'opacity-0'}`}
                      />
                      Cout croissant
                    </button>
                  </li>
                </ul>
              </div>

              {/* Bouton reset (visible si filtres actifs) */}
              {(filterProvider !== 'all' || searchQuery || sortBy !== 'name') && (
                <button
                  className="btn btn-sm btn-ghost text-base-content/60 hover:text-error gap-1 cursor-pointer"
                  onClick={() => {
                    setFilterProvider('all')
                    setSearchQuery('')
                    setSortBy('name')
                  }}
                  aria-label="Reinitialiser tous les filtres"
                >
                  <Icons.X className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            {/* Section droite: Toggle vue + indicateur filtres */}
            <div className="flex items-center gap-3">
              {/* Indicateur de filtres actifs */}
              {(filterProvider !== 'all' || searchQuery) && (
                <div className="hidden md:flex items-center gap-2 text-sm text-base-content/60 px-2">
                  <span className="font-medium">
                    {filteredAndSortedAddons.length}
                  </span>
                  <span>sur {project.addons.length}</span>
                </div>
              )}

              {/* Separateur */}
              {(filterProvider !== 'all' || searchQuery) && (
                <div className="hidden md:block w-px h-6 bg-base-300" />
              )}

              {/* Toggle vue */}
              <div
                className="join border border-base-300"
                role="group"
                aria-label="Mode d'affichage"
              >
                <div className="tooltip tooltip-bottom" data-tip="Vue grille">
                  <button
                    className={`btn btn-sm join-item border-0 cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-secondary text-secondary-content hover:bg-secondary/90'
                        : 'bg-base-100 hover:bg-base-200'
                    }`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Vue grille"
                    aria-pressed={viewMode === 'grid'}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                </div>
                <div className="tooltip tooltip-bottom" data-tip="Vue liste">
                  <button
                    className={`btn btn-sm join-item border-0 cursor-pointer ${
                      viewMode === 'compact'
                        ? 'bg-secondary text-secondary-content hover:bg-secondary/90'
                        : 'bg-base-100 hover:bg-base-200'
                    }`}
                    onClick={() => setViewMode('compact')}
                    aria-label="Vue liste"
                    aria-pressed={viewMode === 'compact'}
                  >
                    <Icons.Menu className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Barre d'indicateurs de filtres actifs */}
          {(filterProvider !== 'all' || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-base-200/50 border-t border-base-300">
              <span className="text-xs text-base-content/50 uppercase tracking-wide">
                Filtres:
              </span>
              {searchQuery && (
                <span className="badge badge-sm gap-1 bg-base-100">
                  Recherche: "{searchQuery}"
                  <button
                    className="hover:text-error cursor-pointer"
                    onClick={() => setSearchQuery('')}
                    aria-label="Supprimer le filtre de recherche"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterProvider !== 'all' && (
                <span className="badge badge-sm gap-1 bg-secondary/10 text-secondary border-secondary/20">
                  Provider: {filterProvider}
                  <button
                    className="hover:text-error cursor-pointer"
                    onClick={() => setFilterProvider('all')}
                    aria-label="Supprimer le filtre de provider"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenu principal */}
      {!hasAddons ? (
        /* Etat vide ameliore */
        <div className="card bg-base-100 border border-dashed border-base-300 hover:border-secondary/30 transition-colors">
          <div className="card-body items-center text-center py-16">
            {/* Illustration animee */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-base-200 p-6 rounded-full">
                <Icons.Puzzle className="w-12 h-12 text-secondary" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-base-content">
              Aucun addon configure
            </h3>
            <p className="text-base-content/60 max-w-md">
              Les addons sont des services complementaires comme les bases de
              donnees (PostgreSQL, MySQL), le cache (Redis), le stockage, etc.
              Ajoutez-en un pour estimer vos couts.
            </p>

            <div className="card-actions mt-6">
              <button
                className="btn btn-secondary gap-2"
                onClick={() => setShowForm(true)}
              >
                <Icons.Plus className="w-5 h-5" />
                Ajouter votre premier addon
              </button>
            </div>

            {/* Lien vers documentation */}
            <p className="text-xs text-base-content/40 mt-4">
              <a
                href="https://www.clever-cloud.com/doc/addons/"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-hover"
              >
                En savoir plus sur les addons Clever Cloud
              </a>
            </p>
          </div>
        </div>
      ) : filteredAndSortedAddons.length === 0 ? (
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
              Aucun addon ne correspond a vos criteres
            </p>
            <button
              className="btn btn-ghost btn-sm mt-2"
              onClick={() => {
                setFilterProvider('all')
                setSearchQuery('')
              }}
            >
              Reinitialiser les filtres
            </button>
          </div>
        </div>
      ) : (
        /* Grille d'addons */
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'
              : 'flex flex-col gap-3'
          }
        >
          {filteredAndSortedAddons.map((addon, index) => (
            <div
              key={addon.id}
              className="animate-in-up"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <AddonCard projectId={projectId} addon={addon} />
            </div>
          ))}
        </div>
      )}

      {/* Message indicatif si filtres actifs */}
      {hasAddons &&
        filteredAndSortedAddons.length > 0 &&
        filteredAndSortedAddons.length < project.addons.length && (
          <p className="text-sm text-base-content/50 text-center">
            Affichage de {filteredAndSortedAddons.length} sur{' '}
            {project.addons.length} addon(s)
          </p>
        )}

      {/* Modal d'ajout d'addon */}
      {showForm && (
        <AddonForm projectId={projectId} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
