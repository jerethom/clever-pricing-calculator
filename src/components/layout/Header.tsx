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
    <div className="navbar bg-base-100 shadow-md sticky top-0 z-50 border-b border-base-200">
      <div className="flex-none lg:hidden">
        <button
          className="btn btn-square btn-ghost"
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu"
        >
          <Icons.Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1">
        <span className="text-xl font-bold px-4 tracking-tight">
          Clever Cloud Pricing Calculator
        </span>
      </div>

      <div className="flex-none">
        <div className="bg-primary/10 rounded-lg px-4 py-2 border border-primary/20">
          <div className="text-xs text-base-content/70 uppercase tracking-wide">
            Total mensuel
          </div>
          <div className="text-xl font-bold text-primary tabular-nums">
            {formatPrice(totalCost)}
          </div>
        </div>
      </div>
    </div>
  )
}
