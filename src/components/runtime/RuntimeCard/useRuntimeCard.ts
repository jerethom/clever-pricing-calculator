import { useCallback, useMemo, useState } from "react";
import { useInstances } from "@/hooks/useInstances";
import {
	buildFlavorPriceMap,
	calculateRuntimeCost,
	getAvailableFlavors,
} from "@/lib/costCalculator";
import { generateProfileId } from "@/lib/typeid";
import { useProjectActions } from "@/store";
import type {
	BaselineConfig,
	RuntimeConfig,
	ScalingProfile,
	WeeklySchedule,
} from "@/types";
import {
	createEmptySchedule,
	createFilledSchedule,
	DAYS_OF_WEEK,
	getBaseConfig,
} from "@/types";

interface UseRuntimeCardOptions {
	projectId: string;
	runtime: RuntimeConfig;
}

export function useRuntimeCard({ projectId, runtime }: UseRuntimeCardOptions) {
	const { data: instances } = useInstances();
	const { removeRuntime, updateRuntime } = useProjectActions();

	// Etats locaux
	const [showTimeSlots, setShowTimeSlots] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showFlavorPicker, setShowFlavorPicker] = useState(false);
	const [isEditingName, setIsEditingName] = useState(false);
	const [editName, setEditName] = useState("");

	// Retrouver l'instance par le logo (unique pour chaque variant)
	const instance = useMemo(
		() => instances?.find((i) => i.variant.logo === runtime.variantLogo),
		[instances, runtime.variantLogo],
	);

	// Extraire la configuration de base depuis baselineConfig
	const baseConfig = useMemo(
		() => getBaseConfig(runtime.baselineConfig),
		[runtime.baselineConfig],
	);

	const defaultName = useMemo(
		() => instance?.name ?? runtime.instanceType,
		[instance?.name, runtime.instanceType],
	);

	const currentFlavor = useMemo(
		() => instance?.flavors.find((f) => f.name === baseConfig.flavorName),
		[instance?.flavors, baseConfig.flavorName],
	);

	const flavorPrices = useMemo(
		() =>
			instances
				? buildFlavorPriceMap(instances, runtime.instanceType)
				: new Map<string, number>(),
		[instances, runtime.instanceType],
	);

	const availableFlavors = useMemo(
		() =>
			instances ? getAvailableFlavors(instances, runtime.instanceType) : [],
		[instances, runtime.instanceType],
	);

	const cost = useMemo(
		() => calculateRuntimeCost(runtime, flavorPrices, availableFlavors),
		[runtime, flavorPrices, availableFlavors],
	);

	// Calcul de la position de la jauge
	const gaugePosition = useMemo(
		() =>
			cost.maxMonthlyCost > cost.minMonthlyCost
				? ((cost.estimatedTotalCost - cost.minMonthlyCost) /
						(cost.maxMonthlyCost - cost.minMonthlyCost)) *
					100
				: 0,
		[cost.maxMonthlyCost, cost.minMonthlyCost, cost.estimatedTotalCost],
	);

	// Profils de scaling actifs
	const activeScalingProfiles = useMemo(
		() => (runtime.scalingProfiles ?? []).filter((p) => p.enabled),
		[runtime.scalingProfiles],
	);

	const hasScaling = activeScalingProfiles.length > 0;

	// Handlers du nom
	const handleStartEditName = useCallback(() => {
		setEditName(runtime.instanceName);
		setIsEditingName(true);
	}, [runtime.instanceName]);

	const handleSaveEditName = useCallback(() => {
		if (editName.trim()) {
			updateRuntime(projectId, runtime.id, { instanceName: editName.trim() });
		}
		setIsEditingName(false);
	}, [editName, updateRuntime, projectId, runtime.id]);

	const handleCancelEditName = useCallback(() => {
		setIsEditingName(false);
	}, []);

	const handleResetName = useCallback(() => {
		updateRuntime(projectId, runtime.id, { instanceName: defaultName });
		setIsEditingName(false);
	}, [updateRuntime, projectId, runtime.id, defaultName]);

	const handleEditNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setEditName(e.target.value);
		},
		[],
	);

	const handleEditNameKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") handleSaveEditName();
			if (e.key === "Escape") handleCancelEditName();
		},
		[handleSaveEditName, handleCancelEditName],
	);

	// Handler flavor - modifie le baselineConfig
	const handleFlavorChange = useCallback(
		(flavorName: string) => {
			const newBaselineConfig: BaselineConfig = {
				...runtime.baselineConfig,
				flavorName,
			};
			updateRuntime(projectId, runtime.id, {
				baselineConfig: newBaselineConfig,
			});
		},
		[runtime.baselineConfig, updateRuntime, projectId, runtime.id],
	);

	// Handler base instances - modifie le baselineConfig
	const handleBaseInstancesChange = useCallback(
		(value: number) => {
			const newBaselineConfig: BaselineConfig = {
				...runtime.baselineConfig,
				instances: value,
			};
			updateRuntime(projectId, runtime.id, {
				baselineConfig: newBaselineConfig,
			});
		},
		[runtime.baselineConfig, updateRuntime, projectId, runtime.id],
	);

	// Handler switch scaling mode
	const handleToggleScaling = useCallback(
		(enabled: boolean) => {
			if (enabled) {
				// Créer un profil de scaling par défaut si aucun n'existe
				const existingProfiles = runtime.scalingProfiles ?? [];
				const hasScalingProfile = existingProfiles.some((p) => p.enabled);

				if (!hasScalingProfile) {
					// Créer un profil de scaling par défaut avec TypeID
					const newProfileId = generateProfileId();
					const defaultProfile: ScalingProfile = {
						id: newProfileId,
						name: "Standard",
						minInstances: baseConfig.instances,
						maxInstances: Math.min(
							baseConfig.instances * 2,
							instance?.maxInstances ?? 40,
						),
						minFlavorName: baseConfig.flavorName,
						maxFlavorName: baseConfig.flavorName,
						enabled: true,
					};
					// Créer un planning rempli avec le nouveau profil à niveau 0
					const schedule =
						runtime.weeklySchedule ?? createFilledSchedule(newProfileId, 0);

					updateRuntime(projectId, runtime.id, {
						scalingEnabled: true,
						scalingProfiles: [...existingProfiles, defaultProfile],
						weeklySchedule: schedule,
					});
				} else {
					// Conserver le planning existant ou en créer un vide
					const schedule = runtime.weeklySchedule ?? createEmptySchedule();
					updateRuntime(projectId, runtime.id, {
						scalingEnabled: true,
						weeklySchedule: schedule,
					});
				}

				// Ouvrir automatiquement le planning
				setShowTimeSlots(true);
			} else {
				// Fermer le planning quand on désactive le scaling
				// Conserver les profils et le planning pour pouvoir les réutiliser
				setShowTimeSlots(false);
				updateRuntime(projectId, runtime.id, {
					scalingEnabled: false,
				});
			}
		},
		[
			updateRuntime,
			projectId,
			runtime.id,
			runtime.scalingProfiles,
			runtime.weeklySchedule,
			baseConfig,
			instance?.maxInstances,
		],
	);

	// Handler profils de scaling
	const handleUpdateScalingProfile = useCallback(
		(profileId: string, updates: Partial<ScalingProfile>) => {
			const newProfiles = (runtime.scalingProfiles ?? []).map((p) =>
				p.id === profileId ? { ...p, ...updates } : p,
			);
			updateRuntime(projectId, runtime.id, { scalingProfiles: newProfiles });
		},
		[runtime.scalingProfiles, updateRuntime, projectId, runtime.id],
	);

	const handleAddScalingProfile = useCallback(
		(profile: ScalingProfile) => {
			const newProfiles = [...(runtime.scalingProfiles ?? []), profile];
			updateRuntime(projectId, runtime.id, { scalingProfiles: newProfiles });
		},
		[runtime.scalingProfiles, updateRuntime, projectId, runtime.id],
	);

	const handleRemoveScalingProfile = useCallback(
		(profileId: string) => {
			// Ne pas supprimer le dernier profil de scaling actif
			const activeProfiles = (runtime.scalingProfiles ?? []).filter(
				(p) => p.enabled,
			);
			if (activeProfiles.length <= 1) return;

			const newProfiles = (runtime.scalingProfiles ?? []).filter(
				(p) => p.id !== profileId,
			);

			// Réinitialiser les cellules qui utilisaient ce profil (profileId = null = baseline)
			const currentSchedule = runtime.weeklySchedule ?? createEmptySchedule();
			const newSchedule: WeeklySchedule = {} as WeeklySchedule;

			for (const day of DAYS_OF_WEEK) {
				newSchedule[day] = currentSchedule[day].map((config) => {
					if (config.profileId === profileId) {
						return { profileId: null, loadLevel: 0 as const };
					}
					return config;
				});
			}

			updateRuntime(projectId, runtime.id, {
				scalingProfiles: newProfiles,
				weeklySchedule: newSchedule,
			});
		},
		[
			runtime.scalingProfiles,
			runtime.weeklySchedule,
			updateRuntime,
			projectId,
			runtime.id,
		],
	);

	// Handler suppression
	const handleDelete = useCallback(() => {
		removeRuntime(projectId, runtime.id);
		setShowDeleteConfirm(false);
	}, [removeRuntime, projectId, runtime.id]);

	// Toggles
	const handleToggleTimeSlots = useCallback(() => {
		setShowTimeSlots((prev) => !prev);
	}, []);

	const handleOpenFlavorPicker = useCallback(() => {
		setShowFlavorPicker(true);
	}, []);

	const handleCloseFlavorPicker = useCallback(() => {
		setShowFlavorPicker(false);
	}, []);

	const handleOpenDeleteConfirm = useCallback(() => {
		setShowDeleteConfirm(true);
	}, []);

	const handleCloseDeleteConfirm = useCallback(() => {
		setShowDeleteConfirm(false);
	}, []);

	return {
		// Données derivées
		instance,
		defaultName,
		currentFlavor,
		cost,
		gaugePosition,
		hasScaling,
		activeScalingProfiles,
		availableFlavors,
		// Configuration de base (depuis baselineConfig)
		baseConfig,

		// Etat d'édition du nom
		isEditingName,
		editName,
		setEditName,

		// Handlers nom
		onStartEditName: handleStartEditName,
		onSaveEditName: handleSaveEditName,
		onCancelEditName: handleCancelEditName,
		onResetName: handleResetName,
		onEditNameChange: handleEditNameChange,
		onEditNameKeyDown: handleEditNameKeyDown,

		// Handlers flavor
		onFlavorChange: handleFlavorChange,
		showFlavorPicker,
		onOpenFlavorPicker: handleOpenFlavorPicker,
		onCloseFlavorPicker: handleCloseFlavorPicker,

		// Handler base instances
		onBaseInstancesChange: handleBaseInstancesChange,

		// Handler scaling mode
		onToggleScaling: handleToggleScaling,

		// Handlers profils
		onUpdateScalingProfile: handleUpdateScalingProfile,
		onAddScalingProfile: handleAddScalingProfile,
		onRemoveScalingProfile: handleRemoveScalingProfile,

		// Handler suppression
		onDelete: handleDelete,
		showDeleteConfirm,
		onOpenDeleteConfirm: handleOpenDeleteConfirm,
		onCloseDeleteConfirm: handleCloseDeleteConfirm,

		// Planning
		showTimeSlots,
		onToggleTimeSlots: handleToggleTimeSlots,
	};
}
