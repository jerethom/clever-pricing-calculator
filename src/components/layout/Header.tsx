import { Link } from '@tanstack/react-router'
import { useSelector, selectActiveOrganization, selectActiveProject } from '@/store'
import { Icons } from '@/components/ui'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const activeOrg = useSelector(selectActiveOrganization)
  const activeProject = useSelector(selectActiveProject)

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
        <Link to="/" className="flex items-center gap-3 px-4 hover:opacity-80 transition-opacity">
          <Icons.Logo className="w-8 h-8 flex-shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-white tracking-tight">
              clever cloud
            </span>
            <span className="text-xs font-normal text-white/70">
              Pricing Calculator
            </span>
          </div>
        </Link>

        {/* Breadcrumb organisation / projet */}
        {activeOrg && (
          <nav className="hidden sm:flex items-center gap-2 text-sm text-white/60 px-3 py-1 bg-white/5 rounded">
            <Link
              to="/org/$orgId"
              params={{ orgId: activeOrg.id }}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Icons.Building className="w-3.5 h-3.5" />
              <span className="truncate max-w-32">{activeOrg.name}</span>
            </Link>
            {activeProject && (
              <>
                <Icons.ChevronRight className="w-3 h-3 text-white/40" />
                <Link
                  to="/org/$orgId/project/$projectId/runtimes"
                  params={{ orgId: activeOrg.id, projectId: activeProject.id }}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Icons.Folder className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-32 text-white/80">{activeProject.name}</span>
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
