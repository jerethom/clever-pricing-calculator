import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useActiveOrganizationCosts } from '@/hooks/useCostCalculation'
import {
  useSelector,
  selectActiveOrganization,
  selectActiveProject,
  selectActiveOrganizationProjects,
} from '@/store'
import { useProjectStore } from '@/store/projectStore'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const projectCosts = useActiveOrganizationCosts()
  const activeOrg = useSelector(selectActiveOrganization)
  const activeProject = useSelector(selectActiveProject)
  // Projets de l'organisation active seulement
  const orgProjects = useProjectStore(useShallow(selectActiveOrganizationProjects))

  // Calcul des totaux des projets de l'organisation active
  const totals = useMemo(() => {
    return Array.from(projectCosts.values()).reduce(
      (acc, cost) => ({
        runtimes: acc.runtimes + cost.runtimesCost,
        addons: acc.addons + cost.addonsCost,
        total: acc.total + cost.totalMonthlyCost,
      }),
      { runtimes: 0, addons: 0, total: 0 }
    )
  }, [projectCosts])

  // Comptage des runtimes et addons de l'organisation active
  const counts = useMemo(() => {
    return orgProjects.reduce(
      (acc, project) => ({
        runtimes: acc.runtimes + project.runtimes.length,
        addons: acc.addons + project.addons.length,
      }),
      { runtimes: 0, addons: 0 }
    )
  }, [orgProjects])

  return (
    <div className="navbar bg-[#13172e] sticky top-0 z-50 border-b border-[#1c2045]">
      <div className="flex-none lg:hidden">
        <button
          className="btn btn-square btn-ghost text-white hover:bg-white/10"
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu"
        >
          <Icons.Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center gap-4">
        <span className="text-xl font-semibold px-4 tracking-tight text-white">
          Clever Cloud Pricing Calculator
        </span>
        {/* Breadcrumb organisation / projet */}
        {activeOrg && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-white/60 px-3 py-1 bg-white/5 rounded">
            <Icons.Building className="w-3.5 h-3.5" />
            <span className="truncate max-w-32">{activeOrg.name}</span>
            {activeProject && (
              <>
                <Icons.ChevronRight className="w-3 h-3 text-white/40" />
                <Icons.Folder className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-32 text-white/80">{activeProject.name}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-none">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Statistiques detaillees - visibles sur desktop */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            {/* Projets */}
            <div className="flex items-center gap-2">
              <Icons.Folder className="w-4 h-4 text-white/60" />
              <span className="font-medium text-white tabular-nums">{orgProjects.length}</span>
              <span className="text-white/50">projet{orgProjects.length !== 1 ? 's' : ''}</span>
            </div>

            <span className="text-white/20">|</span>

            {/* Runtimes */}
            <div className="flex items-center gap-2">
              <Icons.Server className="w-4 h-4 text-primary" />
              <span className="font-medium text-white tabular-nums">{counts.runtimes}</span>
              <span className="text-white/50 hidden lg:inline">
                runtime{counts.runtimes !== 1 ? 's' : ''}
              </span>
              <span className="text-white/40 tabular-nums">
                ({formatPrice(totals.runtimes)})
              </span>
            </div>

            <span className="text-white/20">|</span>

            {/* Addons */}
            <div className="flex items-center gap-2">
              <Icons.Puzzle className="w-4 h-4 text-secondary" />
              <span className="font-medium text-white tabular-nums">{counts.addons}</span>
              <span className="text-white/50 hidden lg:inline">
                addon{counts.addons !== 1 ? 's' : ''}
              </span>
              <span className="text-white/40 tabular-nums">
                ({formatPrice(totals.addons)})
              </span>
            </div>
          </div>

          {/* Total - toujours visible */}
          <div className="bg-white/10 px-3 sm:px-4 py-2 border border-white/20">
            <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wide">
              Total mensuel
            </div>
            <div className="text-lg sm:text-xl font-bold text-white tabular-nums">
              {formatPrice(totals.total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
