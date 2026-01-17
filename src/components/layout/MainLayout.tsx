import { type ReactNode, useState } from "react";
import { ToastContainer } from "@/components/ui";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
	children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="drawer lg:drawer-open">
			<input
				id="sidebar-drawer"
				type="checkbox"
				className="drawer-toggle"
				checked={sidebarOpen}
				onChange={(e) => setSidebarOpen(e.target.checked)}
			/>

			<div className="drawer-content flex flex-col min-h-screen">
				<Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

				<main className="flex-1 bg-[#f9f9fb] p-4 lg:p-6">
					<div className="max-w-screen-2xl mx-auto">{children}</div>
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
	);
}
