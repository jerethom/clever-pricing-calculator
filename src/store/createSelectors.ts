import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useProjectStore } from './projectStore'
import type { ProjectStore, ProjectState } from './projectStore'

type Selector<T> = (state: ProjectState) => T
type SelectorFactory<TArgs extends unknown[], T> = (...args: TArgs) => Selector<T>

/**
 * Hook pour utiliser un selector simple avec le store
 * Optimise pour eviter les re-renders inutiles
 *
 * @example
 * const projects = useSelector(selectProjects)
 * const activeProject = useSelector(selectActiveProject)
 */
export function useSelector<T>(selector: Selector<T>): T {
  return useProjectStore(selector)
}

/**
 * Hook pour utiliser un selector avec des arguments
 * Le selector est memorise pour eviter les re-renders inutiles
 *
 * @example
 * const project = useSelectorWith(selectProjectById, projectId)
 * const runtime = useSelectorWith(selectRuntimeById, projectId, runtimeId)
 */
export function useSelectorWith<TArgs extends unknown[], T>(
  selectorFactory: SelectorFactory<TArgs, T>,
  ...args: TArgs
): T {
  // Memorise le selector pour eviter de le recreer a chaque render
  const selector = useMemo(
    () => selectorFactory(...args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectorFactory, ...args]
  )
  return useProjectStore(selector)
}

/**
 * Hook pour utiliser plusieurs selectors en une seule souscription
 * Utilise useShallow pour une comparaison superficielle et eviter les re-renders
 *
 * @example
 * const { projects, activeProjectId } = useSelectors(state => ({
 *   projects: selectProjects(state),
 *   activeProjectId: selectActiveProjectId(state)
 * }))
 */
export function useSelectors<T extends object>(
  selector: (state: ProjectState) => T
): T {
  return useProjectStore(useShallow(selector))
}

// Selector stable pour les actions (ne change jamais)
const selectActions = (state: ProjectStore) => ({
  // Organization actions
  createOrganization: state.createOrganization,
  updateOrganization: state.updateOrganization,
  deleteOrganization: state.deleteOrganization,
  setActiveOrganization: state.setActiveOrganization,
  // Project actions
  createProject: state.createProject,
  updateProject: state.updateProject,
  deleteProject: state.deleteProject,
  setActiveProject: state.setActiveProject,
  addRuntime: state.addRuntime,
  updateRuntime: state.updateRuntime,
  removeRuntime: state.removeRuntime,
  addAddon: state.addAddon,
  updateAddon: state.updateAddon,
  removeAddon: state.removeAddon,
})

/**
 * Hook pour acceder aux actions du store
 * Les actions ne changent jamais, donc pas de re-render inutile
 *
 * @example
 * const actions = useProjectActions()
 * actions.createProject('Mon projet')
 */
export function useProjectActions() {
  return useProjectStore(useShallow(selectActions))
}

/**
 * Hook pour acceder a une action specifique du store
 *
 * @example
 * const createProject = useProjectAction('createProject')
 * createProject('Mon projet')
 */
export function useProjectAction<K extends keyof ProjectStore>(
  actionName: K
): ProjectStore[K] {
  return useProjectStore(state => state[actionName])
}

/**
 * Hook combine pour acceder a l'etat et aux actions
 * Utilise useShallow pour optimiser les re-renders
 *
 * @example
 * const { projects, createProject } = useProjectStoreSelective(
 *   state => ({
 *     projects: state.projects,
 *     createProject: state.createProject
 *   })
 * )
 */
export function useProjectStoreSelective<T extends object>(
  selector: (state: ProjectStore) => T
): T {
  return useProjectStore(useShallow(selector))
}
