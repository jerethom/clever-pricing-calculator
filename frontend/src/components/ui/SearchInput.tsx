import { memo } from "react";
import { Icons } from "./Icons";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  colorClass?: string;
}

export const SearchInput = memo(function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Rechercher...",
  colorClass = "primary",
}: SearchInputProps) {
  return (
    <div className="relative">
      <label
        className={`input input-sm input-bordered flex items-center gap-2 w-52 pr-8 transition-all focus-within:border-${colorClass} focus-within:shadow-sm`}
      >
        <Icons.Search className="w-4 h-4 text-base-content/40" />
        <input
          type="text"
          className="grow bg-transparent"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs p-0 h-5 w-5 min-h-0 hover:bg-base-300"
          onClick={onClear}
          aria-label="Effacer la recherche"
        >
          <Icons.X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});
