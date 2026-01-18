import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/org/$orgId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/org/$orgId/overview",
      params: { orgId: params.orgId },
    });
  },
});
