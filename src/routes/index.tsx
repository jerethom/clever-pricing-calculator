import { createFileRoute } from "@tanstack/react-router";
import { Icons } from "@/components/ui";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="bg-base-200 rounded-full p-6 mb-6">
        <Icons.Building className="w-16 h-16 text-base-content/30" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Bienvenue</h2>
      <p className="text-base-content/70 max-w-md">
        Selectionnez une organisation dans la barre laterale ou creez-en une
        nouvelle pour commencer
      </p>
    </div>
  ),
});
