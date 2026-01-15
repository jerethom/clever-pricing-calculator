import { useAllProjectsCosts } from '@/hooks/useCostCalculation'
import { formatPrice } from '@/lib/costCalculator'
import { Icons } from '@/components/ui'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const projectCosts = useAllProjectsCosts()

  // Calcul du coût total de tous les projets
  const totalCost = Array.from(projectCosts.values()).reduce(
    (sum, cost) => sum + cost.totalMonthlyCost,
    0
  )

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

      <div className="flex-1">
        <span className="text-xl font-semibold px-4 tracking-tight text-white">
          Clever Cloud Pricing Calculator
        </span>
      </div>

      <div className="flex-none">
        <div className="bg-white/10 px-4 py-2 border border-white/20">
          <div className="text-xs text-white/70 uppercase tracking-wide">
            Total mensuel
          </div>
          <div className="text-xl font-bold text-white tabular-nums">
            {formatPrice(totalCost)}
          </div>
        </div>
      </div>
    </div>
  )
}
