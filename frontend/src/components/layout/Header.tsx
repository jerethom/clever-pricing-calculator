import { Link } from "@tanstack/react-router";
import {
  Icons,
  OrganizationSelector,
  ProjectTreeDropdown,
} from "@/components/ui";
import { selectActiveOrganization, useSelector } from "@/store";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  const activeOrg = useSelector(selectActiveOrganization);

  return (
    <header className="navbar bg-[#13172e] sticky top-0 z-50 border-b border-[#1c2045] px-4">
      {/* Left: Mobile menu + Logo */}
      <div className="flex items-center gap-2">
        {onToggleMobileMenu && (
          <button
            type="button"
            className="btn btn-square btn-ghost text-white hover:bg-white/10 lg:hidden"
            onClick={onToggleMobileMenu}
            aria-label="Ouvrir le menu"
          >
            <Icons.Menu className="h-6 w-6" />
          </button>
        )}
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Icons.Logo className="w-8 h-8 flex-shrink-0" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-base font-semibold text-white tracking-tight">
              clever cloud
            </span>
            <span className="text-xs font-normal text-white/70">
              Pricing Calculator
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Project navigation (only if org is active) */}
      <div className="flex-1 flex justify-center px-4">
        {activeOrg && <ProjectTreeDropdown />}
      </div>

      {/* Right: Organization selector */}
      <div className="flex items-center">
        <OrganizationSelector />
      </div>
    </header>
  );
}
