import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout'
import { ProjectView } from '@/components/project'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 heure
      gcTime: 1000 * 60 * 60 * 24, // 24 heures
      retry: 2,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <ProjectView />
      </MainLayout>
    </QueryClientProvider>
  )
}

export default App
