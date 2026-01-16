import { Link, useLocation } from '@tanstack/react-router'
import { Icons } from '@/components/ui'
import type { Project } from '@/types'

interface ProjectTabsProps {
  project: Project
  orgId: string
}

type TabKey = 'runtimes' | 'addons' | 'projection'

const tabConfig: Record<TabKey, { icon: typeof Icons.Server; label: string; color: string }> = {
  runtimes: { icon: Icons.Server, label: 'Runtimes', color: 'primary' },
  addons: { icon: Icons.Puzzle, label: 'Addons', color: 'secondary' },
  projection: { icon: Icons.TrendingUp, label: 'Projection', color: 'accent' },
}

export function ProjectTabs({ project, orgId }: ProjectTabsProps) {
  const { pathname } = useLocation()
  const activeTab: TabKey = pathname.endsWith('/addons')
    ? 'addons'
    : pathname.endsWith('/projection')
      ? 'projection'
      : 'runtimes'

  return (
    <div
      role="tablist"
      aria-label="Sections du projet"
      className="flex bg-base-200 p-1 gap-1"
    >
      {(['runtimes', 'addons', 'projection'] as const).map((tab) => {
        const isActive = activeTab === tab
        const { icon: Icon, label, color } = tabConfig[tab]
        const count = tab === 'runtimes' ? project.runtimes.length
          : tab === 'addons' ? project.addons.length
          : null

        return (
          <Link
            key={tab}
            to={`/org/$orgId/project/$projectId/${tab}`}
            params={{ orgId, projectId: project.id }}
            role="tab"
            id={`tab-${tab}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab}`}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5
              font-medium text-sm transition-all duration-200
              ${isActive
                ? 'bg-base-100 shadow-sm text-base-content'
                : 'text-base-content/60 hover:text-base-content hover:bg-base-100/50'
              }
            `}
          >
            <Icon className={`w-4 h-4 ${isActive ? `text-${color}` : ''}`} />
            <span>{label}</span>
            {count !== null && (
              <span className={`
                px-1.5 py-0.5 text-xs
                ${isActive ? `bg-${color}/10 text-${color}` : 'bg-base-300 text-base-content/50'}
              `}>
                {count}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
