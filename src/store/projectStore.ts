import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Project, RuntimeConfig, AddonConfig, Organization } from '@/types'
import { DEFAULT_ORGANIZATION_ID, DEFAULT_ORGANIZATION_NAME } from '@/types'
import { ensureMigratedRuntime } from '@/lib/migration'

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export interface ProjectState {
  // State
  organizations: Organization[]
  projects: Project[]
  activeOrganizationId: string | null
  activeProjectId: string | null
}

export interface OrganizationActions {
  // Organization actions
  createOrganization: (name: string) => string
  updateOrganization: (id: string, updates: Partial<Pick<Organization, 'name'>>) => void
  deleteOrganization: (id: string) => void
  setActiveOrganization: (id: string | null) => void
}

export interface ProjectActions {
  // Project actions
  createProject: (organizationId: string, name: string) => string
  updateProject: (id: string, updates: Partial<Pick<Project, 'name'>>) => void
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void

  // Runtime actions
  addRuntime: (projectId: string, runtime: Omit<RuntimeConfig, 'id'>) => string
  updateRuntime: (projectId: string, runtimeId: string, updates: Partial<RuntimeConfig>) => void
  removeRuntime: (projectId: string, runtimeId: string) => void

  // Addon actions
  addAddon: (projectId: string, addon: Omit<AddonConfig, 'id'>) => string
  updateAddon: (projectId: string, addonId: string, updates: Partial<AddonConfig>) => void
  removeAddon: (projectId: string, addonId: string) => void
}

export type ProjectStore = ProjectState & OrganizationActions & ProjectActions

// Type pour la migration depuis la version 1
interface V1State {
  projects: Omit<Project, 'organizationId'>[]
  activeProjectId: string | null
}

// Organisation par defaut pour les nouveaux utilisateurs
function createDefaultOrganization(): Organization {
  const timestamp = now()
  return {
    id: DEFAULT_ORGANIZATION_ID,
    name: DEFAULT_ORGANIZATION_NAME,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    immer((set) => ({
      organizations: [createDefaultOrganization()],
      projects: [],
      activeOrganizationId: DEFAULT_ORGANIZATION_ID,
      activeProjectId: null,

      // Organization actions
      createOrganization: (name: string) => {
        const id = generateId()
        const timestamp = now()
        const newOrg: Organization = {
          id,
          name,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set(state => {
          state.organizations.push(newOrg)
          state.activeOrganizationId = id
          state.activeProjectId = null
        })
        return id
      },

      updateOrganization: (id: string, updates: Partial<Pick<Organization, 'name'>>) => {
        set(state => {
          const org = state.organizations.find(o => o.id === id)
          if (org) {
            Object.assign(org, updates)
            org.updatedAt = now()
          }
        })
      },

      deleteOrganization: (id: string) => {
        set(state => {
          const index = state.organizations.findIndex(o => o.id === id)
          if (index !== -1) {
            state.organizations.splice(index, 1)
            // Supprimer tous les projets de l'organisation
            state.projects = state.projects.filter(p => p.organizationId !== id)
          }
          if (state.activeOrganizationId === id) {
            state.activeOrganizationId = state.organizations[0]?.id ?? null
            state.activeProjectId = null
          }
        })
      },

      setActiveOrganization: (id: string | null) => {
        set(state => {
          state.activeOrganizationId = id
          state.activeProjectId = null
        })
      },

      // Project actions
      createProject: (organizationId: string, name: string) => {
        const id = generateId()
        const timestamp = now()
        const newProject: Project = {
          id,
          organizationId,
          name,
          createdAt: timestamp,
          updatedAt: timestamp,
          runtimes: [],
          addons: [],
        }
        set(state => {
          state.projects.push(newProject)
          state.activeProjectId = id
        })
        return id
      },

      updateProject: (id: string, updates: Partial<Pick<Project, 'name'>>) => {
        set(state => {
          const project = state.projects.find(p => p.id === id)
          if (project) {
            Object.assign(project, updates)
            project.updatedAt = now()
          }
        })
      },

      deleteProject: (id: string) => {
        set(state => {
          const index = state.projects.findIndex(p => p.id === id)
          if (index !== -1) {
            state.projects.splice(index, 1)
          }
          if (state.activeProjectId === id) {
            state.activeProjectId = null
          }
        })
      },

      setActiveProject: (id: string | null) => {
        set(state => {
          state.activeProjectId = id
        })
      },

      // Runtime actions
      addRuntime: (projectId: string, runtime: Omit<RuntimeConfig, 'id'>) => {
        const id = generateId()
        set(state => {
          const project = state.projects.find(p => p.id === projectId)
          if (project) {
            project.runtimes.push({ ...runtime, id })
            project.updatedAt = now()
          }
        })
        return id
      },

      updateRuntime: (projectId: string, runtimeId: string, updates: Partial<RuntimeConfig>) => {
        set(state => {
          const project = state.projects.find(p => p.id === projectId)
          if (project) {
            const runtime = project.runtimes.find(r => r.id === runtimeId)
            if (runtime) {
              Object.assign(runtime, updates)
              project.updatedAt = now()
            }
          }
        })
      },

      removeRuntime: (projectId: string, runtimeId: string) => {
        set(state => {
          const project = state.projects.find(p => p.id === projectId)
          if (project) {
            const index = project.runtimes.findIndex(r => r.id === runtimeId)
            if (index !== -1) {
              project.runtimes.splice(index, 1)
              project.updatedAt = now()
            }
          }
        })
      },

      // Addon actions
      addAddon: (projectId: string, addon: Omit<AddonConfig, 'id'>) => {
        const id = generateId()
        set(state => {
          const project = state.projects.find(p => p.id === projectId)
          if (project) {
            project.addons.push({ ...addon, id })
            project.updatedAt = now()
          }
        })
        return id
      },

      updateAddon: (projectId: string, addonId: string, updates: Partial<AddonConfig>) => {
        set(state => {
          const project = state.projects.find(p => p.id === projectId)
          if (project) {
            const addon = project.addons.find(a => a.id === addonId)
            if (addon) {
              Object.assign(addon, updates)
              project.updatedAt = now()
            }
          }
        })
      },

      removeAddon: (projectId: string, addonId: string) => {
        set(state => {
          const project = state.projects.find(p => p.id === projectId)
          if (project) {
            const index = project.addons.findIndex(a => a.id === addonId)
            if (index !== -1) {
              project.addons.splice(index, 1)
              project.updatedAt = now()
            }
          }
        })
      },
    })),
    {
      name: 'clever-pricing-projects',
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as ProjectState

        // Migration v1 -> v2 : Ajout des organisations
        if (version === 1) {
          const v1State = persistedState as V1State
          const timestamp = now()

          // Creer l'organisation par defaut
          const defaultOrg: Organization = {
            id: DEFAULT_ORGANIZATION_ID,
            name: DEFAULT_ORGANIZATION_NAME,
            createdAt: timestamp,
            updatedAt: timestamp,
          }

          // Migrer les projets existants vers l'org par defaut
          const migratedProjects: Project[] = v1State.projects.map(project => ({
            ...project,
            organizationId: DEFAULT_ORGANIZATION_ID,
          }))

          state = {
            organizations: [defaultOrg],
            projects: migratedProjects,
            activeOrganizationId: DEFAULT_ORGANIZATION_ID,
            activeProjectId: v1State.activeProjectId,
          }
        }

        // Migration v2 -> v3 : Nouveau format RuntimeConfig avec scalingEnabled
        if (version <= 2) {
          state.projects = state.projects.map(project => ({
            ...project,
            runtimes: project.runtimes.map(runtime => ensureMigratedRuntime(runtime)),
          }))
        }

        return state
      },
    }
  )
)
