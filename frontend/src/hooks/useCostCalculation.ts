import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { calculateProjectCost } from "@/lib/costCalculator";
import {
  selectActiveOrganizationProjects,
  selectProjectById,
  selectProjects,
  useSelector,
  useSelectorWith,
} from "@/store";
import { useProjectStore } from "@/store/projectStore";
import type { ProjectCostSummary } from "@/types";
import { useInstances } from "./useInstances";

/**
 * Hook pour calculer les couts d'un projet specifique
 */
export function useProjectCost(projectId: string): ProjectCostSummary | null {
  const { data: instances } = useInstances();
  const project = useSelectorWith(selectProjectById, projectId);

  return useMemo(() => {
    if (!project || !instances) return null;
    return calculateProjectCost(project, instances);
  }, [project, instances]);
}

/**
 * Hook pour calculer les couts de tous les projets
 */
export function useAllProjectsCosts(): Map<string, ProjectCostSummary> {
  const { data: instances } = useInstances();
  const projects = useSelector(selectProjects);

  return useMemo(() => {
    const costsMap = new Map<string, ProjectCostSummary>();

    if (!instances) return costsMap;

    for (const project of projects) {
      costsMap.set(project.id, calculateProjectCost(project, instances));
    }

    return costsMap;
  }, [projects, instances]);
}

/**
 * Hook pour calculer les couts des projets de l'organisation active
 */
export function useActiveOrganizationCosts(): Map<string, ProjectCostSummary> {
  const { data: instances } = useInstances();
  // Utiliser useShallow pour eviter les re-renders quand le tableau est recree mais identique
  const orgProjects = useProjectStore(
    useShallow(selectActiveOrganizationProjects),
  );

  return useMemo(() => {
    const costsMap = new Map<string, ProjectCostSummary>();

    if (!instances) return costsMap;

    for (const project of orgProjects) {
      costsMap.set(project.id, calculateProjectCost(project, instances));
    }

    return costsMap;
  }, [orgProjects, instances]);
}
