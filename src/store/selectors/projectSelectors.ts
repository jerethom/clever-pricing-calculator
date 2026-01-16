import type { ProjectState } from '../projectStore'
import type { Project } from '@/types'

// ============================================================================
// Selectors de base
// ============================================================================

/**
 * Selectionne la liste de tous les projets
 */
export const selectProjects = (state: ProjectState): Project[] => state.projects

// ============================================================================
// Selectors derives
// ============================================================================

/**
 * Selectionne le projet actif ou null si aucun projet n'est selectionne
 */
export const selectActiveProject = (state: ProjectState): Project | null =>
  state.projects.find(p => p.id === state.activeProjectId) ?? null

/**
 * Cree un selector pour selectionner un projet par son ID
 * @param id - L'ID du projet a selectionner
 */
export const selectProjectById =
  (id: string) =>
  (state: ProjectState): Project | undefined =>
    state.projects.find(p => p.id === id)
