import { memo, type ReactNode } from "react";
import { Icons } from "./Icons";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  label?: string;
  allLabel?: string;
  colorClass?: string;
}

export const FilterDropdown = memo(function FilterDropdown({
  value,
  options,
  onChange,
  icon,
  label,
  allLabel = "Tous",
  colorClass = "primary",
}: FilterDropdownProps) {
  const isFiltered = value !== "all";
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = isFiltered ? (selectedOption?.label ?? value) : label;
  const totalCount = options.reduce((sum, opt) => sum + (opt.count ?? 0), 0);

  return (
    <div className="dropdown dropdown-bottom">
      <button
        type="button"
        className={`btn btn-sm gap-2 cursor-pointer ${
          isFiltered
            ? `btn-${colorClass}`
            : "btn-ghost border border-base-300 hover:border-base-content/20"
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{displayLabel}</span>
        {isFiltered && <span className="sm:hidden">{displayLabel}</span>}
        <Icons.ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      <ul className="dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-10 w-52 p-2 mt-1">
        <li>
          <button
            type="button"
            className={`cursor-pointer ${value === "all" ? "active" : ""}`}
            onClick={() => onChange("all")}
          >
            <Icons.Check
              className={`w-4 h-4 ${value === "all" ? "opacity-100" : "opacity-0"}`}
            />
            {allLabel}
            {totalCount > 0 && (
              <span className="badge badge-sm badge-ghost ml-auto">
                {totalCount}
              </span>
            )}
          </button>
        </li>
        {options.length > 0 && (
          <li className="menu-title mt-2">
            <span>Options disponibles</span>
          </li>
        )}
        {options.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              className={`cursor-pointer ${value === option.value ? "active" : ""}`}
              onClick={() => onChange(option.value)}
            >
              <Icons.Check
                className={`w-4 h-4 ${value === option.value ? "opacity-100" : "opacity-0"}`}
              />
              {option.label}
              {option.count !== undefined && (
                <span className="badge badge-sm badge-ghost ml-auto">
                  {option.count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

export type { FilterOption };
