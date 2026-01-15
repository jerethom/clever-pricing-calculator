import { useQuery } from '@tanstack/react-query'
import { fetchInstances } from '@/api/cleverCloud'

export function useInstances() {
  return useQuery({
    queryKey: ['instances'],
    queryFn: fetchInstances,
    staleTime: 1000 * 60 * 60, // 1 heure - les prix changent rarement
    gcTime: 1000 * 60 * 60 * 24, // 24 heures de cache
  })
}
