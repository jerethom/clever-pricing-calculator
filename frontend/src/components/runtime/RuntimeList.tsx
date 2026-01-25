import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import {
  EmptyState,
  FilterDropdown,
  Icons,
  PriceRange,
  SearchInput,
  ViewToggle,
} from "@/components/ui";
import { useInstances } from "@/hooks/useInstances";
import { type SortOption, useListFilters } from "@/hooks/useListFilters";
import {
  buildFlavorPriceMap,
  calculateRuntimeCost,
  getAvailableFlavors,
} from "@/lib/costCalculator";
import { selectProjectById, useSelectorWith } from "@/store";
import { RuntimeCard } from "./RuntimeCard/index";

const RuntimeForm = lazy(() => import("./RuntimeForm"));

interface RuntimeListProps {
  projectId: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Par nom" },
  { value: "cost-desc", label: "Cout decroissant" },
  { value: "cost-asc", label: "Cout croissant" },
  { value: "instances", label: "Nb instances" },
];

export function RuntimeList({ projectId }: RuntimeListProps) {
  const project = useSelectorWith(selectProjectById, projectId);
  const { data: instances } = useInstances();
  const [showForm, setShowForm] = useState(false);

  const {
    searchQuery,
    sortBy,
    viewMode,
    filterValue,
    setSearchQuery,
    setSortBy,
    setViewMode,
    setFilterValue,
    clearSearch,
    resetAll,
    hasActiveFilters,
  } = useListFilters();

  // Handlers pour le formulaire
  const handleOpenForm = useCallback(() => setShowForm(true), []);
  const handleCloseForm = useCallback(() => setShowForm(false), []);

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

  // Options de filtre pour le dropdown
  const filterOptions = useMemo(() => {
    if (!project) return [];
    return instanceTypes.map((type) => ({
      value: type,
      label: type,
      count: project.runtimes.filter((r) => r.instanceType === type).length,
    }));
  }, [project, instanceTypes]);

  // Filtrage et tri des runtimes
  const filteredAndSortedRuntimes = useMemo(() => {
    let result = [...runtimesWithCosts];

    // Filtre par type
    if (filterValue !== "all") {
      result = result.filter(
        ({ runtime }) => runtime.instanceType === filterValue,
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
  }, [runtimesWithCosts, filterValue, searchQuery, sortBy]);

  // Handler pour reset recherche et filtre uniquement
  const handleResetSearchAndFilter = useCallback(() => {
    setSearchQuery("");
    setFilterValue("all");
  }, [setSearchQuery, setFilterValue]);

  if (!project) return null;

  const hasRuntimes = project.runtimes.length > 0;
  const hasSearchOrFilter = searchQuery !== "" || filterValue !== "all";

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
              {/* Estimation avec PriceRange */}
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icons.Chart className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-base-content/60 font-medium">
                  Estimation mensuelle totale
                </p>
              </div>

              {/* PriceRange standard */}
              <div className="w-full max-w-md justify-self-center">
                <PriceRange
                  min={costSummary.min}
                  estimated={costSummary.total}
                  max={costSummary.max}
                  size="md"
                  allowSingle
                />
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

      {/* Barre d'outils (filtrage/tri) - visible si runtimes existent */}
      {hasRuntimes && (
        <div className="bg-base-100 border border-base-300">
          <div className="flex flex-col lg:flex-row gap-3 p-3">
            {/* Section gauche: Filtres et recherche */}
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
                placeholder="Rechercher un runtime..."
                colorClass="primary"
              />

              {/* Separateur visuel */}
              <div className="hidden sm:block w-px h-6 bg-base-300" />

              {/* Filtre par type */}
              <FilterDropdown
                value={filterValue}
                options={filterOptions}
                onChange={setFilterValue}
                icon={<Icons.Server className="w-4 h-4" />}
                label="Type"
                allLabel="Tous les types"
                colorClass="primary"
              />

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
                    {SORT_OPTIONS.find((o) => o.value === sortBy)?.label ??
                      "Trier"}
                  </span>
                  <Icons.ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                <ul className="dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-10 w-48 p-2 mt-1">
                  {SORT_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        className={`cursor-pointer ${sortBy === option.value ? "active" : ""}`}
                        onClick={() => setSortBy(option.value)}
                      >
                        <Icons.Check
                          className={`w-4 h-4 ${sortBy === option.value ? "opacity-100" : "opacity-0"}`}
                        />
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton reset (visible si filtres actifs) */}
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-base-content/60 hover:text-error gap-1 cursor-pointer"
                  onClick={resetAll}
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
              {hasSearchOrFilter && (
                <div className="hidden md:flex items-center gap-2 text-sm text-base-content/60 px-2">
                  <span className="font-medium">
                    {filteredAndSortedRuntimes.length}
                  </span>
                  <span>sur {project.runtimes.length}</span>
                </div>
              )}

              {/* Separateur */}
              {hasSearchOrFilter && (
                <div className="hidden md:block w-px h-6 bg-base-300" />
              )}

              {/* Toggle vue */}
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                colorClass="primary"
              />
            </div>
          </div>

          {/* Barre d'indicateurs de filtres actifs */}
          {hasSearchOrFilter && (
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
                    onClick={clearSearch}
                    aria-label="Supprimer le filtre de recherche"
                  >
                    <Icons.X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterValue !== "all" && (
                <span className="badge badge-sm gap-1 bg-primary/10 text-primary border-primary/20">
                  Type: {filterValue}
                  <button
                    type="button"
                    className="hover:text-error cursor-pointer"
                    onClick={() => setFilterValue("all")}
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
        <EmptyState
          icon={<Icons.Server className="w-12 h-12 text-primary" />}
          title="Aucun runtime configure"
          description="Les runtimes sont les environnements d'execution de votre application (Node.js, Python, Java, etc.). Ajoutez-en un pour estimer vos couts."
          action={{
            label: "Ajouter votre premier runtime",
            onClick: handleOpenForm,
            variant: "primary",
          }}
          link={{
            label: "En savoir plus sur les runtimes Clever Cloud",
            href: "https://www.clever-cloud.com/doc/quickstart/",
          }}
          colorClass="primary"
        />
      ) : filteredAndSortedRuntimes.length === 0 ? (
        <EmptyState
          icon={<Icons.Search className="w-8 h-8 text-base-content/40" />}
          title="Aucun resultat"
          description="Aucun runtime ne correspond a vos criteres"
          action={{
            label: "Reinitialiser les filtres",
            onClick: handleResetSearchAndFilter,
          }}
          colorClass="primary"
        />
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
