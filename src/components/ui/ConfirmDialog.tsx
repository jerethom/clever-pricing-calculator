import { useCallback, useEffect } from "react";
import { Icons } from "./Icons";
import { Portal } from "./Portal";

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

export function ConfirmDialog({
	isOpen,
	title,
	message,
	confirmLabel = "Confirmer",
	cancelLabel = "Annuler",
	variant = "error",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		},
		[onCancel],
	);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
			return () => {
				document.removeEventListener("keydown", handleKeyDown);
				document.body.style.overflow = "";
			};
		}
	}, [isOpen, handleKeyDown]);

	if (!isOpen) return null;

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
		<Portal>
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				{/* Backdrop */}
				<div
					className="absolute inset-0 bg-[#13172e]/80"
					onClick={onCancel}
					aria-hidden="true"
				/>
				{/* Dialog */}
				<div className="relative bg-base-100 max-w-md w-full mx-4 border border-base-300 animate-in">
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
				</div>
			</div>
		</Portal>
	);
}
