import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Icons } from "@/components/ui";
import {
	hexToRgba,
	LOAD_LEVEL_OPACITIES,
	PROFILE_COLORS,
	shouldUseWhiteText,
} from "@/constants";
import { useProjectAction } from "@/store";
import type { LoadLevel, RuntimeConfig, WeeklySchedule } from "@/types";
import {
	createEmptySchedule,
	LOAD_LEVEL_DESCRIPTIONS,
	LOAD_LEVEL_LABELS,
	LOAD_LEVELS,
} from "@/types";
import { ScheduleLegend } from "./ScheduleLegend";
import { SchedulePresets } from "./SchedulePresets";
import { WeeklyCalendar } from "./WeeklyCalendar";

interface TimeSlotEditorProps {
	projectId: string;
	runtimeId: string;
	runtime: RuntimeConfig;
}

// Composant memoise pour les boutons de niveau de charge
interface LoadLevelButtonsProps {
	loadLevel: LoadLevel;
	onLoadLevelChange: (level: LoadLevel) => void;
	profileColor: string;
}

const LoadLevelButtons = memo(function LoadLevelButtons({
	loadLevel,
	onLoadLevelChange,
	profileColor,
}: LoadLevelButtonsProps) {
	return (
		<div className="flex items-center gap-0.5">
			{LOAD_LEVELS.map((level) => {
				// Tous les niveaux utilisent la couleur du profil avec l'opacite correspondante
				const opacity = LOAD_LEVEL_OPACITIES[level];
				const bgColor = hexToRgba(profileColor, opacity);
				const useWhiteText = shouldUseWhiteText(profileColor, opacity);

				return (
					<div
						key={level}
						className="tooltip tooltip-bottom"
						data-tip={`${LOAD_LEVEL_LABELS[level]} - ${LOAD_LEVEL_DESCRIPTIONS[level]}`}
					>
						<button
							type="button"
							onClick={() => onLoadLevelChange(level)}
							className={`
                btn btn-sm w-8 h-8 min-h-0 p-0 border border-base-300
                ${loadLevel === level ? "ring-2 ring-primary ring-offset-1" : ""}
              `}
							style={{
								backgroundColor: bgColor,
								color: useWhiteText ? "#fff" : "#000",
							}}
						>
							{level}
						</button>
					</div>
				);
			})}
		</div>
	);
});

function TimeSlotEditor({
	projectId,
	runtimeId,
	runtime,
}: TimeSlotEditorProps) {
	const updateRuntime = useProjectAction("updateRuntime");
	const [selectedProfileId, setSelectedProfileId] = useState<string>(
		(runtime.scalingProfiles ?? []).find((p) => p.enabled)?.id ?? "default",
	);
	const [loadLevel, setLoadLevel] = useState<LoadLevel>(3);

	// Profils de scaling disponibles - memoises pour eviter les recalculs
	const scalingProfiles = useMemo(
		() => (runtime.scalingProfiles ?? []).filter((p) => p.enabled),
		[runtime.scalingProfiles],
	);

	// Mettre à jour selectedProfileId si le profil sélectionné n'existe plus
	useEffect(() => {
		const profileExists = scalingProfiles.some(
			(p) => p.id === selectedProfileId,
		);
		if (!profileExists && scalingProfiles.length > 0) {
			setSelectedProfileId(scalingProfiles[0].id);
		}
	}, [scalingProfiles, selectedProfileId]);

	// Memoiser les callbacks pour eviter les re-renders inutiles
	const handleScheduleChange = useCallback(
		(newSchedule: WeeklySchedule) => {
			updateRuntime(projectId, runtimeId, { weeklySchedule: newSchedule });
		},
		[updateRuntime, projectId, runtimeId],
	);

	const handleReset = useCallback(() => {
		handleScheduleChange(createEmptySchedule());
	}, [handleScheduleChange]);

	const schedule = useMemo(
		() => runtime.weeklySchedule ?? createEmptySchedule(),
		[runtime.weeklySchedule],
	);

	// Memoiser le callback pour le changement de niveau de charge
	const handleLoadLevelChange = useCallback((level: LoadLevel) => {
		setLoadLevel(level);
	}, []);

	// Calcul du nombre d'heures de scaling configurees - memoise pour eviter recalculs a chaque render
	const scalingHoursCount = useMemo(() => {
		return Object.values(schedule).reduce((total, day) => {
			return total + day.filter((config) => config.loadLevel > 0).length;
		}, 0);
	}, [schedule]);

	// Detecter les creneaux orphelins (profil supprime) - memoise
	const orphanedSlotsCount = useMemo(() => {
		const allProfileIds = new Set(
			(runtime.scalingProfiles ?? []).map((p) => p.id),
		);
		return Object.values(schedule).reduce((total, day) => {
			return (
				total +
				day.filter(
					(config) =>
						config.profileId !== null && !allProfileIds.has(config.profileId),
				).length
			);
		}, 0);
	}, [schedule, runtime.scalingProfiles]);

	const hasScaling = scalingProfiles.length > 0;

	// Index et couleur du profil selectionne - memoise pour eviter recalcul a chaque render
	const selectedProfileColorIndex = useMemo(() => {
		return Math.max(
			0,
			scalingProfiles.findIndex((p) => p.id === selectedProfileId),
		);
	}, [scalingProfiles, selectedProfileId]);

	const selectedProfileColor = useMemo(() => {
		return PROFILE_COLORS[selectedProfileColorIndex % PROFILE_COLORS.length]
			.hex;
	}, [selectedProfileColorIndex]);

	return (
		<div className="space-y-4">
			{/* Header avec infos */}
			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div>
					<h4 className="font-semibold flex items-center gap-2">
						<Icons.Clock className="w-4 h-4 text-primary" />
						Planning hebdomadaire
					</h4>
					<p className="text-sm text-base-content/60 mt-1">
						Définissez quand et comment le scaling doit s'activer
					</p>
				</div>

				{/* Légende contextuelle */}
				<ScheduleLegend scalingProfiles={runtime.scalingProfiles ?? []} />
			</div>

			{/* Toolbar sticky compacte - 2 lignes */}
			{hasScaling && (
				<div className="sticky top-0 z-10 bg-base-100 border border-base-300 shadow-sm rounded-lg p-3 space-y-2">
					{/* Ligne 1 : Profil et Niveau de charge */}
					<div className="flex items-center gap-4 flex-wrap">
						{/* Sélecteur de profil */}
						{scalingProfiles.length > 1 && (
							<div className="flex items-center gap-2">
								<label
									htmlFor="profile-select"
									className="text-sm text-base-content/70 whitespace-nowrap"
								>
									Profil :
								</label>
								<select
									id="profile-select"
									className="select select-sm select-bordered w-40"
									value={selectedProfileId}
									onChange={(e) => setSelectedProfileId(e.target.value)}
								>
									{scalingProfiles.map((profile) => (
										<option key={profile.id} value={profile.id}>
											{profile.name}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Séparateur */}
						{scalingProfiles.length > 1 && (
							<div className="w-px h-6 bg-base-300 hidden sm:block" />
						)}

						{/* Boutons de niveau de charge */}
						<div className="flex items-center gap-2">
							<span className="text-sm text-base-content/70 whitespace-nowrap">
								Charge estimée :
							</span>
							<LoadLevelButtons
								loadLevel={loadLevel}
								onLoadLevelChange={handleLoadLevelChange}
								profileColor={selectedProfileColor}
							/>
						</div>

						{/* Description du niveau de charge actuel */}
						<span className="text-sm text-base-content/70">
							{LOAD_LEVEL_DESCRIPTIONS[loadLevel]}
						</span>
					</div>

					{/* Ligne 2 : Presets et Reset */}
					<div className="flex items-center gap-2 pt-2 border-t border-base-300">
						{/* Presets scrollables horizontalement */}
						<div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
							<SchedulePresets
								profileId={selectedProfileId}
								loadLevel={loadLevel}
								profileColorIndex={selectedProfileColorIndex}
								onApply={handleScheduleChange}
							/>
						</div>

						{/* Bouton Reset */}
						<button
							type="button"
							onClick={handleReset}
							className="btn btn-sm btn-ghost text-error gap-1 shrink-0"
						>
							<Icons.Refresh className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Reset</span>
						</button>
					</div>
				</div>
			)}

			{/* Calendrier */}
			<WeeklyCalendar
				schedule={schedule}
				onChange={handleScheduleChange}
				profileId={selectedProfileId}
				loadLevel={loadLevel}
				scalingProfiles={scalingProfiles}
			/>

			{/* Résumé */}
			{hasScaling && (
				<div className="text-sm text-base-content/60">
					{scalingHoursCount > 0 ? (
						<span>
							{scalingHoursCount} heure(s) de scaling configurée(s) par semaine
						</span>
					) : (
						<span>Aucune heure de scaling configurée (baseline 24/7)</span>
					)}
				</div>
			)}

			{/* Avertissement créneaux orphelins */}
			{orphanedSlotsCount > 0 && (
				<div className="p-4 bg-warning/10 border border-warning/30 text-sm">
					<div className="flex items-start gap-3">
						<Icons.Warning className="w-5 h-5 text-warning shrink-0 mt-0.5" />
						<div>
							<div className="font-medium">Créneaux non assignés</div>
							<div className="text-base-content/70 mt-1">
								{orphanedSlotsCount} créneau(x) référence(nt) un profil qui
								n'existe plus. Sélectionnez un profil et repeignez ces créneaux
								pour les réassigner.
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Message si pas de scaling possible */}
			{!hasScaling && (
				<div className="p-4 bg-warning/10 border border-warning/30 text-sm">
					<div className="flex items-start gap-3">
						<Icons.Warning className="w-5 h-5 text-warning shrink-0 mt-0.5" />
						<div>
							<div className="font-medium">Scaling non disponible</div>
							<div className="text-base-content/70 mt-1">
								Aucun profil de scaling n'est configuré pour ce runtime. Ajoutez
								un profil de scaling pour activer le planning.
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export { TimeSlotEditor };
export default TimeSlotEditor;
