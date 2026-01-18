import type { Organization, Project } from "@/types";
import type { ProjectState } from "../projectStore";

// ============================================================================
// Selectors de base Organisation
// ============================================================================

/**
 * Selectionne la liste de toutes les organisations
 */
export const selectOrganizations = (state: ProjectState): Organization[] =>
  state.organizations;

/**
 * Selectionne l'organisation active ou null
 */
export const selectActiveOrganization = (
  state: ProjectState,
): Organization | null =>
  state.organizations.find((o) => o.id === state.activeOrganizationId) ?? null;

// ============================================================================
// Selectors derives Organisation -> Projets
// ============================================================================

/**
 * Selectionne les projets de l'organisation active
 */
export const selectActiveOrganizationProjects = (
  state: ProjectState,
): Project[] =>
  state.projects.filter((p) => p.organizationId === state.activeOrganizationId);
