import type { AddonFeature } from "@/api/types";
import { PRIORITY_FEATURES } from "@/constants";

/**
 * Trie les features par priorite pour un affichage coherent.
 * Les features prioritaires (memory, disk, vcpus, etc.) apparaissent en premier.
 */
export function sortFeaturesByPriority(
	features: AddonFeature[],
): AddonFeature[] {
	return [...features].sort((a, b) => {
		const aIndex = PRIORITY_FEATURES.findIndex((p) =>
			a.name_code?.toLowerCase().includes(p),
		);
		const bIndex = PRIORITY_FEATURES.findIndex((p) =>
			b.name_code?.toLowerCase().includes(p),
		);
		// Si les deux ont une priorite, trier par priorite
		if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
		// Les features prioritaires viennent en premier
		if (aIndex !== -1) return -1;
		if (bIndex !== -1) return 1;
		// Sinon garder l'ordre original
		return 0;
	});
}
