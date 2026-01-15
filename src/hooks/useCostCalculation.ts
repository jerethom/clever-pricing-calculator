import { useMemo } from 'react'
import { useInstances } from './useInstances'
import { useProjectStore } from '@/store/projectStore'
import { calculateProjectCost } from '@/lib/costCalculator'
import type { ProjectCostSummary } from '@/types'

/**
 * Hook pour calculer les coûts du projet actif
 */
export function useActiveProjectCost(): ProjectCostSummary | null {
  const { data: instances } = useInstances()
  const activeProject = useProjectStore(state => state.getActiveProject())

  return useMemo(() => {
    if (!activeProject || !instances) return null
    return calculateProjectCost(activeProject, instances)
  }, [activeProject, instances])
}

/**
 * Hook pour calculer les coûts d'un projet spécifique
 */
export function useProjectCost(projectId: string): ProjectCostSummary | null {
  const { data: instances } = useInstances()
  const project = useProjectStore(state => state.getProject(projectId))

  return useMemo(() => {
    if (!project || !instances) return null
    return calculateProjectCost(project, instances)
  }, [project, instances])
}

/**
 * Hook pour calculer les coûts de tous les projets
 */
export function useAllProjectsCosts(): Map<string, ProjectCostSummary> {
  const { data: instances } = useInstances()
  const projects = useProjectStore(state => state.projects)

  return useMemo(() => {
    const costsMap = new Map<string, ProjectCostSummary>()

    if (!instances) return costsMap

    for (const project of projects) {
      costsMap.set(project.id, calculateProjectCost(project, instances))
    }

    return costsMap
  }, [projects, instances])
}
