import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import {
  EmptyState,
  FilterDropdown,
  Icons,
  SearchInput,
  ViewToggle,
} from "@/components/ui";
import { type SortOption, useListFilters } from "@/hooks/useListFilters";
import { formatPrice } from "@/lib/costCalculator";
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

    return {
      total: project.addons.reduce((sum, addon) => sum + addon.monthlyPrice, 0),
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
  const hasSearchOrFilter = searchQuery !== "" || filterValue !== "all";

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

      {/* Barre d'outils (filtrage/tri) - visible si addons existent */}
      {hasAddons && (
        <div className="bg-base-100 border border-base-300">
          <div className="flex flex-col lg:flex-row gap-3 p-3">
            {/* Section gauche: Filtres et recherche */}
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
                placeholder="Rechercher un addon..."
                colorClass="secondary"
              />

              {/* Separateur visuel */}
              <div className="hidden sm:block w-px h-6 bg-base-300" />

              {/* Filtre par provider */}
              <FilterDropdown
                value={filterValue}
                options={filterOptions}
                onChange={setFilterValue}
                icon={<Icons.Puzzle className="w-4 h-4" />}
                label="Provider"
                allLabel="Tous les providers"
                colorClass="secondary"
              />

              {/* Tri avec dropdown */}
              <div className="dropdown dropdown-bottom">
                <button
                  type="button"
                  className={`btn btn-sm gap-2 cursor-pointer ${
                    sortBy !== "name"
                      ? "btn-accent"
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
                    {filteredAndSortedAddons.length}
                  </span>
                  <span>sur {project.addons.length}</span>
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
                colorClass="secondary"
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
                <span className="badge badge-sm gap-1 bg-secondary/10 text-secondary border-secondary/20">
                  Provider: {filterValue}
                  <button
                    type="button"
                    className="hover:text-error cursor-pointer"
                    onClick={() => setFilterValue("all")}
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
