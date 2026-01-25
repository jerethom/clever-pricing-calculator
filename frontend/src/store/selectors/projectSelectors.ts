import type { Project } from "@/types";
import type { ProjectState } from "../projectStore";

// ============================================================================
// Selectors de base
// ============================================================================

/**
 * Selectionne la liste de tous les projets
 */
export const selectProjects = (state: ProjectState): Project[] =>
  state.projects;

// ============================================================================
// Selectors derives
// ============================================================================

/**
 * Selectionne le projet actif ou null si aucun projet n'est selectionne
 */
export const selectActiveProject = (state: ProjectState): Project | null =>
  state.projects.find((p) => p.id === state.activeProjectId) ?? null;

/**
 * Cree un selector pour selectionner un projet par son ID
 * @param id - L'ID du projet a selectionner
 */
export const selectProjectById =
  (id: string) =>
  (state: ProjectState): Project | undefined =>
    state.projects.find((p) => p.id === id);

// ============================================================================
// Selectors hierarchiques
// ============================================================================

/**
 * Selectionne les projets racines d'une organisation (sans parent)
 */
export const selectRootProjects =
  (organizationId: string) =>
  (state: ProjectState): Project[] =>
    state.projects.filter(
      (p) => p.organizationId === organizationId && !p.parentProjectId,
    );

/**
 * Selectionne les sous-projets d'un projet parent
 */
export const selectChildProjects =
  (parentProjectId: string) =>
  (state: ProjectState): Project[] =>
    state.projects.filter((p) => p.parentProjectId === parentProjectId);

/**
 * Selectionne un projet avec tous ses descendants (recursif)
 */
export const selectProjectWithDescendants =
  (projectId: string) =>
  (state: ProjectState): Project[] => {
    const result: Project[] = [];
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return result;

    result.push(project);

    const addDescendants = (parentId: string) => {
      const children = state.projects.filter(
        (p) => p.parentProjectId === parentId,
      );
      for (const child of children) {
        result.push(child);
        addDescendants(child.id);
      }
    };

    addDescendants(projectId);
    return result;
  };

/**
 * Calcule la profondeur d'un projet dans la hierarchie
 */
export const selectProjectDepth =
  (projectId: string) =>
  (state: ProjectState): number => {
    let depth = 0;
    let currentId: string | undefined = projectId;

    while (currentId) {
      const project = state.projects.find((p) => p.id === currentId);
      if (!project?.parentProjectId) break;
      depth++;
      currentId = project.parentProjectId;
    }

    return depth;
  };

/**
 * Verifie si un projet a des enfants
 */
export const selectHasChildren =
  (projectId: string) =>
  (state: ProjectState): boolean =>
    state.projects.some((p) => p.parentProjectId === projectId);
