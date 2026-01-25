import { useCallback, useState } from "react";

export type SortOption = "name" | "cost-asc" | "cost-desc" | "instances";
export type ViewMode = "grid" | "compact";

export interface UseListFiltersOptions {
  defaultSort?: SortOption;
  defaultView?: ViewMode;
}

export interface UseListFiltersReturn {
  searchQuery: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  filterValue: string;

  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterValue: (value: string) => void;

  clearSearch: () => void;
  clearFilter: () => void;
  resetAll: () => void;

  hasActiveFilters: boolean;
}

export function useListFilters(
  options?: UseListFiltersOptions,
): UseListFiltersReturn {
  const defaultSort = options?.defaultSort ?? "name";
  const defaultView = options?.defaultView ?? "grid";

  const [searchQuery, setSearchQueryState] = useState("");
  const [sortBy, setSortByState] = useState<SortOption>(defaultSort);
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultView);
  const [filterValue, setFilterValueState] = useState("all");

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setSortBy = useCallback((sort: SortOption) => {
    setSortByState(sort);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const setFilterValue = useCallback((value: string) => {
    setFilterValueState(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQueryState("");
  }, []);

  const clearFilter = useCallback(() => {
    setFilterValueState("all");
  }, []);

  const resetAll = useCallback(() => {
    setSearchQueryState("");
    setFilterValueState("all");
    setSortByState(defaultSort);
  }, [defaultSort]);

  const hasActiveFilters =
    searchQuery !== "" || filterValue !== "all" || sortBy !== defaultSort;

  return {
    searchQuery,
    sortBy,
    viewMode,
    filterValue,

    setSearchQuery,
    setSortBy,
    setViewMode,
    setFilterValue,

    clearSearch,
    clearFilter,
    resetAll,

    hasActiveFilters,
  };
}
