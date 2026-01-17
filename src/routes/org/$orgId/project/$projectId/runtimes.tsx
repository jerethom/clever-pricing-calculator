import { createFileRoute } from "@tanstack/react-router";
import { RuntimeList } from "@/components/runtime/RuntimeList";

export const Route = createFileRoute("/org/$orgId/project/$projectId/runtimes")(
  {
    component: () => {
      const { projectId } = Route.useParams();
      return (
        <div
          role="tabpanel"
          id="tabpanel-runtimes"
          aria-labelledby="tab-runtimes"
        >
          <RuntimeList projectId={projectId} />
        </div>
      );
    },
  },
);
