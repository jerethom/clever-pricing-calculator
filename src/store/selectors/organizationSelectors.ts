import type { ProjectState } from '../projectStore'
import type { Organization, Project } from '@/types'

// ============================================================================
// Selectors de base Organisation
// ============================================================================

/**
 * Selectionne la liste de toutes les organisations
 */
export const selectOrganizations = (state: ProjectState): Organization[] =>
  state.organizations

/**
 * Selectionne l'ID de l'organisation active
 */
export const selectActiveOrganizationId = (state: ProjectState): string | null =>
  state.activeOrganizationId

/**
 * Selectionne l'organisation active ou null
 */
export const selectActiveOrganization = (state: ProjectState): Organization | null =>
  state.organizations.find(o => o.id === state.activeOrganizationId) ?? null

/**
 * Cree un selector pour selectionner une organisation par son ID
 */
export const selectOrganizationById =
  (id: string) =>
  (state: ProjectState): Organization | undefined =>
    state.organizations.find(o => o.id === id)

/**
 * Selectionne le nombre total d'organisations
 */
export const selectOrganizationsCount = (state: ProjectState): number =>
  state.organizations.length

// ============================================================================
// Selectors derives Organisation -> Projets
// ============================================================================

/**
 * Selectionne les projets de l'organisation active
 */
export const selectActiveOrganizationProjects = (state: ProjectState): Project[] =>
  state.projects.filter(p => p.organizationId === state.activeOrganizationId)

/**
 * Cree un selector pour selectionner les projets d'une organisation specifique
 */
export const selectProjectsByOrganization =
  (organizationId: string) =>
  (state: ProjectState): Project[] =>
    state.projects.filter(p => p.organizationId === organizationId)

/**
 * Selectionne le nombre de projets de l'organisation active
 */
export const selectActiveOrganizationProjectsCount = (state: ProjectState): number =>
  state.projects.filter(p => p.organizationId === state.activeOrganizationId).length

/**
 * Verifie si une organisation est actuellement selectionnee
 */
export const selectHasActiveOrganization = (state: ProjectState): boolean =>
  state.activeOrganizationId !== null

/**
 * Verifie si le store contient des organisations
 */
export const selectHasOrganizations = (state: ProjectState): boolean =>
  state.organizations.length > 0
