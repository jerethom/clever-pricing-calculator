import { useState, useCallback, useMemo } from 'react'
import {
  useSelector,
  useProjectActions,
  selectOrganizations,
  selectActiveOrganizationId,
  selectActiveProjectId,
  selectProjects,
} from '@/store'
import { useAllProjectsCosts } from '@/hooks/useCostCalculation'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'
import type { Organization, Project, ProjectCostSummary } from '@/types'

interface SidebarProps {
  onClose?: () => void
}

interface OrganizationItemProps {
  organization: Organization
  projects: Project[]
  isActive: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onSelectOrganization: () => void
  onSelectProject: (projectId: string) => void
  activeProjectId: string | null
  projectCosts: Map<string, ProjectCostSummary>
}

function OrganizationItem({
  organization,
  projects,
  isActive,
  isExpanded,
  onToggleExpand,
  onSelectOrganization,
  onSelectProject,
  activeProjectId,
  projectCosts,
}: OrganizationItemProps) {
  // Calculer le cout total de l'organisation a partir des couts des projets
  const totalCost = useMemo(() => {
    return projects.reduce((sum, p) => {
      const cost = projectCosts.get(p.id)
      return sum + (cost?.totalMonthlyCost ?? 0)
    }, 0)
  }, [projects, projectCosts])

  return (
    <li>
      {/* En-tete de l'organisation */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-150
          ${isActive
            ? 'bg-[#5754aa]/30 border-l-2 border-l-white'
            : 'border-l-2 border-l-transparent hover:bg-white/5'
          }
        `}
      >
        <button
          className="p-1 hover:bg-white/10 rounded transition-colors"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Replier' : 'Deplier'}
        >
          <Icons.ChevronRight
            className={`w-3 h-3 text-white/50 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
        <button
          className="flex-1 flex items-center justify-between gap-2 min-w-0"
          onClick={onSelectOrganization}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icons.Building className="w-4 h-4 text-white/60 flex-shrink-0" />
            <span
              className={`truncate text-sm ${isActive ? 'text-white font-medium' : 'text-white/70'}`}
            >
              {organization.name}
            </span>
            <span className="text-xs text-white/40">({projects.length})</span>
          </div>
          <span
            className={`text-xs tabular-nums flex-shrink-0 ${isActive ? 'text-white/80' : 'text-white/50'}`}
          >
            {formatPrice(totalCost)}
          </span>
        </button>
      </div>

      {/* Liste des projets de l'organisation */}
      {isExpanded && projects.length > 0 && (
        <ul className="pl-6">
          {projects.map(project => {
            const cost = projectCosts.get(project.id)
            const isProjectActive = project.id === activeProjectId

            return (
              <li key={project.id}>
                <button
                  className={`
                    w-full text-left px-3 py-2 cursor-pointer transition-all duration-150
                    ${isProjectActive
                      ? 'bg-[#5754aa] border-l-2 border-l-white'
                      : 'border-l-2 border-l-transparent hover:bg-white/5 hover:border-l-white/30'
                    }
                  `}
                  onClick={() => onSelectProject(project.id)}
                  aria-current={isProjectActive ? 'page' : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Icons.Folder
                        className={`w-3.5 h-3.5 flex-shrink-0 ${isProjectActive ? 'text-white' : 'text-white/40'}`}
                      />
                      <span
                        className={`truncate text-sm ${isProjectActive ? 'text-white font-medium' : 'text-white/70'}`}
                      >
                        {project.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs tabular-nums flex-shrink-0 ${isProjectActive ? 'text-white' : 'text-white/50'}`}
                    >
                      {cost ? formatPrice(cost.totalMonthlyCost) : '...'}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export function Sidebar({ onClose }: SidebarProps) {
  const organizations = useSelector(selectOrganizations)
  const allProjects = useSelector(selectProjects)
  const activeOrgId = useSelector(selectActiveOrganizationId)
  const activeProjectId = useSelector(selectActiveProjectId)
  const {
    setActiveOrganization,
    setActiveProject,
    createProject,
    createOrganization,
  } = useProjectActions()

  // Couts de tous les projets
  const projectCosts = useAllProjectsCosts()

  // Grouper les projets par organisation
  const projectsByOrg = useMemo(() => {
    const map = new Map<string, Project[]>()
    for (const org of organizations) {
      map.set(org.id, allProjects.filter(p => p.organizationId === org.id))
    }
    return map
  }, [organizations, allProjects])

  // State pour gerer l'expansion des organisations
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(() => {
    return new Set(activeOrgId ? [activeOrgId] : [])
  })

  const toggleOrgExpansion = useCallback((orgId: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev)
      if (next.has(orgId)) {
        next.delete(orgId)
      } else {
        next.add(orgId)
      }
      return next
    })
  }, [])

  const handleSelectOrganization = useCallback((orgId: string) => {
    setActiveOrganization(orgId)
    setExpandedOrgs(prev => new Set(prev).add(orgId))
    onClose?.()
  }, [setActiveOrganization, onClose])

  const handleSelectProject = useCallback((projectId: string) => {
    // Trouver le projet pour obtenir son organisation
    const project = allProjects.find(p => p.id === projectId)
    if (project && project.organizationId !== activeOrgId) {
      // Changer l'organisation active si le projet appartient à une autre org
      setActiveOrganization(project.organizationId)
      setExpandedOrgs(prev => new Set(prev).add(project.organizationId))
    }
    setActiveProject(projectId)
    onClose?.()
  }, [allProjects, activeOrgId, setActiveOrganization, setActiveProject, onClose])

  const handleCreateOrganization = useCallback(() => {
    const name = `Organisation ${organizations.length + 1}`
    const newOrgId = createOrganization(name)
    setExpandedOrgs(prev => new Set(prev).add(newOrgId))
    onClose?.()
  }, [organizations.length, createOrganization, onClose])

  const handleCreateProject = useCallback(() => {
    if (!activeOrgId) return
    const orgProjects = projectsByOrg.get(activeOrgId) ?? []
    const name = `Projet ${orgProjects.length + 1}`
    createProject(activeOrgId, name)
    onClose?.()
  }, [activeOrgId, projectsByOrg, createProject, onClose])

  return (
    <div className="h-full bg-[#13172e] w-80 flex flex-col">
      {/* Header de la sidebar */}
      <div className="px-5 py-[1.8rem] border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Organisations
          </h2>
          <span className="text-xs text-white/50 tabular-nums">
            {organizations.length} org{organizations.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Liste des organisations */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {organizations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto mb-5 bg-white/5 border border-white/10 flex items-center justify-center">
              <Icons.Building className="w-7 h-7 text-white/40" />
            </div>
            <p className="font-medium text-white/80 text-sm">Aucune organisation</p>
            <p className="text-xs mt-2 text-white/50 leading-relaxed">
              Creez votre premiere organisation pour commencer
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {organizations.map(org => (
              <OrganizationItem
                key={org.id}
                organization={org}
                projects={projectsByOrg.get(org.id) ?? []}
                isActive={org.id === activeOrgId}
                isExpanded={expandedOrgs.has(org.id)}
                onToggleExpand={() => toggleOrgExpansion(org.id)}
                onSelectOrganization={() => handleSelectOrganization(org.id)}
                onSelectProject={handleSelectProject}
                activeProjectId={activeProjectId}
                projectCosts={projectCosts}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="px-3 pb-3 space-y-2">
        <button
          className="
            w-full flex items-center justify-center gap-2 cursor-pointer
            px-4 py-2.5 text-sm font-medium
            bg-[#5754aa] hover:bg-[#6563b8] active:bg-[#4a4899]
            text-white transition-colors duration-150
          "
          onClick={handleCreateOrganization}
          aria-label="Creer une nouvelle organisation"
        >
          <Icons.Building className="w-4 h-4" />
          Nouvelle organisation
        </button>
        {activeOrgId && (
          <button
            className="
              w-full flex items-center justify-center gap-2 cursor-pointer
              px-4 py-2 text-sm font-medium
              bg-white/10 hover:bg-white/20 active:bg-white/5
              text-white/80 hover:text-white transition-colors duration-150
            "
            onClick={handleCreateProject}
            aria-label="Creer un nouveau projet"
          >
            <Icons.Plus className="w-4 h-4" />
            Nouveau projet
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <p className="text-xs text-white/50">Sauvegarde locale active</p>
      </div>
    </div>
  )
}
