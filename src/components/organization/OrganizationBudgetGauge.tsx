import { memo, useCallback, useMemo, useState } from "react";
import { Icons, NumberInput } from "@/components/ui";
import { formatPrice } from "@/lib/costCalculator";

interface OrganizationBudgetGaugeProps {
	currentCost: number;
	minCost: number;
	maxCost: number;
	budgetTarget?: number;
	onUpdateBudget: (budget: number | undefined) => void;
}

interface BudgetPreset {
	label: string;
	value: number;
	isRecommended?: boolean;
}

const roundBudget = (value: number) => Math.ceil(value / 10) * 10;

const getStatusColor = (percent: number, type: "bg" | "text"): string => {
	const prefix = type === "bg" ? "bg-" : "text-";
	if (percent > 100) return `${prefix}error`;
	if (percent >= 80) return `${prefix}warning`;
	return `${prefix}success`;
};

const getProgressGradient = (percent: number): string => {
	if (percent > 100) {
		// Over budget: orange to red gradient
		return "bg-gradient-to-r from-warning via-error to-error";
	}
	if (percent >= 90) {
		// Critical zone: orange to red
		return "bg-gradient-to-r from-warning to-error";
	}
	if (percent >= 70) {
		// Warning zone: green transitioning to orange
		return "bg-gradient-to-r from-success via-warning to-warning";
	}
	// Safe zone: green
	return "bg-gradient-to-r from-success to-success";
};

export const OrganizationBudgetGauge = memo(function OrganizationBudgetGauge({
	currentCost,
	minCost,
	maxCost,
	budgetTarget,
	onUpdateBudget,
}: OrganizationBudgetGaugeProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [editValue, setEditValue] = useState(
		budgetTarget ?? Math.ceil(currentCost * 1.2),
	);

	const defaultBudget = Math.ceil(currentCost * 1.2);

	const presets = useMemo(
		(): BudgetPreset[] => [
			{ label: "+10%", value: roundBudget(currentCost * 1.1) },
			{
				label: "+20%",
				value: roundBudget(currentCost * 1.2),
				isRecommended: true,
			},
			{ label: "+50%", value: roundBudget(currentCost * 1.5) },
		],
		[currentCost],
	);

	const closeEditor = useCallback(() => {
		setIsEditing(false);
		setShowCustomInput(false);
	}, []);

	const handleStartEdit = useCallback(() => {
		setEditValue(budgetTarget ?? defaultBudget);
		setShowCustomInput(false);
		setIsEditing(true);
	}, [budgetTarget, defaultBudget]);

	const handleSelectPreset = useCallback(
		(value: number) => {
			onUpdateBudget(value);
			closeEditor();
		},
		[onUpdateBudget, closeEditor],
	);

	const handleShowCustomInput = useCallback(() => {
		setEditValue(budgetTarget ?? defaultBudget);
		setShowCustomInput(true);
	}, [budgetTarget, defaultBudget]);

	const handleSaveCustom = useCallback(() => {
		onUpdateBudget(editValue > 0 ? editValue : undefined);
		closeEditor();
	}, [editValue, onUpdateBudget, closeEditor]);

	const handleRemoveBudget = useCallback(() => {
		onUpdateBudget(undefined);
		closeEditor();
	}, [onUpdateBudget, closeEditor]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleSaveCustom();
			} else if (e.key === "Escape") {
				closeEditor();
			}
		},
		[handleSaveCustom, closeEditor],
	);

	const budgetPercent =
		budgetTarget && budgetTarget > 0 ? (currentCost / budgetTarget) * 100 : 0;

	const hasCostRange = minCost !== maxCost;

	const renderPresets = () => (
		<div className="animate-in fade-in duration-200">
			<p className="text-sm font-medium text-base-content/60 mb-3">
				Definir un budget mensuel cible
			</p>
			<div className="flex flex-wrap gap-2">
				{presets.map((preset) => (
					<button
						key={preset.label}
						type="button"
						className={`btn btn-sm ${preset.isRecommended ? "btn-primary btn-outline" : "btn-outline"}`}
						onClick={() => handleSelectPreset(preset.value)}
					>
						{preset.label} ({formatPrice(preset.value)})
					</button>
				))}
				<button
					type="button"
					className="btn btn-ghost btn-sm"
					onClick={handleShowCustomInput}
				>
					Personnalise...
				</button>
			</div>
			<div className="flex gap-2 mt-3">
				<button
					type="button"
					className="btn btn-ghost btn-xs"
					onClick={closeEditor}
				>
					Annuler
				</button>
				{budgetTarget && (
					<button
						type="button"
						className="btn btn-ghost btn-xs text-error"
						onClick={handleRemoveBudget}
					>
						Supprimer le budget
					</button>
				)}
			</div>
		</div>
	);

	const renderCustomInput = () => (
		<div className="animate-in fade-in duration-200">
			<p className="text-sm font-medium text-base-content/60 mb-3">
				Budget mensuel personnalisé
			</p>

			<div className="flex flex-col items-center gap-4">
				<NumberInput
					id="budget-input"
					value={editValue}
					onChange={setEditValue}
					min={0}
					max={999999}
					step={100}
					size="lg"
					suffix="€"
					onKeyDown={handleKeyDown}
					autoFocus
				/>

				<div className="flex items-center gap-2">
					<button
						type="button"
						className="btn btn-primary btn-sm gap-1"
						onClick={handleSaveCustom}
					>
						<Icons.Check className="w-4 h-4" />
						Valider
					</button>
					<button
						type="button"
						className="btn btn-ghost btn-sm"
						onClick={() => setShowCustomInput(false)}
					>
						Retour
					</button>
				</div>

				{budgetTarget && (
					<button
						type="button"
						className="btn btn-ghost btn-xs text-error"
						onClick={handleRemoveBudget}
					>
						Supprimer le budget
					</button>
				)}
			</div>
		</div>
	);

	const renderBudgetStatus = () => {
		if (!budgetTarget) return null;
		const maxCostPercent =
			budgetTarget > 0 ? (maxCost / budgetTarget) * 100 : 0;
		const showMaxMarker =
			hasCostRange && maxCostPercent > 0 && maxCostPercent !== budgetPercent;
		const maxMarkerPosition = Math.min(maxCostPercent, 100);
		const isMaxOverBudget = maxCost > budgetTarget;

		return (
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-base-content/60">
						Budget mensuel
					</span>
					<button
						type="button"
						className="btn btn-ghost btn-xs opacity-60 hover:opacity-100"
						onClick={handleStartEdit}
						aria-label="Modifier le budget"
					>
						<Icons.Edit className="w-3 h-3" />
					</button>
				</div>

				<div className="space-y-2">
					{/* Progress bar with max cost marker */}
					<div className="relative">
						{/* Max cost marker */}
						{showMaxMarker && (
							<div
								className="absolute -top-4 transition-all duration-500 ease-out"
								style={{
									left: `${maxMarkerPosition}%`,
									transform: "translateX(-50%)",
								}}
								title={`Cout max: ${formatPrice(maxCost)}`}
							>
								<span
									className={`text-xs ${isMaxOverBudget ? "text-warning" : "text-base-content/40"}`}
								>
									▼
								</span>
							</div>
						)}

						{/* Progress bar */}
						<div className="h-3 bg-base-300 rounded-full overflow-hidden">
							<div
								className={`h-full transition-all duration-700 ease-out ${getProgressGradient(budgetPercent)}`}
								style={{ width: `${Math.min(budgetPercent, 100)}%` }}
								role="progressbar"
								aria-valuenow={budgetPercent}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label={`${budgetPercent.toFixed(0)}% du budget utilise`}
							/>
						</div>
					</div>

					<div className="flex items-center justify-between text-sm">
						<span
							className={`font-bold tabular-nums ${getStatusColor(budgetPercent, "text")}`}
						>
							{budgetPercent.toFixed(0)}%
						</span>
						<span className="text-base-content/60">
							{formatPrice(currentCost)} / {formatPrice(budgetTarget)}
						</span>
					</div>
				</div>

				{/* Animated alert badges */}
				<div className="flex flex-wrap gap-2">
					{budgetPercent > 100 && (
						<span className="badge badge-error gap-1 status-scaling">
							<Icons.Warning className="w-3 h-3" />
							Depasse de {formatPrice(currentCost - budgetTarget)}
						</span>
					)}
					{budgetPercent >= 80 && budgetPercent <= 100 && (
						<span className="badge badge-warning gap-1">
							<Icons.Warning className="w-3 h-3" />
							{formatPrice(budgetTarget - currentCost)} restant
						</span>
					)}
					{hasCostRange && maxCost > budgetTarget && budgetPercent <= 100 && (
						<span className="badge badge-warning badge-outline gap-1">
							<Icons.Info className="w-3 h-3" />
							Max peut depasser
						</span>
					)}
				</div>
			</div>
		);
	};

	const renderNoBudget = () => (
		<div className="text-center py-2">
			<p className="text-sm text-base-content/50 mb-2">
				Definissez un budget pour suivre vos depenses
			</p>
			<button
				type="button"
				className="btn btn-outline btn-sm gap-2"
				onClick={handleStartEdit}
			>
				<Icons.Plus className="w-4 h-4" />
				Definir un budget
			</button>
		</div>
	);

	return (
		<section
			className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-300"
			aria-label="Budget et cout total"
		>
			<div className="card-body p-4 sm:p-6">
				<div className="flex flex-col lg:flex-row lg:items-center gap-6">
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<div className="p-3 rounded-xl bg-primary/10">
								<Icons.Chart className="w-6 h-6 text-primary" />
							</div>
							<div>
								<p className="text-sm font-medium text-base-content/60 uppercase tracking-wider">
									Cout mensuel total
								</p>
								<p className="text-3xl sm:text-4xl font-bold text-primary tabular-nums">
									{formatPrice(currentCost)}
								</p>
								{hasCostRange && (
									<p className="text-sm text-base-content/50 mt-1">
										Plage: {formatPrice(minCost)} - {formatPrice(maxCost)}
									</p>
								)}
							</div>
						</div>
					</div>

					<div className="hidden lg:block w-px h-20 bg-base-300" />

					<div className="flex-1">
						{isEditing
							? showCustomInput
								? renderCustomInput()
								: renderPresets()
							: budgetTarget
								? renderBudgetStatus()
								: renderNoBudget()}
					</div>
				</div>
			</div>
		</section>
	);
});
