import { useMemo } from 'react'
import { useInstances } from './useInstances'
import {
  useSelector,
  useSelectorWith,
  selectActiveProject,
  selectProjectById,
  selectProjects,
} from '@/store'
import { calculateProjectCost } from '@/lib/costCalculator'
import type { ProjectCostSummary } from '@/types'

/**
 * Hook pour calculer les couts du projet actif
 */
export function useActiveProjectCost(): ProjectCostSummary | null {
  const { data: instances } = useInstances()
  const activeProject = useSelector(selectActiveProject)

  return useMemo(() => {
    if (!activeProject || !instances) return null
    return calculateProjectCost(activeProject, instances)
  }, [activeProject, instances])
}

/**
 * Hook pour calculer les couts d'un projet specifique
 */
export function useProjectCost(projectId: string): ProjectCostSummary | null {
  const { data: instances } = useInstances()
  const project = useSelectorWith(selectProjectById, projectId)

  return useMemo(() => {
    if (!project || !instances) return null
    return calculateProjectCost(project, instances)
  }, [project, instances])
}

/**
 * Hook pour calculer les couts de tous les projets
 */
export function useAllProjectsCosts(): Map<string, ProjectCostSummary> {
  const { data: instances } = useInstances()
  const projects = useSelector(selectProjects)

  return useMemo(() => {
    const costsMap = new Map<string, ProjectCostSummary>()

    if (!instances) return costsMap

    for (const project of projects) {
      costsMap.set(project.id, calculateProjectCost(project, instances))
    }

    return costsMap
  }, [projects, instances])
}
