import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, RuntimeConfig, AddonConfig } from '@/types'

function generateId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

interface ProjectStore {
  // State
  projects: Project[]
  activeProjectId: string | null

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

  // Computed
  getActiveProject: () => Project | null
  getProject: (id: string) => Project | undefined
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
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
        set(state => ({
          projects: [...state.projects, newProject],
          activeProjectId: id,
        }))
        return id
      },

      updateProject: (id: string, updates: Partial<Pick<Project, 'name'>>) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: now() } : p
          ),
        }))
      },

      deleteProject: (id: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }))
      },

      setActiveProject: (id: string | null) => {
        set({ activeProjectId: id })
      },

      // Runtime actions
      addRuntime: (projectId: string, runtime: Omit<RuntimeConfig, 'id'>) => {
        const id = generateId()
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  runtimes: [...p.runtimes, { ...runtime, id }],
                  updatedAt: now(),
                }
              : p
          ),
        }))
        return id
      },

      updateRuntime: (projectId: string, runtimeId: string, updates: Partial<RuntimeConfig>) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  runtimes: p.runtimes.map(r =>
                    r.id === runtimeId ? { ...r, ...updates } : r
                  ),
                  updatedAt: now(),
                }
              : p
          ),
        }))
      },

      removeRuntime: (projectId: string, runtimeId: string) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  runtimes: p.runtimes.filter(r => r.id !== runtimeId),
                  updatedAt: now(),
                }
              : p
          ),
        }))
      },

      // Addon actions
      addAddon: (projectId: string, addon: Omit<AddonConfig, 'id'>) => {
        const id = generateId()
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  addons: [...p.addons, { ...addon, id }],
                  updatedAt: now(),
                }
              : p
          ),
        }))
        return id
      },

      updateAddon: (projectId: string, addonId: string, updates: Partial<AddonConfig>) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  addons: p.addons.map(a =>
                    a.id === addonId ? { ...a, ...updates } : a
                  ),
                  updatedAt: now(),
                }
              : p
          ),
        }))
      },

      removeAddon: (projectId: string, addonId: string) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  addons: p.addons.filter(a => a.id !== addonId),
                  updatedAt: now(),
                }
              : p
          ),
        }))
      },

      // Computed
      getActiveProject: () => {
        const state = get()
        return state.projects.find(p => p.id === state.activeProjectId) ?? null
      },

      getProject: (id: string) => {
        return get().projects.find(p => p.id === id)
      },
    }),
    {
      name: 'clever-pricing-projects',
      version: 1,
    }
  )
)
