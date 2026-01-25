import type { ReactNode } from "react";
import { ToastContainer } from "@/components/ui";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[#f9f9fb] p-4 lg:p-6 overflow-auto">
        <div className="max-w-screen-2xl mx-auto">{children}</div>
      </main>

      <ToastContainer />
    </div>
  );
}
