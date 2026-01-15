import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Project, RuntimeConfig, AddonConfig } from '@/types'

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

export interface ProjectState {
  // State
  projects: Project[]
  activeProjectId: string | null
}

export interface ProjectActions {
  // Project actions
  createProject: (name: string) => string
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

export type ProjectStore = ProjectState & ProjectActions

export const useProjectStore = create<ProjectStore>()(
  persist(
    immer((set) => ({
      projects: [],
      activeProjectId: null,

      // Project actions
      createProject: (name: string) => {
        const id = generateId()
        const timestamp = now()
        const newProject: Project = {
          id,
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
      version: 1,
    }
  )
)
