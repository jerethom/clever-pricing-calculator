import { useState, type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={e => setSidebarOpen(e.target.checked)}
      />

      <div className="drawer-content flex flex-col min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 bg-base-200 p-4 lg:p-6">
          {children}
        </main>
      </div>

      <div className="drawer-side z-40">
        <label
          htmlFor="sidebar-drawer"
          aria-label="Fermer le menu"
          className="drawer-overlay"
        />
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Notifications toast */}
      <ToastContainer />
    </div>
  )
}
