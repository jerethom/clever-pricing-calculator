import { createFileRoute } from "@tanstack/react-router";
import { AddonList } from "@/components/addon/AddonList";

export const Route = createFileRoute("/org/$orgId/project/$projectId/addons")({
  component: () => {
    const { projectId } = Route.useParams();
    return (
      <div role="tabpanel" id="tabpanel-addons" aria-labelledby="tab-addons">
        <AddonList projectId={projectId} />
      </div>
    );
  },
});
