import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout'
import { Icons } from '@/components/ui'

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then(res => ({
        default: res.TanStackRouterDevtools,
      })),
    )
  : () => null

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()

  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Outlet />
      </MainLayout>
      <Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </QueryClientProvider>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="bg-base-200 rounded-full p-6 mb-6">
        <Icons.X className="w-16 h-16 text-error/50" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Page non trouvée</h2>
      <p className="text-base-content/70 max-w-md">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
    </div>
  )
}
