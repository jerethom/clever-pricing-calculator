import type { ReactNode } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger: ReactNode;
  align?: "left" | "right";
}

export const DropdownMenu = memo(function DropdownMenu({
  items,
  trigger,
  align = "right",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback((onClick: () => void) => {
    onClick();
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="dropdown dropdown-bottom dropdown-end">
      <div onClick={handleToggle}>{trigger}</div>
      {isOpen && (
        <ul
          className={`dropdown-content menu bg-base-100 border border-base-300 shadow-lg z-50 w-48 p-2 mt-1 ${
            align === "left" ? "dropdown-start" : ""
          }`}
        >
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className={`cursor-pointer gap-2 ${
                  item.variant === "danger"
                    ? "text-error hover:bg-error/10"
                    : ""
                }`}
                onClick={() => handleItemClick(item.onClick)}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
