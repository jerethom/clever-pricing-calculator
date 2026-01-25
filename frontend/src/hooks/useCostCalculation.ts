import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import type { Instance } from "@/api/types";
import { calculateProjectCost } from "@/lib/costCalculator";
import {
  selectActiveOrganizationProjects,
  selectProjectById,
  selectProjects,
  useSelector,
  useSelectorWith,
} from "@/store";
import { useProjectStore } from "@/store/projectStore";
import type { Project, ProjectCostSummary } from "@/types";
import { useInstances } from "./useInstances";

function collectDescendantIds(projects: Project[], parentId: string): string[] {
  const ids: string[] = [];
  for (const p of projects) {
    if (p.parentProjectId === parentId) {
      ids.push(p.id);
      ids.push(...collectDescendantIds(projects, p.id));
    }
  }
  return ids;
}

function aggregateCosts(
  relevantProjects: Project[],
  instances: Instance[],
): Omit<ProjectCostSummary, "projectId" | "projectName"> {
  let totalMonthlyCost = 0;
  let runtimesCost = 0;
  let addonsCost = 0;
  const runtimesDetail: ProjectCostSummary["runtimesDetail"] = [];
  const addonsDetail: ProjectCostSummary["addonsDetail"] = [];

  for (const p of relevantProjects) {
    const cost = calculateProjectCost(p, instances);
    totalMonthlyCost += cost.totalMonthlyCost;
    runtimesCost += cost.runtimesCost;
    addonsCost += cost.addonsCost;
    runtimesDetail.push(...cost.runtimesDetail);
    addonsDetail.push(...cost.addonsDetail);
  }

  return {
    totalMonthlyCost,
    runtimesCost,
    addonsCost,
    runtimesDetail,
    addonsDetail,
  };
}

function buildCostsMapWithDescendants(
  projects: Project[],
  instances: Instance[],
): Map<string, ProjectCostSummary> {
  const costsMap = new Map<string, ProjectCostSummary>();

  for (const project of projects) {
    const descendantIds = collectDescendantIds(projects, project.id);
    const allProjectIds = new Set([project.id, ...descendantIds]);
    const relevantProjects = projects.filter((p) => allProjectIds.has(p.id));

    const aggregated = aggregateCosts(relevantProjects, instances);
    costsMap.set(project.id, {
      projectId: project.id,
      projectName: project.name,
      ...aggregated,
    });
  }

  return costsMap;
}

export function useProjectCost(projectId: string): ProjectCostSummary | null {
  const { data: instances } = useInstances();
  const project = useSelectorWith(selectProjectById, projectId);

  return useMemo(() => {
    if (!project || !instances) return null;
    return calculateProjectCost(project, instances);
  }, [project, instances]);
}

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

export function useAllProjectsCostsWithDescendants(): Map<
  string,
  ProjectCostSummary
> {
  const { data: instances } = useInstances();
  const projects = useSelector(selectProjects);

  return useMemo(() => {
    if (!instances) return new Map<string, ProjectCostSummary>();
    return buildCostsMapWithDescendants(projects, instances);
  }, [projects, instances]);
}

export function useActiveOrganizationCosts(): Map<string, ProjectCostSummary> {
  const { data: instances } = useInstances();
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

export function useActiveOrganizationCostsWithDescendants(): Map<
  string,
  ProjectCostSummary
> {
  const { data: instances } = useInstances();
  const orgProjects = useProjectStore(
    useShallow(selectActiveOrganizationProjects),
  );

  return useMemo(() => {
    if (!instances) return new Map<string, ProjectCostSummary>();
    return buildCostsMapWithDescendants(orgProjects, instances);
  }, [orgProjects, instances]);
}

export function useProjectCostWithDescendants(
  projectId: string,
): ProjectCostSummary | null {
  const { data: instances } = useInstances();
  const projects = useSelector(selectProjects);

  return useMemo(() => {
    if (!instances) return null;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    const descendantIds = collectDescendantIds(projects, projectId);
    const allProjectIds = new Set([projectId, ...descendantIds]);
    const relevantProjects = projects.filter((p) => allProjectIds.has(p.id));

    const aggregated = aggregateCosts(relevantProjects, instances);
    return {
      projectId: project.id,
      projectName: project.name,
      ...aggregated,
    };
  }, [projectId, projects, instances]);
}
