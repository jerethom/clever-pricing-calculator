import { useMemo } from 'react'
import { useActiveOrganizationCosts } from '@/hooks/useCostCalculation'
import {
  useSelector,
  selectActiveOrganization,
  selectActiveProject,
} from '@/store'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const projectCosts = useActiveOrganizationCosts()
  const activeOrg = useSelector(selectActiveOrganization)
  const activeProject = useSelector(selectActiveProject)

  // Calcul du total de l'organisation active
  const total = useMemo(() => {
    return Array.from(projectCosts.values()).reduce(
      (acc, cost) => acc + cost.totalMonthlyCost,
      0
    )
  }, [projectCosts])

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
        {/* Logo + Titre */}
        <div className="flex items-center gap-3 px-4">
          <Icons.Logo className="w-8 h-8 flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-white tracking-tight">
              clever cloud
            </span>
            <span className="text-xs font-normal text-white/70">
              Pricing Calculator
            </span>
          </div>
        </div>

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
        {/* Total - toujours visible */}
        <div className="bg-white/10 px-3 sm:px-4 py-2 border border-white/20">
          <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wide">
            Total mensuel
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tabular-nums">
            {formatPrice(total)}
          </div>
        </div>
      </div>
    </div>
  )
}
