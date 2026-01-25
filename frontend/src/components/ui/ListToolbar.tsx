import { memo, type ReactNode } from "react";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";
import { Icons } from "./Icons";
import { SearchInput } from "./SearchInput";
import { ViewToggle } from "./ViewToggle";

interface SortOption {
  value: string;
  label: string;
}

interface ListToolbarProps {
  // Recherche
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  searchPlaceholder?: string;

  // Filtre
  filterValue: string;
  filterOptions: FilterOption[];
  onFilterChange: (value: string) => void;
  filterIcon: ReactNode;
  filterLabel: string;
  filterAllLabel?: string;

  // Tri
  sortBy: string;
  sortOptions: SortOption[];
  onSortChange: (value: string) => void;

  // Vue
  viewMode: "grid" | "compact";
  onViewModeChange: (mode: "grid" | "compact") => void;

  // Reset
  hasActiveFilters: boolean;
  onResetAll: () => void;

  // Compteurs pour l'indicateur
  filteredCount?: number;
  totalCount?: number;

  // Style
  colorClass?: "primary" | "secondary";
}

export const ListToolbar = memo(function ListToolbar({
  // Recherche
  searchQuery,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Rechercher...",

  // Filtre
  filterValue,
  filterOptions,
  onFilterChange,
  filterIcon,
  filterLabel,
  filterAllLabel = "Tous",

  // Tri
  sortBy,
  sortOptions,
  onSortChange,

  // Vue
  viewMode,
  onViewModeChange,

  // Reset
  hasActiveFilters,
  onResetAll,

  // Compteurs
  filteredCount,
  totalCount,

  // Style
  colorClass = "primary",
}: ListToolbarProps) {
  const hasSearchOrFilter = searchQuery !== "" || filterValue !== "all";
  const showCountIndicator =
    hasSearchOrFilter &&
    filteredCount !== undefined &&
    totalCount !== undefined;

  // Classe pour le tri actif (utilise accent pour se distinguer du filtre)
  const sortActiveClass =
    colorClass === "primary" ? "btn-secondary" : "btn-accent";

  // Classe pour les badges de filtre actifs
  const filterBadgeClass =
    colorClass === "primary"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-secondary/10 text-secondary border-secondary/20";

  return (
    <div className="bg-base-100 border border-base-300">
      <div className="flex flex-col lg:flex-row gap-3 p-3">
        {/* Section gauche: Filtres et recherche */}
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onSearchClear}
            placeholder={searchPlaceholder}
            colorClass={colorClass}
          />

          {/* Separateur visuel */}
          <div className="hidden sm:block w-px h-6 bg-base-300" />

          {/* Filtre par categorie */}
          <FilterDropdown
            value={filterValue}
            options={filterOptions}
            onChange={onFilterChange}
            icon={filterIcon}
            label={filterLabel}
            allLabel={filterAllLabel}
            colorClass={colorClass}
          />

          {/* Tri avec dropdown */}
          <div className="dropdown dropdown-bottom">
            <button
              type="button"
              className={`btn btn-sm gap-2 cursor-pointer ${
                sortBy !== sortOptions[0]?.value
                  ? sortActiveClass
                  : "btn-ghost border border-base-300 hover:border-base-content/20"
              }`}
            >
              <Icons.Chart className="w-4 h-4" />
              <span className="hidden sm:inline">
                {sortOptions.find((o) => o.value === sortBy)?.label ?? "Trier"}
              </span>
              <Icons.ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            <ul className="dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-10 w-48 p-2 mt-1">
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`cursor-pointer ${sortBy === option.value ? "active" : ""}`}
                    onClick={() => onSortChange(option.value)}
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
              onClick={onResetAll}
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
          {showCountIndicator && (
            <div className="hidden md:flex items-center gap-2 text-sm text-base-content/60 px-2">
              <span className="font-medium">{filteredCount}</span>
              <span>sur {totalCount}</span>
            </div>
          )}

          {/* Separateur */}
          {showCountIndicator && (
            <div className="hidden md:block w-px h-6 bg-base-300" />
          )}

          {/* Toggle vue */}
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            colorClass={colorClass}
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
                onClick={onSearchClear}
                aria-label="Supprimer le filtre de recherche"
              >
                <Icons.X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterValue !== "all" && (
            <span className={`badge badge-sm gap-1 ${filterBadgeClass}`}>
              {filterLabel}: {filterValue}
              <button
                type="button"
                className="hover:text-error cursor-pointer"
                onClick={() => onFilterChange("all")}
                aria-label={`Supprimer le filtre de ${filterLabel.toLowerCase()}`}
              >
                <Icons.X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export type { ListToolbarProps, SortOption };
