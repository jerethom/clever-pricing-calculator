import { createFileRoute, Outlet, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'

export const Route = createFileRoute('/org/$orgId')({
  beforeLoad: ({ params: { orgId } }) => {
    const org = useProjectStore.getState().organizations.find(o => o.id === orgId)
    if (!org) throw notFound()
    return { organization: org }
  },
  component: function OrganizationLayout() {
    const { orgId } = Route.useParams()
    const setActiveOrganization = useProjectStore(state => state.setActiveOrganization)

    useEffect(() => {
      setActiveOrganization(orgId)
    }, [orgId, setActiveOrganization])

    return <Outlet />
  },
})
