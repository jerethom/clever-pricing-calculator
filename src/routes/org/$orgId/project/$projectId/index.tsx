import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/org/$orgId/project/$projectId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/org/$orgId/project/$projectId/runtimes',
      params: { orgId: params.orgId, projectId: params.projectId },
    })
  },
})
