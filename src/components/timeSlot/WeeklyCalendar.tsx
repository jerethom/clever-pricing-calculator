import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	hexToRgba,
	LOAD_LEVEL_OPACITIES,
	PROFILE_COLORS,
	shouldUseWhiteText,
} from "@/constants";
import type {
	DayOfWeek,
	HourlyConfig,
	LoadLevel,
	ScalingProfile,
	WeeklySchedule,
} from "@/types";
import {
	createHourlyConfig,
	DAY_LABELS,
	DAYS_OF_WEEK,
	LOAD_LEVEL_LABELS,
} from "@/types";
import { SelectionIndicator } from "./SelectionIndicator";

// Utilitaire de throttle pour limiter les appels a 60fps (16ms)
function throttle<T extends (...args: Parameters<T>) => void>(
	fn: T,
	delay: number,
): T {
	let lastCall = 0;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return ((...args: Parameters<T>) => {
		const now = Date.now();
		const timeSinceLastCall = now - lastCall;

		if (timeSinceLastCall >= delay) {
			lastCall = now;
			fn(...args);
		} else if (!timeoutId) {
			// Planifier l'execution pour la prochaine frame disponible
			timeoutId = setTimeout(() => {
				lastCall = Date.now();
				timeoutId = null;
				fn(...args);
			}, delay - timeSinceLastCall);
		}
	}) as T;
}

// Precalculer les index des jours pour eviter les indexOf repetitifs
const DAY_INDEX_MAP: Record<DayOfWeek, number> = {
	mon: 0,
	tue: 1,
	wed: 2,
	thu: 3,
	fri: 4,
	sat: 5,
	sun: 6,
};

interface WeeklyCalendarProps {
	schedule: WeeklySchedule;
	onChange: (schedule: WeeklySchedule) => void;
	profileId: string;
	loadLevel: LoadLevel;
	scalingProfiles: ScalingProfile[];
}

/**
 * Calcule le style de fond d'une cellule en fonction du profil et du niveau de charge
 * Retourne un style CSS inline avec la couleur rgba appropriée
 */
const getCellBackgroundStyle = (
	config: HourlyConfig,
	profileColorIndex: number | null,
): React.CSSProperties => {
	if (!config || config.profileId === null || profileColorIndex === null) {
		return {};
	}

	const color = PROFILE_COLORS[profileColorIndex % PROFILE_COLORS.length];
	const opacity = LOAD_LEVEL_OPACITIES[config.loadLevel] ?? 1;

	return {
		backgroundColor: hexToRgba(color.hex, opacity),
	};
};

/**
 * Détermine la classe CSS pour la couleur du texte
 * Utilise le contraste calculé pour assurer la lisibilité
 */
const getTextColorClass = (
	config: HourlyConfig,
	profileColorIndex: number | null,
): string => {
	if (!config || config.profileId === null || profileColorIndex === null) {
		return "text-base-content";
	}

	const color = PROFILE_COLORS[profileColorIndex % PROFILE_COLORS.length];
	const opacity = LOAD_LEVEL_OPACITIES[config.loadLevel] ?? 1;

	if (shouldUseWhiteText(color.hex, opacity)) {
		return "text-white";
	}
	return "text-gray-900 font-semibold";
};

// Type pour les infos de cellule precalculees
interface CellDisplayInfo {
	/** Style CSS inline pour le fond (couleur du profil avec opacité du niveau) */
	bgStyle: React.CSSProperties;
	/** Classe CSS pour le fond de base (niveau 0) */
	bgClass: string;
	/** Classe CSS pour la couleur du texte */
	textColorClass: string;
	/** Niveau de charge affiché (0-5) */
	displayLevel: number;
	/** Texte du tooltip */
	tooltipText: string;
}

// Props pour le composant CalendarCell memoise
interface CalendarCellProps {
	day: DayOfWeek;
	hour: number;
	cellInfo: CellDisplayInfo;
	inSelection: boolean;
	onMouseDown: (day: DayOfWeek, hour: number) => void;
	onMouseEnter: (day: DayOfWeek, hour: number) => void;
	onTouchStart: (e: React.TouchEvent, day: DayOfWeek, hour: number) => void;
}

// Composant CalendarCell memoise pour eviter les re-renders inutiles
const CalendarCell = memo(function CalendarCell({
	day,
	hour,
	cellInfo,
	inSelection,
	onMouseDown,
	onMouseEnter,
	onTouchStart,
}: CalendarCellProps) {
	const { bgStyle, bgClass, textColorClass, displayLevel, tooltipText } =
		cellInfo;

	// Handlers inline avec closure - evite la creation de nouvelles fonctions a chaque render parent
	const handleMouseDown = useCallback(() => {
		onMouseDown(day, hour);
	}, [onMouseDown, day, hour]);

	const handleMouseEnter = useCallback(() => {
		onMouseEnter(day, hour);
	}, [onMouseEnter, day, hour]);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			onTouchStart(e, day, hour);
		},
		[onTouchStart, day, hour],
	);

	return (
		<td
			data-day={day}
			data-hour={hour}
			className={`
        p-0 border border-base-300 cursor-pointer transition-colors
        ${bgClass}
        ${inSelection ? "ring-2 ring-secondary ring-inset" : ""}
        touch-none
      `}
			style={bgStyle}
			onMouseDown={handleMouseDown}
			onMouseEnter={handleMouseEnter}
			onTouchStart={handleTouchStart}
			title={tooltipText}
			role="gridcell"
			tabIndex={0}
			aria-label={`${DAY_LABELS[day]} ${hour}h, niveau de charge ${displayLevel}`}
		>
			<div
				className={`
          w-8 h-6
          sm:w-10 sm:h-7
          md:w-8 md:h-6
          flex items-center justify-center text-xs
          ${textColorClass}
        `}
			>
				{/* Niveau de charge au centre */}
				<span
					className={`font-bold text-[10px] sm:text-xs ${displayLevel === 0 ? "opacity-30" : ""}`}
				>
					{displayLevel}
				</span>
			</div>
		</td>
	);
});

export function WeeklyCalendar({
	schedule,
	onChange,
	profileId,
	loadLevel,
	scalingProfiles,
}: WeeklyCalendarProps) {
	const [isPainting, setIsPainting] = useState(false);
	const [selectionStart, setSelectionStart] = useState<{
		day: DayOfWeek;
		hour: number;
	} | null>(null);
	const [selectionEnd, setSelectionEnd] = useState<{
		day: DayOfWeek;
		hour: number;
	} | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const isPaintingRef = useRef(false); // Ref pour le throttle

	// Synchroniser la ref avec l'etat via useEffect pour eviter l'acces pendant le render
	useEffect(() => {
		isPaintingRef.current = isPainting;
	}, [isPainting]);

	// Cree la config a peindre (toujours associee au profil selectionne) - memoise
	const paintConfig: HourlyConfig = useMemo(
		() => createHourlyConfig(profileId, loadLevel),
		[profileId, loadLevel],
	);

	// Map des profils pour acces O(1) - memoise
	const profilesMap = useMemo(() => {
		const map = new Map<string, { profile: ScalingProfile; index: number }>();
		scalingProfiles.forEach((p, index) => {
			map.set(p.id, { profile: p, index });
		});
		return map;
	}, [scalingProfiles]);

	// Precalculer toutes les infos de cellules une seule fois par render (168 cellules)
	const cellsDisplayInfo = useMemo(() => {
		const info: Record<string, Record<number, CellDisplayInfo>> = {};

		for (const day of DAYS_OF_WEEK) {
			info[day] = {};
			for (let hour = 0; hour < 24; hour++) {
				const config = schedule[day][hour];
				const displayLevel = config?.loadLevel ?? 0;

				// Determiner l'index de couleur du profil (null si baseline ou pas de profil)
				let profileColorIndex: number | null = null;
				let profileData: { profile: ScalingProfile; index: number } | undefined;

				if (config && config.profileId !== null) {
					profileData = profilesMap.get(config.profileId);
					if (profileData) {
						profileColorIndex = profileData.index % PROFILE_COLORS.length;
					}
				}

				// Generer le tooltip enrichi
				const tooltipLines = [
					`${DAY_LABELS[day]} ${hour}h-${hour + 1}h`,
					`Niveau : ${displayLevel} (${LOAD_LEVEL_LABELS[displayLevel as LoadLevel]})`,
				];
				if (profileData && displayLevel > 0) {
					tooltipLines.push(`Profil : ${profileData.profile.name}`);
					tooltipLines.push(
						`Ressources : ${profileData.profile.minInstances}-${profileData.profile.maxInstances} inst.`,
					);
				}

				// Calculer le style de fond et la classe de texte
				const bgStyle = getCellBackgroundStyle(config, profileColorIndex);
				const bgClass = profileColorIndex === null ? "bg-base-200" : "";
				const textColorClass = getTextColorClass(config, profileColorIndex);

				info[day][hour] = {
					bgStyle,
					bgClass,
					textColorClass,
					displayLevel,
					tooltipText: tooltipLines.join("\n"),
				};
			}
		}

		return info;
	}, [schedule, profilesMap]);

	// Precalculer un Set des cellules selectionnees pour O(1) lookup au lieu de O(n) calcul par cellule
	const selectedCellsSet = useMemo(() => {
		const set = new Set<string>();
		if (!selectionStart || !selectionEnd) return set;

		const startDayIndex = DAY_INDEX_MAP[selectionStart.day];
		const endDayIndex = DAY_INDEX_MAP[selectionEnd.day];

		const minDay = Math.min(startDayIndex, endDayIndex);
		const maxDay = Math.max(startDayIndex, endDayIndex);
		const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
		const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);

		for (let d = minDay; d <= maxDay; d++) {
			const day = DAYS_OF_WEEK[d];
			for (let h = minHour; h <= maxHour; h++) {
				set.add(`${day}-${h}`);
			}
		}

		return set;
	}, [selectionStart, selectionEnd]);

	// Applique la selection au schedule - memoise
	const applySelection = useCallback(() => {
		if (!selectionStart || !selectionEnd) return;

		const newSchedule = { ...schedule };
		for (const day of DAYS_OF_WEEK) {
			newSchedule[day] = [...schedule[day]];
		}

		const startDayIndex = DAY_INDEX_MAP[selectionStart.day];
		const endDayIndex = DAY_INDEX_MAP[selectionEnd.day];
		const minDay = Math.min(startDayIndex, endDayIndex);
		const maxDay = Math.max(startDayIndex, endDayIndex);
		const minHour = Math.min(selectionStart.hour, selectionEnd.hour);
		const maxHour = Math.max(selectionStart.hour, selectionEnd.hour);

		for (let d = minDay; d <= maxDay; d++) {
			const day = DAYS_OF_WEEK[d];
			for (let h = minHour; h <= maxHour; h++) {
				newSchedule[day][h] = { ...paintConfig };
			}
		}

		onChange(newSchedule);
	}, [selectionStart, selectionEnd, paintConfig, schedule, onChange]);

	// Debut de la selection (souris) - memoise
	const handleMouseDown = useCallback((day: DayOfWeek, hour: number) => {
		setIsPainting(true);
		setSelectionStart({ day, hour });
		setSelectionEnd({ day, hour });
	}, []);

	// Extension de la selection (souris) - throttle a 60fps (16ms)
	const handleMouseEnterThrottled = useMemo(
		() =>
			throttle((day: DayOfWeek, hour: number) => {
				if (isPaintingRef.current) {
					setSelectionEnd({ day, hour });
				}
			}, 16),
		[],
	);

	const handleMouseEnter = useCallback(
		(day: DayOfWeek, hour: number) => {
			handleMouseEnterThrottled(day, hour);
		},
		[handleMouseEnterThrottled],
	);

	// Fin de la selection (souris) - memoise
	const handleMouseUp = useCallback(() => {
		if (isPaintingRef.current && selectionStart && selectionEnd) {
			applySelection();
		}
		setIsPainting(false);
		setSelectionStart(null);
		setSelectionEnd(null);
	}, [applySelection, selectionStart, selectionEnd]);

	// Gestion du mouse leave sur le conteneur - memoise
	const handleMouseLeave = useCallback(() => {
		if (isPaintingRef.current) {
			handleMouseUp();
		}
	}, [handleMouseUp]);

	// Support tactile - debut - memoise (signature modifiee pour eviter creation de closures)
	const handleTouchStart = useCallback(
		(e: React.TouchEvent, day: DayOfWeek, hour: number) => {
			e.preventDefault();
			setIsPainting(true);
			setSelectionStart({ day, hour });
			setSelectionEnd({ day, hour });
		},
		[],
	);

	// Support tactile - mouvement - throttle a 60fps (16ms)
	const handleTouchMoveThrottled = useMemo(
		() =>
			throttle((e: React.TouchEvent) => {
				if (!isPaintingRef.current || !containerRef.current) return;

				const touch = e.touches[0];
				const element = document.elementFromPoint(touch.clientX, touch.clientY);

				if (element) {
					const cell = element.closest("[data-day][data-hour]");
					if (cell) {
						const day = cell.getAttribute("data-day") as DayOfWeek;
						const hour = parseInt(cell.getAttribute("data-hour") || "0");
						setSelectionEnd({ day, hour });
					}
				}
			}, 16),
		[],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			handleTouchMoveThrottled(e);
		},
		[handleTouchMoveThrottled],
	);

	// Support tactile - fin - memoise
	const handleTouchEnd = useCallback(() => {
		handleMouseUp();
	}, [handleMouseUp]);

	// Remplir toute une journee - memoise
	const handleDayClick = useCallback(
		(day: DayOfWeek) => {
			const newSchedule = { ...schedule };
			for (const d of DAYS_OF_WEEK) {
				newSchedule[d] = [...schedule[d]];
			}
			newSchedule[day] = Array(24)
				.fill(null)
				.map(() => ({ ...paintConfig }));
			onChange(newSchedule);
		},
		[schedule, paintConfig, onChange],
	);

	// Remplir toute une heure (tous les jours) - memoise
	const handleHourClick = useCallback(
		(hour: number) => {
			const newSchedule = { ...schedule };
			for (const day of DAYS_OF_WEEK) {
				newSchedule[day] = [...schedule[day]];
				newSchedule[day][hour] = { ...paintConfig };
			}
			onChange(newSchedule);
		},
		[schedule, paintConfig, onChange],
	);

	return (
		<>
			{/* Indicateur de selection flottant */}
			<SelectionIndicator
				start={selectionStart}
				end={selectionEnd}
				paintValue={loadLevel}
				isVisible={isPainting}
			/>

			{/* Grille calendrier */}
			<div
				ref={containerRef}
				className="select-none overflow-x-auto"
				onMouseLeave={handleMouseLeave}
				onMouseUp={handleMouseUp}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<table className="table table-xs border-collapse w-full">
					<thead>
						<tr>
							<th className="w-12 text-center bg-base-200">
								<span className="text-xs text-base-content/50">UTC</span>
							</th>
							{DAYS_OF_WEEK.map((day) => (
								<th
									key={day}
									className="text-center bg-base-200 px-1 cursor-pointer hover:bg-primary/10 transition-colors"
									onClick={() => handleDayClick(day)}
									title={`Cliquez pour remplir tout ${DAY_LABELS[day]} avec niveau ${loadLevel}`}
								>
									<span className="text-xs sm:text-sm">{DAY_LABELS[day]}</span>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{Array.from({ length: 24 }, (_, hour) => (
							<tr key={hour}>
								<td
									className="text-center text-xs bg-base-200 font-mono cursor-pointer hover:bg-primary/10 transition-colors"
									onClick={() => handleHourClick(hour)}
									title={`Cliquez pour remplir ${hour}h tous les jours avec niveau ${loadLevel}`}
								>
									{hour.toString().padStart(2, "0")}h
								</td>
								{DAYS_OF_WEEK.map((day) => {
									const cellKey = `${day}-${hour}`;
									const cellInfo = cellsDisplayInfo[day][hour];
									const inSelection = selectedCellsSet.has(cellKey);

									return (
										<CalendarCell
											key={cellKey}
											day={day}
											hour={hour}
											cellInfo={cellInfo}
											inSelection={inSelection}
											onMouseDown={handleMouseDown}
											onMouseEnter={handleMouseEnter}
											onTouchStart={handleTouchStart}
										/>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Instructions */}
			<p className="text-sm text-base-content/60 mt-2">
				Cliquez sur les en-tetes pour remplir une colonne/ligne entiere.
			</p>
		</>
	);
}
