import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Icons } from "@/components/ui";
import { useInstances } from "@/hooks/useInstances";
import {
  buildFlavorPriceMap,
  calculateRuntimeCost,
  formatPrice,
  getAvailableFlavors,
} from "@/lib/costCalculator";
import { selectProjectById, useSelectorWith } from "@/store";
import { RuntimeCard } from "./RuntimeCard/index";

const RuntimeForm = lazy(() => import("./RuntimeForm"));

interface RuntimeListProps {
  projectId: string;
}

type SortOption = "name" | "cost-asc" | "cost-desc" | "instances";
type ViewMode = "grid" | "compact";

export function RuntimeList({ projectId }: RuntimeListProps) {
  const project = useSelectorWith(selectProjectById, projectId);
  const { data: instances } = useInstances();
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calcul des couts pour chaque runtime
  const runtimesWithCosts = useMemo(() => {
    if (!project || !instances) return [];

    return project.runtimes.map((runtime) => {
      const flavorPrices = buildFlavorPriceMap(instances, runtime.instanceType);
      const availableFlavors = getAvailableFlavors(
        instances,
        runtime.instanceType,
      );
      const cost = calculateRuntimeCost(
        runtime,
        flavorPrices,
        availableFlavors,
      );
      return { runtime, cost };
    });
  }, [project, instances]);

  // Resume des couts globaux
  const costSummary = useMemo(() => {
    if (runtimesWithCosts.length === 0) {
      return { total: 0, min: 0, max: 0, instances: 0 };
    }

    return runtimesWithCosts.reduce(
      (acc, { cost }) => ({
        total: acc.total + cost.estimatedTotalCost,
        min: acc.min + cost.minMonthlyCost,
        max: acc.max + cost.maxMonthlyCost,
        instances: acc.instances + cost.baseInstances,
      }),
      { total: 0, min: 0, max: 0, instances: 0 },
    );
  }, [runtimesWithCosts]);

  // Types d'instances uniques pour le filtre
  const instanceTypes = useMemo(() => {
    if (!project) return [];
    const types = new Set(project.runtimes.map((r) => r.instanceType));
    return Array.from(types).sort();
  }, [project]);

  // Filtrage et tri des runtimes
  const filteredAndSortedRuntimes = useMemo(() => {
    let result = [...runtimesWithCosts];

    // Filtre par type
    if (filterType !== "all") {
      result = result.filter(
        ({ runtime }) => runtime.instanceType === filterType,
      );
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        ({ runtime }) =>
          runtime.instanceName.toLowerCase().includes(query) ||
          runtime.instanceType.toLowerCase().includes(query),
      );
    }

    // Tri
    switch (sortBy) {
      case "name":
        result.sort((a, b) =>
          a.runtime.instanceName.localeCompare(b.runtime.instanceName),
        );
        break;
      case "cost-asc":
        result.sort(
          (a, b) => a.cost.estimatedTotalCost - b.cost.estimatedTotalCost,
        );
        break;
      case "cost-desc":
        result.sort(
          (a, b) => b.cost.estimatedTotalCost - a.cost.estimatedTotalCost,
        );
        break;
      case "instances":
        result.sort((a, b) => b.cost.baseInstances - a.cost.baseInstances);
        break;
    }

    return result;
  }, [runtimesWithCosts, filterType, searchQuery, sortBy]);

  // Calcul position jauge globale (memoize)
  const gaugePosition = useMemo(() => {
    return costSummary.max > costSummary.min
      ? ((costSummary.total - costSummary.min) /
          (costSummary.max - costSummary.min)) *
          100
      : 0;
  }, [costSummary.total, costSummary.min, costSummary.max]);

  // Handlers de filtrage/tri (useCallback pour eviter re-renders des enfants)
  const handleOpenForm = useCallback(() => {
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleFilterTypeChange = useCallback((type: string) => {
    setFilterType(type);
  }, []);

  const handleClearFilterType = useCallback(() => {
    setFilterType("all");
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterType("all");
    setSearchQuery("");
    setSortBy("name");
  }, []);

  const handleResetSearchAndFilter = useCallback(() => {
    setFilterType("all");
    setSearchQuery("");
  }, []);

  if (!project) return null;

  const hasRuntimes = project.runtimes.length > 0;
  const showToolbar = hasRuntimes;

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
          type="button"
          className="btn btn-primary btn-sm gap-2 group"
          onClick={handleOpenForm}
        >
          <Icons.Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Ajouter un runtime</span>
        </button>
      </div>

      {/* Resume des couts (visible uniquement s'il y a des runtimes) */}
      {hasRuntimes && (
        <div className="card bg-gradient-to-r from-base-200 to-base-100 border border-base-300">
          <div className="card-body p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
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
              <div className="w-full max-w-md justify-self-center">
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
              <div className="justify-self-center lg:justify-self-end">
                <div className="text-center px-4 lg:border-l border-base-300">
                  <p className="text-2xl font-bold">{costSummary.instances}</p>
                  <p className="text-xs text-base-content/60">
                    Instance(s) max
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils (filtrage/tri) - visible si > 1 runtime */}
      {showToolbar && (
        <div className="bg-base-100 border border-base-300">
          <div className="flex flex-col lg:flex-row gap-3 p-3">
            {/* Section gauche: Filtres et recherche */}
            <div className="flex flex-wrap gap-2 items-center flex-1">
              {/* Recherche */}
              <div className="relative">
                <label className="input input-sm input-bordered flex items-center gap-2 w-52 pr-8 transition-all focus-within:border-primary focus-within:shadow-sm">
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
                    placeholder="Rechercher un runtime..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </label>
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs p-0 h-5 w-5 min-h-0 hover:bg-base-300"
                    onClick={handleClearSearch}
                    aria-label="Effacer la recherche"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Séparateur visuel */}
              <div className="hidden sm:block w-px h-6 bg-base-300" />

              {/* Filtre par type avec dropdown */}
              <div className="dropdown dropdown-bottom">
                <button
                  type="button"
                  className={`btn btn-sm gap-2 cursor-pointer ${
                    filterType !== "all"
                      ? "btn-primary"
                      : "btn-ghost border border-base-300 hover:border-base-content/20"
                  }`}
                >
                  <Icons.Server className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {filterType === "all" ? "Type" : filterType}
                  </span>
                  {filterType !== "all" && (
                    <span className="sm:hidden">{filterType}</span>
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
                </button>
                <ul className="dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-10 w-52 p-2 mt-1">
                  <li>
                    <button
                      type="button"
                      className={`cursor-pointer ${filterType === "all" ? "active" : ""}`}
                      onClick={handleClearFilterType}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${filterType === "all" ? "opacity-100" : "opacity-0"}`}
                      />
                      Tous les types
                      <span className="badge badge-sm badge-ghost ml-auto">
                        {project.runtimes.length}
                      </span>
                    </button>
                  </li>
                  <li className="menu-title mt-2">
                    <span>Types disponibles</span>
                  </li>
                  {instanceTypes.map((type) => {
                    const count = project.runtimes.filter(
                      (r) => r.instanceType === type,
                    ).length;
                    return (
                      <li key={type}>
                        <button
                          type="button"
                          className={`cursor-pointer ${filterType === type ? "active" : ""}`}
                          onClick={() => handleFilterTypeChange(type)}
                        >
                          <Icons.Check
                            className={`w-4 h-4 ${filterType === type ? "opacity-100" : "opacity-0"}`}
                          />
                          {type}
                          <span className="badge badge-sm badge-ghost ml-auto">
                            {count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Tri avec dropdown */}
              <div className="dropdown dropdown-bottom">
                <button
                  type="button"
                  className={`btn btn-sm gap-2 cursor-pointer ${
                    sortBy !== "name"
                      ? "btn-secondary"
                      : "btn-ghost border border-base-300 hover:border-base-content/20"
                  }`}
                >
                  <Icons.Chart className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {sortBy === "name" && "Trier"}
                    {sortBy === "cost-desc" && "Coût max"}
                    {sortBy === "cost-asc" && "Coût min"}
                    {sortBy === "instances" && "Instances"}
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
                </button>
                <ul className="dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-10 w-48 p-2 mt-1">
                  <li>
                    <button
                      type="button"
                      className={`cursor-pointer ${sortBy === "name" ? "active" : ""}`}
                      onClick={() => handleSortChange("name")}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${sortBy === "name" ? "opacity-100" : "opacity-0"}`}
                      />
                      Par nom
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`cursor-pointer ${sortBy === "cost-desc" ? "active" : ""}`}
                      onClick={() => handleSortChange("cost-desc")}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${sortBy === "cost-desc" ? "opacity-100" : "opacity-0"}`}
                      />
                      Coût décroissant
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`cursor-pointer ${sortBy === "cost-asc" ? "active" : ""}`}
                      onClick={() => handleSortChange("cost-asc")}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${sortBy === "cost-asc" ? "opacity-100" : "opacity-0"}`}
                      />
                      Coût croissant
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`cursor-pointer ${sortBy === "instances" ? "active" : ""}`}
                      onClick={() => handleSortChange("instances")}
                    >
                      <Icons.Check
                        className={`w-4 h-4 ${sortBy === "instances" ? "opacity-100" : "opacity-0"}`}
                      />
                      Nb instances
                    </button>
                  </li>
                </ul>
              </div>

              {/* Bouton reset (visible si filtres actifs) */}
              {(filterType !== "all" || searchQuery || sortBy !== "name") && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-base-content/60 hover:text-error gap-1 cursor-pointer"
                  onClick={handleResetFilters}
                  aria-label="Réinitialiser tous les filtres"
                >
                  <Icons.X className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            {/* Section droite: Toggle vue + indicateur filtres */}
            <div className="flex items-center gap-3">
              {/* Indicateur de filtres actifs */}
              {(filterType !== "all" || searchQuery) && (
                <div className="hidden md:flex items-center gap-2 text-sm text-base-content/60 px-2">
                  <span className="font-medium">
                    {filteredAndSortedRuntimes.length}
                  </span>
                  <span>sur {project.runtimes.length}</span>
                </div>
              )}

              {/* Séparateur */}
              {(filterType !== "all" || searchQuery) && (
                <div className="hidden md:block w-px h-6 bg-base-300" />
              )}

              {/* Toggle vue */}
              <div
                className="join border border-base-300"
                aria-label="Mode d'affichage"
              >
                <div className="tooltip tooltip-bottom" data-tip="Vue grille">
                  <button
                    type="button"
                    className={`btn btn-sm join-item border-0 cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-content hover:bg-primary/90"
                        : "bg-base-100 hover:bg-base-200"
                    }`}
                    onClick={() => handleViewModeChange("grid")}
                    aria-label="Vue grille"
                    aria-pressed={viewMode === "grid"}
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
                    type="button"
                    className={`btn btn-sm join-item border-0 cursor-pointer ${
                      viewMode === "compact"
                        ? "bg-primary text-primary-content hover:bg-primary/90"
                        : "bg-base-100 hover:bg-base-200"
                    }`}
                    onClick={() => handleViewModeChange("compact")}
                    aria-label="Vue liste"
                    aria-pressed={viewMode === "compact"}
                  >
                    <Icons.Menu className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Barre d'indicateurs de filtres actifs */}
          {(filterType !== "all" || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-base-200/50 border-t border-base-300">
              <span className="text-xs text-base-content/50 uppercase tracking-wide">
                Filtres:
              </span>
              {searchQuery && (
                <span className="badge badge-sm gap-1 bg-base-100">
                  Recherche: "{searchQuery}"
                  <button
                    type="button"
                    className="hover:text-error cursor-pointer"
                    onClick={handleClearSearch}
                    aria-label="Supprimer le filtre de recherche"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterType !== "all" && (
                <span className="badge badge-sm gap-1 bg-primary/10 text-primary border-primary/20">
                  Type: {filterType}
                  <button
                    type="button"
                    className="hover:text-error cursor-pointer"
                    onClick={handleClearFilterType}
                    aria-label="Supprimer le filtre de type"
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
                type="button"
                className="btn btn-primary gap-2"
                onClick={handleOpenForm}
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
                aria-hidden="true"
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
              type="button"
              className="btn btn-ghost btn-sm mt-2"
              onClick={handleResetSearchAndFilter}
            >
              Reinitialiser les filtres
            </button>
          </div>
        </div>
      ) : (
        /* Grille de runtimes */
        <div className="@container">
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 grid-cols-1 @7xl:grid-cols-2"
                : "flex flex-col gap-3"
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
                <RuntimeCard projectId={projectId} runtime={runtime} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message indicatif si filtres actifs */}
      {hasRuntimes &&
        filteredAndSortedRuntimes.length > 0 &&
        filteredAndSortedRuntimes.length < project.runtimes.length && (
          <p className="text-sm text-base-content/50 text-center">
            Affichage de {filteredAndSortedRuntimes.length} sur{" "}
            {project.runtimes.length} runtime(s)
          </p>
        )}

      {/* Modal d'ajout de runtime */}
      {showForm && (
        <Suspense fallback={null}>
          <RuntimeForm projectId={projectId} onClose={handleCloseForm} />
        </Suspense>
      )}
    </div>
  );
}
