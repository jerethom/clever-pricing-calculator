import type { ProjectState } from '../projectStore'
import type { Project, RuntimeConfig, AddonConfig } from '@/types'

// ============================================================================
// Selectors de base
// ============================================================================

/**
 * Selectionne la liste de tous les projets
 */
export const selectProjects = (state: ProjectState): Project[] => state.projects

/**
 * Selectionne l'ID du projet actif
 */
export const selectActiveProjectId = (state: ProjectState): string | null =>
  state.activeProjectId

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

/**
 * Selectionne les runtimes du projet actif
 */
export const selectActiveProjectRuntimes = (state: ProjectState): RuntimeConfig[] =>
  selectActiveProject(state)?.runtimes ?? []

/**
 * Selectionne les addons du projet actif
 */
export const selectActiveProjectAddons = (state: ProjectState): AddonConfig[] =>
  selectActiveProject(state)?.addons ?? []

/**
 * Selectionne le nombre total de projets
 */
export const selectProjectsCount = (state: ProjectState): number => state.projects.length

// ============================================================================
// Selectors derives avances
// ============================================================================

/**
 * Cree un selector pour selectionner les runtimes d'un projet specifique
 * @param projectId - L'ID du projet
 */
export const selectProjectRuntimes =
  (projectId: string) =>
  (state: ProjectState): RuntimeConfig[] =>
    state.projects.find(p => p.id === projectId)?.runtimes ?? []

/**
 * Cree un selector pour selectionner les addons d'un projet specifique
 * @param projectId - L'ID du projet
 */
export const selectProjectAddons =
  (projectId: string) =>
  (state: ProjectState): AddonConfig[] =>
    state.projects.find(p => p.id === projectId)?.addons ?? []

/**
 * Cree un selector pour selectionner un runtime specifique d'un projet
 * @param projectId - L'ID du projet
 * @param runtimeId - L'ID du runtime
 */
export const selectRuntimeById =
  (projectId: string, runtimeId: string) =>
  (state: ProjectState): RuntimeConfig | undefined =>
    state.projects.find(p => p.id === projectId)?.runtimes.find(r => r.id === runtimeId)

/**
 * Cree un selector pour selectionner un addon specifique d'un projet
 * @param projectId - L'ID du projet
 * @param addonId - L'ID de l'addon
 */
export const selectAddonById =
  (projectId: string, addonId: string) =>
  (state: ProjectState): AddonConfig | undefined =>
    state.projects.find(p => p.id === projectId)?.addons.find(a => a.id === addonId)

/**
 * Selectionne le nombre de runtimes du projet actif
 */
export const selectActiveProjectRuntimesCount = (state: ProjectState): number =>
  selectActiveProject(state)?.runtimes.length ?? 0

/**
 * Selectionne le nombre d'addons du projet actif
 */
export const selectActiveProjectAddonsCount = (state: ProjectState): number =>
  selectActiveProject(state)?.addons.length ?? 0

/**
 * Verifie si un projet est actuellement selectionne
 */
export const selectHasActiveProject = (state: ProjectState): boolean =>
  state.activeProjectId !== null

/**
 * Verifie si le store contient des projets
 */
export const selectHasProjects = (state: ProjectState): boolean =>
  state.projects.length > 0
