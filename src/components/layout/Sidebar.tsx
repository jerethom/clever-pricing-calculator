import { useState, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import {
  useSelector,
  useProjectActions,
  selectOrganizations,
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
  onClose?: () => void
  activeProjectId: string | null
  projectCosts: Map<string, ProjectCostSummary>
}

const getBudgetStatusColor = (percent: number): string =>
  percent > 90 ? 'bg-error' : percent >= 70 ? 'bg-warning' : 'bg-success'

function OrganizationItem({
  organization,
  projects,
  isActive,
  isExpanded,
  onToggleExpand,
  onClose,
  activeProjectId,
  projectCosts,
}: OrganizationItemProps) {
  const totalCost = useMemo(
    () => projects.reduce((sum, p) => sum + (projectCosts.get(p.id)?.totalMonthlyCost ?? 0), 0),
    [projects, projectCosts]
  )

  const budgetPercent = organization.budgetTarget
    ? (totalCost / organization.budgetTarget) * 100
    : null

  return (
    <li>
      <div
        className={`
          flex flex-col px-3 py-2 cursor-pointer transition-all duration-150
          ${isActive
            ? 'bg-[#5754aa]/30 border-l-2 border-l-white'
            : 'border-l-2 border-l-transparent hover:bg-white/5'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1 hover:bg-white/10 rounded transition-colors"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Replier' : 'Deplier'}
          >
            <Icons.ChevronRight
              className={`w-3 h-3 text-white/50 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
          <Link
            to="/org/$orgId"
            params={{ orgId: organization.id }}
            className="flex-1 flex items-center justify-between gap-2 min-w-0"
            onClick={onClose}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icons.Building className="w-4 h-4 text-white/60 flex-shrink-0" />
              <span
                className={`truncate text-sm ${isActive ? 'text-white font-medium' : 'text-white/70'}`}
              >
                {organization.name}
              </span>
            </div>
            <span
              className={`text-xs tabular-nums flex-shrink-0 ${isActive ? 'text-white/80' : 'text-white/50'}`}
            >
              {formatPrice(totalCost)}
            </span>
          </Link>
        </div>

        {isExpanded && budgetPercent !== null && (
          <div className="mt-1.5 ml-7 mr-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getBudgetStatusColor(budgetPercent)}`}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-white/40 tabular-nums w-8 text-right">
                {budgetPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {isExpanded && projects.length > 0 && (
        <ul className="pl-6">
          {projects.map(project => {
            const cost = projectCosts.get(project.id)
            const isProjectActive = project.id === activeProjectId

            return (
              <li key={project.id}>
                <Link
                  to="/org/$orgId/project/$projectId/runtimes"
                  params={{ orgId: organization.id, projectId: project.id }}
                  className={`
                    block w-full text-left px-3 py-2 cursor-pointer transition-all duration-150
                    ${isProjectActive
                      ? 'bg-[#5754aa] border-l-2 border-l-white'
                      : 'border-l-2 border-l-transparent hover:bg-white/5 hover:border-l-white/30'
                    }
                  `}
                  onClick={onClose}
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
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const organizations = useSelector(selectOrganizations)
  const allProjects = useSelector(selectProjects)
  const { createProject, createOrganization } = useProjectActions()
  const { orgId: activeOrgId = null, projectId: activeProjectId = null } = useParams({ strict: false })
  const projectCosts = useAllProjectsCosts()

  const projectsByOrg = useMemo(() => {
    const map = new Map<string, Project[]>()
    organizations.forEach(org => map.set(org.id, allProjects.filter(p => p.organizationId === org.id)))
    return map
  }, [organizations, allProjects])

  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(
    () => new Set(activeOrgId ? [activeOrgId] : [])
  )

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

  const handleCreateOrganization = useCallback(() => {
    const name = `Organisation ${organizations.length + 1}`
    const newOrgId = createOrganization(name)
    setExpandedOrgs(prev => new Set(prev).add(newOrgId))
    navigate({ to: '/org/$orgId', params: { orgId: newOrgId } })
    onClose?.()
  }, [organizations.length, createOrganization, navigate, onClose])

  const handleCreateProject = useCallback(() => {
    if (!activeOrgId) return
    const orgProjects = projectsByOrg.get(activeOrgId) ?? []
    const name = `Projet ${orgProjects.length + 1}`
    const newProjectId = createProject(activeOrgId, name)
    navigate({
      to: '/org/$orgId/project/$projectId/runtimes',
      params: { orgId: activeOrgId, projectId: newProjectId },
    })
    onClose?.()
  }, [activeOrgId, projectsByOrg, createProject, navigate, onClose])

  return (
    <div className="h-full bg-[#13172e] w-80 flex flex-col">
      <div className="px-5 py-[1.8rem] border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            Organisations
          </h2>
          <button
            type="button"
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            onClick={handleCreateOrganization}
            aria-label="Creer une nouvelle organisation"
          >
            <Icons.Plus className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
        </div>
      </div>

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
                onClose={onClose}
                activeProjectId={activeProjectId}
                projectCosts={projectCosts}
              />
            ))}
          </ul>
        )}
      </div>

      {activeOrgId && (
        <div className="px-3 pb-3">
          <button
            type="button"
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
        </div>
      )}
    </div>
  )
}
