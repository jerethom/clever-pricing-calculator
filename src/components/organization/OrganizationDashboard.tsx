import { memo, useMemo, useCallback, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import {
  useSelector,
  useProjectActions,
  selectActiveOrganization,
  selectActiveOrganizationProjects,
} from '@/store'
import { useProjectStore } from '@/store/projectStore'
import { useActiveOrganizationCosts } from '@/hooks/useCostCalculation'
import { Icons } from '@/components/ui'
import { OrganizationHeader } from './OrganizationHeader'
import { OrganizationStats } from './OrganizationStats'
import { OrganizationCostBreakdown } from './OrganizationCostBreakdown'
import { OrganizationProjectList } from './OrganizationProjectList'
import { OrganizationProjections } from './OrganizationProjections'

type TabType = 'overview' | 'projections'

export const OrganizationDashboard = memo(function OrganizationDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
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

  const tabConfig = {
    overview: {
      icon: Icons.Chart,
      label: 'Vue d\'ensemble',
    },
    projections: {
      icon: Icons.TrendingUp,
      label: 'Projections',
    },
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header avec nom editable */}
      <OrganizationHeader
        organization={organization}
        onUpdateName={handleUpdateName}
        onDelete={handleDelete}
      />

      {/* Onglets - Design Pill/Segment */}
      <div
        role="tablist"
        aria-label="Sections de l'organisation"
        className="flex bg-base-200 p-1 gap-1"
      >
        {(['overview', 'projections'] as const).map((tab) => {
          const isActive = activeTab === tab
          const config = tabConfig[tab]
          const Icon = config.icon

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`tab-org-${tab}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-org-${tab}`}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                font-medium text-sm transition-all duration-200
                ${isActive
                  ? 'bg-base-100 shadow-sm text-base-content'
                  : 'text-base-content/60 hover:text-base-content hover:bg-base-100/50'
                }
              `}
              onClick={() => setActiveTab(tab)}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenu des onglets */}
      <div className="mt-2">
        {/* Onglet Vue d'ensemble */}
        <div
          role="tabpanel"
          id="tabpanel-org-overview"
          aria-labelledby="tab-org-overview"
          hidden={activeTab !== 'overview'}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
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
          )}
        </div>

        {/* Onglet Projections */}
        <div
          role="tabpanel"
          id="tabpanel-org-projections"
          aria-labelledby="tab-org-projections"
          hidden={activeTab !== 'projections'}
        >
          {activeTab === 'projections' && (
            <OrganizationProjections
              projects={projects}
              projectCosts={projectCosts}
            />
          )}
        </div>
      </div>
    </div>
  )
})
