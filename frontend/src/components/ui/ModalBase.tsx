import { memo, type ReactNode, useCallback } from "react";
import { useModal } from "@/hooks/useModal";
import { Portal } from "./Portal";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "6xl";

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Classes CSS additionnelles pour le container du dialog */
  className?: string;
  /** Taille max du dialog */
  maxWidth?: MaxWidth;
  /** Si true, ne pas fermer sur Escape ou clic backdrop */
  preventClose?: boolean;
}

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "6xl": "max-w-6xl",
};

export const ModalBase = memo(function ModalBase({
  isOpen,
  onClose,
  children,
  className = "",
  maxWidth = "md",
  preventClose = false,
}: ModalBaseProps) {
  useModal({ isOpen, onClose, preventClose });

  const handleBackdropClick = useCallback(() => {
    if (!preventClose) {
      onClose();
    }
  }, [onClose, preventClose]);

  if (!isOpen) return null;

  const widthClass = maxWidthClasses[maxWidth];

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#13172e]/80"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
        {/* Dialog */}
        <div
          className={`relative bg-base-100 ${widthClass} w-full mx-4 border border-base-300 animate-in ${className}`}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
});
