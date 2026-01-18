import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  generateAddonId,
  generateOrganizationId,
  generateProfileId,
  generateProjectId,
  generateRuntimeId,
} from "@/lib/typeid";
import type {
  AddonConfig,
  Organization,
  Project,
  RuntimeConfig,
} from "@/types";
import { DEFAULT_ORGANIZATION_NAME } from "@/types";

function now(): string {
  return new Date().toISOString();
}

export interface ProjectState {
  // State
  organizations: Organization[];
  projects: Project[];
  activeOrganizationId: string | null;
  activeProjectId: string | null;
}

export interface OrganizationActions {
  // Organization actions
  createOrganization: (name: string) => string;
  updateOrganization: (
    id: string,
    updates: Partial<Pick<Organization, "name" | "budgetTarget">>,
  ) => void;
  deleteOrganization: (id: string) => void;
  setActiveOrganization: (id: string | null) => void;
  cloneOrganization: (orgId: string, newName: string) => string;
}

export interface ProjectActions {
  // Project actions
  createProject: (organizationId: string, name: string) => string;
  updateProject: (id: string, updates: Partial<Pick<Project, "name">>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  cloneProject: (
    projectId: string,
    targetOrgId: string,
    newName: string,
  ) => string;
  moveProject: (projectId: string, targetOrgId: string) => void;

  // Runtime actions
  addRuntime: (projectId: string, runtime: Omit<RuntimeConfig, "id">) => string;
  updateRuntime: (
    projectId: string,
    runtimeId: string,
    updates: Partial<RuntimeConfig>,
  ) => void;
  removeRuntime: (projectId: string, runtimeId: string) => void;

  // Addon actions
  addAddon: (projectId: string, addon: Omit<AddonConfig, "id">) => string;
  updateAddon: (
    projectId: string,
    addonId: string,
    updates: Partial<AddonConfig>,
  ) => void;
  removeAddon: (projectId: string, addonId: string) => void;
}

export type ProjectStore = ProjectState & OrganizationActions & ProjectActions;

// Organisation par defaut pour les nouveaux utilisateurs
function createDefaultOrganization(): Organization {
  const timestamp = now();
  return {
    id: generateOrganizationId(),
    name: DEFAULT_ORGANIZATION_NAME,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// Creer l'organisation par defaut une seule fois au chargement du module
const initialDefaultOrg = createDefaultOrganization();

export const useProjectStore = create<ProjectStore>()(
  persist(
    immer((set) => ({
      organizations: [initialDefaultOrg],
      projects: [],
      activeOrganizationId: initialDefaultOrg.id,
      activeProjectId: null,

      // Organization actions
      createOrganization: (name: string) => {
        const id = generateOrganizationId();
        const timestamp = now();
        const newOrg: Organization = {
          id,
          name,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => {
          state.organizations.push(newOrg);
          state.activeOrganizationId = id;
          state.activeProjectId = null;
        });
        return id;
      },

      updateOrganization: (
        id: string,
        updates: Partial<Pick<Organization, "name" | "budgetTarget">>,
      ) => {
        set((state) => {
          const org = state.organizations.find((o) => o.id === id);
          if (org) {
            Object.assign(org, updates);
            org.updatedAt = now();
          }
        });
      },

      deleteOrganization: (id: string) => {
        set((state) => {
          const index = state.organizations.findIndex((o) => o.id === id);
          if (index !== -1) {
            state.organizations.splice(index, 1);
            // Supprimer tous les projets de l'organisation
            state.projects = state.projects.filter(
              (p) => p.organizationId !== id,
            );
          }
          if (state.activeOrganizationId === id) {
            state.activeOrganizationId = state.organizations[0]?.id ?? null;
            state.activeProjectId = null;
          }
        });
      },

      setActiveOrganization: (id: string | null) => {
        set((state) => {
          state.activeOrganizationId = id;
          state.activeProjectId = null;
        });
      },

      cloneOrganization: (orgId: string, newName: string) => {
        const newOrgId = generateOrganizationId();
        const timestamp = now();

        set((state) => {
          const sourceOrg = state.organizations.find((o) => o.id === orgId);
          if (!sourceOrg) return;

          // Cloner l'organisation
          const newOrg: Organization = {
            id: newOrgId,
            name: newName,
            budgetTarget: sourceOrg.budgetTarget,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          state.organizations.push(newOrg);

          // Cloner tous les projets de l'organisation
          const orgProjects = state.projects.filter(
            (p) => p.organizationId === orgId,
          );
          for (const project of orgProjects) {
            const newProjectId = generateProjectId();

            // Cloner les runtimes avec nouveaux IDs
            const clonedRuntimes = project.runtimes.map((runtime) => ({
              ...runtime,
              id: generateRuntimeId(),
              scalingProfiles: runtime.scalingProfiles.map((profile) => ({
                ...profile,
                id: generateProfileId(),
              })),
            }));

            // Cloner les addons avec nouveaux IDs
            const clonedAddons = project.addons.map((addon) => ({
              ...addon,
              id: generateAddonId(),
            }));

            const newProject: Project = {
              id: newProjectId,
              organizationId: newOrgId,
              name: project.name,
              createdAt: timestamp,
              updatedAt: timestamp,
              runtimes: clonedRuntimes,
              addons: clonedAddons,
            };
            state.projects.push(newProject);
          }

          state.activeOrganizationId = newOrgId;
          state.activeProjectId = null;
        });
        return newOrgId;
      },

      // Project actions
      createProject: (organizationId: string, name: string) => {
        const id = generateProjectId();
        const timestamp = now();
        const newProject: Project = {
          id,
          organizationId,
          name,
          createdAt: timestamp,
          updatedAt: timestamp,
          runtimes: [],
          addons: [],
        };
        set((state) => {
          state.projects.push(newProject);
          state.activeProjectId = id;
        });
        return id;
      },

      updateProject: (id: string, updates: Partial<Pick<Project, "name">>) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === id);
          if (project) {
            Object.assign(project, updates);
            project.updatedAt = now();
          }
        });
      },

      deleteProject: (id: string) => {
        set((state) => {
          const index = state.projects.findIndex((p) => p.id === id);
          if (index !== -1) {
            state.projects.splice(index, 1);
          }
          if (state.activeProjectId === id) {
            state.activeProjectId = null;
          }
        });
      },

      setActiveProject: (id: string | null) => {
        set((state) => {
          state.activeProjectId = id;
        });
      },

      cloneProject: (
        projectId: string,
        targetOrgId: string,
        newName: string,
      ) => {
        const newProjectId = generateProjectId();
        const timestamp = now();

        set((state) => {
          const sourceProject = state.projects.find((p) => p.id === projectId);
          if (!sourceProject) return;

          // Cloner les runtimes avec nouveaux IDs
          const clonedRuntimes = sourceProject.runtimes.map((runtime) => ({
            ...runtime,
            id: generateRuntimeId(),
            scalingProfiles: runtime.scalingProfiles.map((profile) => ({
              ...profile,
              id: generateProfileId(),
            })),
          }));

          // Cloner les addons avec nouveaux IDs
          const clonedAddons = sourceProject.addons.map((addon) => ({
            ...addon,
            id: generateAddonId(),
          }));

          const newProject: Project = {
            id: newProjectId,
            organizationId: targetOrgId,
            name: newName,
            createdAt: timestamp,
            updatedAt: timestamp,
            runtimes: clonedRuntimes,
            addons: clonedAddons,
          };
          state.projects.push(newProject);
          state.activeProjectId = newProjectId;
        });
        return newProjectId;
      },

      moveProject: (projectId: string, targetOrgId: string) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            project.organizationId = targetOrgId;
            project.updatedAt = now();
          }
        });
      },

      // Runtime actions
      addRuntime: (projectId: string, runtime: Omit<RuntimeConfig, "id">) => {
        const id = generateRuntimeId();
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            project.runtimes.push({ ...runtime, id });
            project.updatedAt = now();
          }
        });
        return id;
      },

      updateRuntime: (
        projectId: string,
        runtimeId: string,
        updates: Partial<RuntimeConfig>,
      ) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            const runtime = project.runtimes.find((r) => r.id === runtimeId);
            if (runtime) {
              Object.assign(runtime, updates);
              project.updatedAt = now();
            }
          }
        });
      },

      removeRuntime: (projectId: string, runtimeId: string) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            const index = project.runtimes.findIndex((r) => r.id === runtimeId);
            if (index !== -1) {
              project.runtimes.splice(index, 1);
              project.updatedAt = now();
            }
          }
        });
      },

      // Addon actions
      addAddon: (projectId: string, addon: Omit<AddonConfig, "id">) => {
        const id = generateAddonId();
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            project.addons.push({ ...addon, id });
            project.updatedAt = now();
          }
        });
        return id;
      },

      updateAddon: (
        projectId: string,
        addonId: string,
        updates: Partial<AddonConfig>,
      ) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            const addon = project.addons.find((a) => a.id === addonId);
            if (addon) {
              Object.assign(addon, updates);
              project.updatedAt = now();
            }
          }
        });
      },

      removeAddon: (projectId: string, addonId: string) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            const index = project.addons.findIndex((a) => a.id === addonId);
            if (index !== -1) {
              project.addons.splice(index, 1);
              project.updatedAt = now();
            }
          }
        });
      },
    })),
    { name: "clever-pricing-projects" },
  ),
);
