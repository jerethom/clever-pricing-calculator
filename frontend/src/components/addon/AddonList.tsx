import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { EmptyState, Icons, ListToolbar, PriceRange } from "@/components/ui";
import { type SortOption, useListFilters } from "@/hooks/useListFilters";
import { calculateAddonCost } from "@/lib/addonCostCalculator";
import { selectProjectById, useSelectorWith } from "@/store";
import { AddonCard } from "./AddonCard";

const AddonForm = lazy(() => import("./AddonForm"));

interface AddonListProps {
  projectId: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Par nom" },
  { value: "cost-desc", label: "Cout decroissant" },
  { value: "cost-asc", label: "Cout croissant" },
];

export function AddonList({ projectId }: AddonListProps) {
  const project = useSelectorWith(selectProjectById, projectId);
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

  // Resume des couts des addons
  const costSummary = useMemo(() => {
    if (!project || project.addons.length === 0) {
      return { total: 0, count: 0 };
    }

    let total = 0;
    for (const addon of project.addons) {
      const cost = calculateAddonCost(addon);
      total += cost.monthlyPrice;
    }

    return {
      total: Math.round(total * 100) / 100,
      count: project.addons.length,
    };
  }, [project]);

  // Providers uniques pour le filtre
  const providers = useMemo(() => {
    if (!project) return [];
    const providerSet = new Set(project.addons.map((a) => a.providerName));
    return Array.from(providerSet).sort();
  }, [project]);

  // Options de filtre pour le dropdown
  const filterOptions = useMemo(() => {
    if (!project) return [];
    return providers.map((provider) => ({
      value: provider,
      label: provider,
      count: project.addons.filter((a) => a.providerName === provider).length,
    }));
  }, [project, providers]);

  // Filtrage et tri des addons
  const filteredAndSortedAddons = useMemo(() => {
    if (!project) return [];

    let result = [...project.addons];

    // Filtre par provider
    if (filterValue !== "all") {
      result = result.filter((addon) => addon.providerName === filterValue);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (addon) =>
          addon.providerName.toLowerCase().includes(query) ||
          addon.planName.toLowerCase().includes(query),
      );
    }

    // Tri
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.providerName.localeCompare(b.providerName));
        break;
      case "cost-asc":
        result.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        break;
      case "cost-desc":
        result.sort((a, b) => b.monthlyPrice - a.monthlyPrice);
        break;
    }

    return result;
  }, [project, filterValue, searchQuery, sortBy]);

  // Handler pour reset recherche et filtre uniquement
  const handleResetSearchAndFilter = useCallback(() => {
    setSearchQuery("");
    setFilterValue("all");
  }, [setSearchQuery, setFilterValue]);

  if (!project) return null;

  const hasAddons = project.addons.length > 0;

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
          type="button"
          className="btn btn-secondary btn-sm gap-2 group"
          onClick={handleOpenForm}
        >
          <Icons.Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span>Ajouter un addon</span>
        </button>
      </div>

      {/* Resume des couts (visible uniquement s'il y a des addons) */}
      {hasAddons && (
        <div className="card bg-gradient-to-r from-base-200 to-base-100 border border-base-300">
          <div className="card-body p-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Label + Icone */}
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <Icons.Puzzle className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-sm text-base-content/60 font-medium">
                  Estimation mensuelle
                </span>
              </div>

              {/* PriceRange + Stats */}
              <div className="flex items-center gap-6 flex-1 justify-end">
                <div className="w-full max-w-sm">
                  <PriceRange
                    min={costSummary.total}
                    estimated={costSummary.total}
                    max={costSummary.total}
                    size="sm"
                    allowSingle
                  />
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm border-l border-base-300 pl-4">
                  <span className="font-bold text-lg">{costSummary.count}</span>
                  <span className="text-base-content/60">addon(s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils (filtrage/tri) - visible si addons existent */}
      {hasAddons && (
        <ListToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={clearSearch}
          searchPlaceholder="Rechercher un addon..."
          filterValue={filterValue}
          filterOptions={filterOptions}
          onFilterChange={setFilterValue}
          filterIcon={<Icons.Puzzle className="w-4 h-4" />}
          filterLabel="Provider"
          filterAllLabel="Tous les providers"
          sortBy={sortBy}
          sortOptions={SORT_OPTIONS}
          onSortChange={(value) => setSortBy(value as SortOption)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasActiveFilters={hasActiveFilters}
          onResetAll={resetAll}
          filteredCount={filteredAndSortedAddons.length}
          totalCount={project.addons.length}
          colorClass="secondary"
        />
      )}

      {/* Contenu principal */}
      {!hasAddons ? (
        <EmptyState
          icon={<Icons.Puzzle className="w-12 h-12 text-secondary" />}
          title="Aucun addon configure"
          description="Les addons sont des services complementaires comme les bases de donnees (PostgreSQL, MySQL), le cache (Redis), le stockage, etc. Ajoutez-en un pour estimer vos couts."
          action={{
            label: "Ajouter votre premier addon",
            onClick: handleOpenForm,
            variant: "secondary",
          }}
          link={{
            label: "En savoir plus sur les addons Clever Cloud",
            href: "https://www.clever-cloud.com/doc/addons/",
          }}
          colorClass="secondary"
        />
      ) : filteredAndSortedAddons.length === 0 ? (
        <EmptyState
          icon={<Icons.Search className="w-8 h-8 text-base-content/40" />}
          title="Aucun resultat"
          description="Aucun addon ne correspond a vos criteres"
          action={{
            label: "Reinitialiser les filtres",
            onClick: handleResetSearchAndFilter,
          }}
          colorClass="secondary"
        />
      ) : (
        /* Grille d'addons */
        <div className="@container">
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 grid-cols-1 @7xl:grid-cols-2"
                : "flex flex-col gap-3"
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
        </div>
      )}

      {/* Message indicatif si filtres actifs */}
      {hasAddons &&
        filteredAndSortedAddons.length > 0 &&
        filteredAndSortedAddons.length < project.addons.length && (
          <p className="text-sm text-base-content/50 text-center">
            Affichage de {filteredAndSortedAddons.length} sur{" "}
            {project.addons.length} addon(s)
          </p>
        )}

      {/* Modal d'ajout d'addon */}
      {showForm && (
        <Suspense fallback={null}>
          <AddonForm projectId={projectId} onClose={handleCloseForm} />
        </Suspense>
      )}
    </div>
  );
}
