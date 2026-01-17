import { useState } from "react";
import { ConfirmDialog, Icons } from "@/components/ui";
import { useProjectCost } from "@/hooks/useCostCalculation";
import { formatPrice } from "@/lib/costCalculator";
import {
	selectActiveOrganization,
	useProjectActions,
	useSelector,
} from "@/store";
import type { Project } from "@/types";

interface ProjectHeaderProps {
	project: Project;
}

interface StatItemProps {
	icon: typeof Icons.Server;
	iconColor: string;
	count: number;
	label: string;
	price?: number;
}

function StatItem({
	icon: Icon,
	iconColor,
	count,
	label,
	price,
}: StatItemProps) {
	return (
		<div className="flex items-center gap-2">
			<Icon className={`w-4 h-4 ${iconColor}`} />
			<span className="font-medium">{count}</span>
			<span className="text-base-content/60">
				{label}
				{count !== 1 ? "s" : ""}
			</span>
			<span className="text-base-content/40">
				({price !== undefined ? formatPrice(price) : "..."})
			</span>
		</div>
	);
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
	const activeOrg = useSelector(selectActiveOrganization);
	const { updateProject, deleteProject } = useProjectActions();
	const cost = useProjectCost(project.id);

	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const startEdit = () => {
		setEditName(project.name);
		setIsEditing(true);
	};

	const saveEdit = () => {
		if (editName.trim()) updateProject(project.id, { name: editName.trim() });
		setIsEditing(false);
	};

	const confirmDelete = () => {
		deleteProject(project.id);
		setShowDeleteConfirm(false);
	};

	return (
		<>
			<div className="space-y-4">
				{/* Ligne principale: Nom du projet + Actions */}
				<div className="flex items-start sm:items-center justify-between gap-3">
					{/* Nom du projet */}
					<div className="flex-1 min-w-0">
						{isEditing ? (
							<div className="animate-in">
								<label
									htmlFor="project-name-input"
									className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2 block"
								>
									Renommer le projet
								</label>
								<div className="flex flex-col sm:flex-row gap-2">
									<input
										id="project-name-input"
										type="text"
										className="input input-bordered flex-1 font-semibold text-lg"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") saveEdit();
											if (e.key === "Escape") setIsEditing(false);
										}}
										placeholder="Nom du projet..."
									/>
									<div className="flex gap-2">
										<button
											type="button"
											className="btn btn-primary flex-1 sm:flex-none gap-2"
											onClick={saveEdit}
										>
											<Icons.Check className="w-4 h-4" />
											<span>Sauvegarder</span>
										</button>
										<button
											type="button"
											className="btn btn-ghost"
											onClick={() => setIsEditing(false)}
											aria-label="Annuler"
										>
											<Icons.X className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						) : (
							<div>
								{activeOrg && (
									<div className="flex items-center gap-1.5 text-sm text-base-content/50 mb-1">
										<Icons.Building className="w-3.5 h-3.5" />
										<span>{activeOrg.name}</span>
									</div>
								)}
								<div className="flex items-center gap-2 group">
									<Icons.Folder className="w-5 h-5 text-primary shrink-0" />
									<h1 className="text-xl sm:text-2xl font-bold truncate">
										{project.name}
									</h1>
									<button
										type="button"
										className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
										onClick={startEdit}
										aria-label="Modifier le nom du projet"
									>
										<Icons.Edit className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Bouton supprimer desktop */}
					{!isEditing && (
						<div
							className="tooltip tooltip-left hidden sm:block"
							data-tip="Supprimer ce projet"
						>
							<button
								type="button"
								className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10"
								onClick={() => setShowDeleteConfirm(true)}
								aria-label={`Supprimer le projet ${project.name}`}
							>
								<Icons.Trash className="w-4 h-4" />
							</button>
						</div>
					)}
				</div>

				{!isEditing && (
					<div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
						<StatItem
							icon={Icons.Server}
							iconColor="text-primary"
							count={project.runtimes.length}
							label="runtime"
							price={cost?.runtimesCost}
						/>
						<span className="hidden sm:block text-base-300" aria-hidden="true">
							|
						</span>
						<StatItem
							icon={Icons.Puzzle}
							iconColor="text-secondary"
							count={project.addons.length}
							label="addon"
							price={cost?.addonsCost}
						/>
						<span className="hidden sm:block text-base-300" aria-hidden="true">
							|
						</span>
						<div className="flex items-center gap-2">
							<Icons.Chart className="w-4 h-4 text-primary" />
							<span className="font-bold text-primary text-base">
								{cost ? formatPrice(cost.totalMonthlyCost) : "..."}
							</span>
							<span className="text-base-content/60">/mois</span>
						</div>
					</div>
				)}

				{/* Bouton supprimer mobile */}
				{!isEditing && (
					<div className="sm:hidden pt-1">
						<button
							type="button"
							className="btn btn-ghost btn-sm text-base-content/50 hover:text-error hover:bg-error/10 w-full justify-center gap-2"
							onClick={() => setShowDeleteConfirm(true)}
							aria-label={`Supprimer le projet ${project.name}`}
						>
							<Icons.Trash className="w-4 h-4" />
							Supprimer ce projet
						</button>
					</div>
				)}
			</div>

			{/* Modal de confirmation de suppression */}
			<ConfirmDialog
				isOpen={showDeleteConfirm}
				title="Supprimer le projet"
				message={`Voulez-vous vraiment supprimer le projet "${project.name}" ? Cette action est irreversible.`}
				confirmLabel="Supprimer"
				cancelLabel="Annuler"
				variant="error"
				onConfirm={confirmDelete}
				onCancel={() => setShowDeleteConfirm(false)}
			/>
		</>
	);
}
