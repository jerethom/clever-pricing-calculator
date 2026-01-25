import { memo } from "react";
import { Icons } from "./Icons";

interface ViewToggleProps {
  viewMode: "grid" | "compact";
  onViewModeChange: (mode: "grid" | "compact") => void;
  colorClass?: string;
}

export const ViewToggle = memo(function ViewToggle({
  viewMode,
  onViewModeChange,
  colorClass = "primary",
}: ViewToggleProps) {
  const activeClass = `bg-${colorClass} text-${colorClass}-content hover:bg-${colorClass}/90`;
  const inactiveClass = "bg-base-100 hover:bg-base-200";

  return (
    <div className="join border border-base-300" role="group">
      <div className="tooltip tooltip-bottom" data-tip="Vue grille">
        <button
          type="button"
          className={`btn btn-sm join-item border-0 cursor-pointer ${
            viewMode === "grid" ? activeClass : inactiveClass
          }`}
          onClick={() => onViewModeChange("grid")}
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
            viewMode === "compact" ? activeClass : inactiveClass
          }`}
          onClick={() => onViewModeChange("compact")}
          aria-label="Vue liste"
          aria-pressed={viewMode === "compact"}
        >
          <Icons.Menu className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
