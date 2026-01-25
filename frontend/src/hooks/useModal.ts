import { useCallback, useEffect } from "react";

interface UseModalOptions {
  isOpen: boolean;
  onClose: () => void;
  /** Si true, ne pas fermer sur Escape (ex: edition en cours) */
  preventClose?: boolean;
}

/**
 * Hook pour gerer le comportement commun des modales :
 * - Ecouteur Escape pour fermer la modale
 * - Body overflow hidden quand la modale est ouverte
 * - Nettoyage des listeners au unmount
 */
export function useModal({
  isOpen,
  onClose,
  preventClose = false,
}: UseModalOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) {
        onClose();
      }
    },
    [onClose, preventClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);
}
