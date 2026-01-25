import type { ReactNode } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

interface MenuPosition {
  top: number;
  left: number;
  openUpward: boolean;
}

const MENU_HEIGHT_ESTIMATE = 150;
const MENU_WIDTH = 192; // w-48 = 12rem = 192px

export const DropdownMenu = memo(function DropdownMenu({
  items,
  trigger,
  align = "right",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  const handleItemClick = useCallback((onClick: () => void) => {
    onClick();
    setIsOpen(false);
  }, []);

  // Calculate menu position when opening
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) {
      setMenuPosition(null);
      return;
    }

    const triggerRect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if there's enough space below
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const openUpward = spaceBelow < MENU_HEIGHT_ESTIMATE;

    // Calculate vertical position
    let top: number;
    if (openUpward) {
      top = triggerRect.top - MENU_HEIGHT_ESTIMATE;
    } else {
      top = triggerRect.bottom + 4; // 4px margin
    }

    // Calculate horizontal position based on align
    let left: number;
    if (align === "right") {
      left = triggerRect.right - MENU_WIDTH;
    } else {
      left = triggerRect.left;
    }

    // Ensure menu stays within viewport horizontally
    if (left < 0) {
      left = 4;
    } else if (left + MENU_WIDTH > viewportWidth) {
      left = viewportWidth - MENU_WIDTH - 4;
    }

    setMenuPosition({ top, left, openUpward });
  }, [isOpen, align]);

  // Handle click outside and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideTrigger =
        dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideMenu =
        menuRef.current && !menuRef.current.contains(target);

      if (isOutsideTrigger && isOutsideMenu) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMenuMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent parent dropdowns from detecting this as "click outside"
    // Use nativeEvent to stop native document listeners
    e.nativeEvent.stopImmediatePropagation();
  }, []);

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            className="menu bg-base-100 border border-base-300 rounded-box shadow-lg w-48 p-2 z-[9999]"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            onMouseDown={handleMenuMouseDown}
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
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={dropdownRef} className="inline-block">
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {trigger}
      </div>
      {menu}
    </div>
  );
});
