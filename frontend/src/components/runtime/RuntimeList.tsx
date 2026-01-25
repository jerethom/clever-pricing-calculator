import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { EmptyState, Icons, ListToolbar, PriceRange } from "@/components/ui";
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
          <div className="card-body p-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Label + Icone */}
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Icons.Chart className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-base-content/60 font-medium">
                  Estimation mensuelle
                </span>
              </div>

              {/* PriceRange + Stats */}
              <div className="flex items-center gap-6 flex-1 justify-end">
                <div className="w-full max-w-sm">
                  <PriceRange
                    min={costSummary.min}
                    estimated={costSummary.total}
                    max={costSummary.max}
                    size="sm"
                    allowSingle
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm border-l border-base-300 pl-4">
                  <span className="font-bold text-lg">
                    {costSummary.instances}
                  </span>
                  <span className="text-base-content/60">instance(s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils (filtrage/tri) - visible si runtimes existent */}
      {hasRuntimes && (
        <ListToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={clearSearch}
          searchPlaceholder="Rechercher un runtime..."
          filterValue={filterValue}
          filterOptions={filterOptions}
          onFilterChange={setFilterValue}
          filterIcon={<Icons.Server className="w-4 h-4" />}
          filterLabel="Type"
          filterAllLabel="Tous les types"
          sortBy={sortBy}
          sortOptions={SORT_OPTIONS}
          onSortChange={(value) => setSortBy(value as SortOption)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasActiveFilters={hasActiveFilters}
          onResetAll={resetAll}
          filteredCount={filteredAndSortedRuntimes.length}
          totalCount={project.runtimes.length}
          colorClass="primary"
        />
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
      <Suspense fallback={null}>
        <RuntimeForm
          isOpen={showForm}
          projectId={projectId}
          onClose={handleCloseForm}
        />
      </Suspense>
    </div>
  );
}
