import type { Instance, InstanceFlavor } from "@/api/types";
import type { RuntimeConfig, RuntimeCostDetail, ScalingProfile } from "@/types";

/**
 * Props du composant principal RuntimeCard
 */
export interface RuntimeCardProps {
	projectId: string;
	runtime: RuntimeConfig;
}

/**
 * Contexte partagé entre les sous-composants RuntimeCard
 */
export interface RuntimeCardContextValue {
	// Données
	projectId: string;
	runtime: RuntimeConfig;
	instance: Instance | undefined;
	currentFlavor: InstanceFlavor | undefined;
	cost: RuntimeCostDetail;
	gaugePosition: number;
	defaultName: string;
	hasScaling: boolean;
	activeScalingProfiles: ScalingProfile[];
	availableFlavors: InstanceFlavor[];
	// Configuration de base (depuis baselineConfig)
	baseConfig: { instances: number; flavorName: string };

	// Etat d'édition du nom
	isEditingName: boolean;
	editName: string;
	setEditName: (name: string) => void;

	// Handlers du nom
	onStartEditName: () => void;
	onSaveEditName: () => void;
	onCancelEditName: () => void;
	onResetName: () => void;
	onEditNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onEditNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

	// Handlers configuration
	onOpenFlavorPicker: () => void;
	onFlavorChange: (flavorName: string) => void;

	// Handler base instances
	onBaseInstancesChange: (value: number) => void;

	// Handler scaling mode
	onToggleScaling: (enabled: boolean) => void;

	// Handlers profils de scaling
	onUpdateScalingProfile: (
		profileId: string,
		updates: Partial<ScalingProfile>,
	) => void;
	onAddScalingProfile: (profile: ScalingProfile) => void;
	onRemoveScalingProfile: (profileId: string) => void;

	// Handlers planning
	showTimeSlots: boolean;
	onToggleTimeSlots: () => void;

	// Handlers suppression
	onOpenDeleteConfirm: () => void;
}

/**
 * Props pour RuntimeCardScaling
 */
export interface RuntimeCardScalingProps {
	className?: string;
}

/**
 * Props pour RuntimeCardSchedule
 */
export interface RuntimeCardScheduleProps {
	className?: string;
}

/**
 * Props pour RuntimeCardIdentity
 */
export interface RuntimeCardIdentityProps {
	className?: string;
}

/**
 * Props pour RuntimeCardQuickConfig
 */
export interface RuntimeCardQuickConfigProps {
	className?: string;
}

/**
 * Props pour RuntimeCardAdvanced
 */
export interface RuntimeCardAdvancedProps {
	className?: string;
}
