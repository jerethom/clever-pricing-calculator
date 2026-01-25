import { memo } from "react";
import { Icons } from "./Icons";
import { ModalBase } from "./ModalBase";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "error" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "error",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const variantStyles = {
    error: {
      button: "bg-red-600 hover:bg-red-700 text-white",
      icon: "text-red-500",
    },
    warning: {
      button: "bg-amber-500 hover:bg-amber-600 text-white",
      icon: "text-amber-500",
    },
    info: {
      button: "bg-[#5754aa] hover:bg-[#6563b8] text-white",
      icon: "text-[#5754aa]",
    },
  };

  const styles = variantStyles[variant];

  return (
    <ModalBase isOpen={isOpen} onClose={onCancel} maxWidth="md">
      <div className="p-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Icons.Warning className={`w-6 h-6 ${styles.icon}`} />
          {title}
        </h3>
        <p className="py-4 text-base-content/80">{message}</p>
      </div>
      <div className="flex justify-end gap-2 px-6 py-4 bg-base-200 border-t border-base-300">
        <button
          type="button"
          className="btn btn-ghost hover:bg-base-300"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${styles.button}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalBase>
  );
});
