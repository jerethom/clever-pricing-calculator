import { memo } from "react";
import { Icons } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";
import { useRuntimeCardContext } from "./RuntimeCardContext";
import type { RuntimeCardIdentityProps } from "./types";

export const RuntimeCardIdentity = memo(function RuntimeCardIdentity({
	className = "",
}: RuntimeCardIdentityProps) {
	const {
		runtime,
		cost,
		defaultName,
		isEditingName,
		editName,
		onStartEditName,
		onSaveEditName,
		onCancelEditName,
		onResetName,
		onEditNameChange,
		onEditNameKeyDown,
		onOpenDeleteConfirm,
	} = useRuntimeCardContext();

	return (
		<div className={`flex items-start justify-between gap-4 ${className}`}>
			{/* Gauche: Logo + Nom editable + Type d'instance */}
			<div className="flex items-center gap-3 min-w-0 flex-1">
				{runtime.variantLogo ? (
					<div className="flex-shrink-0">
						<img
							src={runtime.variantLogo}
							alt=""
							className="w-12 h-12 object-contain bg-base-200 p-1.5"
						/>
					</div>
				) : (
					<div className="w-12 h-12 bg-base-200 flex items-center justify-center flex-shrink-0">
						<Icons.Server className="w-6 h-6 text-base-content/40" />
					</div>
				)}
				<div className="min-w-0 flex-1">
					{isEditingName ? (
						<div className="animate-in fade-in duration-200">
							<div className="flex items-center gap-1">
								<input
									type="text"
									className="input input-bordered input-sm flex-1 font-bold text-base min-w-0"
									value={editName}
									onChange={onEditNameChange}
									onKeyDown={onEditNameKeyDown}
									placeholder="Nom du runtime..."
								/>
								<button
									type="button"
									className="btn btn-ghost btn-xs btn-square text-success hover:bg-success/10 cursor-pointer"
									onClick={onSaveEditName}
									aria-label="Sauvegarder"
								>
									<Icons.Check className="w-3.5 h-3.5" />
								</button>
								<div
									className="tooltip tooltip-bottom"
									data-tip={`Reset: ${defaultName}`}
								>
									<button
										type="button"
										className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-warning hover:bg-warning/10 cursor-pointer"
										onClick={onResetName}
										aria-label="Reinitialiser le nom"
									>
										<Icons.Refresh className="w-3.5 h-3.5" />
									</button>
								</div>
								<button
									type="button"
									className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error hover:bg-error/10 cursor-pointer"
									onClick={onCancelEditName}
									aria-label="Annuler"
								>
									<Icons.X className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					) : (
						<div className="flex items-center gap-1 group/name">
							<h3 className="font-bold text-base truncate">
								{runtime.instanceName}
							</h3>
							<button
								type="button"
								className="btn btn-ghost btn-xs btn-square opacity-0 group-hover/name:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
								onClick={onStartEditName}
								aria-label="Modifier le nom du runtime"
							>
								<Icons.Edit className="w-3 h-3" />
							</button>
						</div>
					)}
					<div className="flex items-center gap-2 flex-wrap mt-1">
						<span className="badge badge-sm badge-ghost">
							{runtime.instanceType}
						</span>
					</div>
				</div>
			</div>

			{/* Droite: Cout principal + Badge mode + Bouton supprimer */}
			<div className="flex items-start gap-3 flex-shrink-0">
				<div className="text-right">
					<p className="text-3xl font-bold text-primary leading-tight">
						{formatPrice(cost.estimatedTotalCost)}
					</p>
					<div className="flex items-center justify-end gap-2 mt-1">
						{runtime.scalingEnabled ? (
							cost.averageLoadLevel > 0 ? (
								<span className="badge badge-sm badge-warning gap-1">
									<span className="w-1.5 h-1.5 bg-warning-content rounded-full animate-pulse" />
									Scaling
								</span>
							) : (
								<span className="badge badge-sm badge-primary">Scaling</span>
							)
						) : (
							<span className="badge badge-sm badge-success">24/7</span>
						)}
						<span className="text-xs text-base-content/50">/mois</span>
					</div>
				</div>

				{/* Bouton supprimer discret */}
				<button
					type="button"
					className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
					onClick={onOpenDeleteConfirm}
					aria-label={`Supprimer ${runtime.instanceName}`}
				>
					<Icons.Trash className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
});
