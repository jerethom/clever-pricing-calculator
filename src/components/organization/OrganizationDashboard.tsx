import { memo, useMemo, useCallback } from 'react'
import { useShallow } from 'zustand/shallow'
import {
  useSelector,
  useProjectActions,
  selectActiveOrganization,
  selectActiveOrganizationProjects,
} from '@/store'
import { useProjectStore } from '@/store/projectStore'
import { useActiveOrganizationCosts } from '@/hooks/useCostCalculation'
import { OrganizationHeader } from './OrganizationHeader'
import { OrganizationStats } from './OrganizationStats'
import { OrganizationCostBreakdown } from './OrganizationCostBreakdown'
import { OrganizationProjectList } from './OrganizationProjectList'

export const OrganizationDashboard = memo(function OrganizationDashboard() {
  const organization = useSelector(selectActiveOrganization)
  // Utiliser useShallow pour éviter les re-renders quand le tableau est recréé mais identique
  const projects = useProjectStore(useShallow(selectActiveOrganizationProjects))
  const projectCosts = useActiveOrganizationCosts()
  const {
    updateOrganization,
    deleteOrganization,
    createProject,
    setActiveProject,
  } = useProjectActions()

  // Calculer les statistiques (une seule itération)
  const stats = useMemo(() => {
    let totalRuntimes = 0
    let totalAddons = 0
    let totalMonthlyCost = 0
    let totalRuntimesCost = 0
    let totalAddonsCost = 0

    for (const project of projects) {
      totalRuntimes += project.runtimes.length
      totalAddons += project.addons.length
      const cost = projectCosts.get(project.id)
      if (cost) {
        totalMonthlyCost += cost.totalMonthlyCost
        totalRuntimesCost += cost.runtimesCost
        totalAddonsCost += cost.addonsCost
      }
    }

    return {
      projectsCount: projects.length,
      runtimesCount: totalRuntimes,
      addonsCount: totalAddons,
      totalMonthlyCost,
      totalRuntimesCost,
      totalAddonsCost,
    }
  }, [projects, projectCosts])

  // Handlers
  const handleUpdateName = useCallback((name: string) => {
    if (organization) {
      updateOrganization(organization.id, { name })
    }
  }, [organization, updateOrganization])

  const handleDelete = useCallback(() => {
    if (organization) {
      deleteOrganization(organization.id)
    }
  }, [organization, deleteOrganization])

  const handleCreateProject = useCallback(() => {
    if (organization) {
      const name = `Projet ${projects.length + 1}`
      createProject(organization.id, name)
    }
  }, [organization, projects.length, createProject])

  const handleSelectProject = useCallback((projectId: string) => {
    setActiveProject(projectId)
  }, [setActiveProject])

  if (!organization) {
    return null
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header avec nom editable */}
      <OrganizationHeader
        organization={organization}
        onUpdateName={handleUpdateName}
        onDelete={handleDelete}
      />

      {/* Statistiques cles */}
      <OrganizationStats
        projectsCount={stats.projectsCount}
        runtimesCount={stats.runtimesCount}
        addonsCount={stats.addonsCount}
        totalMonthlyCost={stats.totalMonthlyCost}
      />

      {/* Repartition des couts */}
      <OrganizationCostBreakdown
        totalRuntimesCost={stats.totalRuntimesCost}
        totalAddonsCost={stats.totalAddonsCost}
        totalMonthlyCost={stats.totalMonthlyCost}
      />

      {/* Liste des projets */}
      <OrganizationProjectList
        projects={projects}
        projectCosts={projectCosts}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
})
