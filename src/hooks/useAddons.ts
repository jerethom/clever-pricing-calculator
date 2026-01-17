import { useQuery } from "@tanstack/react-query";
import { fetchAddonProviders } from "@/api/cleverCloud";

export function useAddons() {
  return useQuery({
    queryKey: ["addonProviders"],
    queryFn: fetchAddonProviders,
    staleTime: 1000 * 60 * 60, // 1 heure
    gcTime: 1000 * 60 * 60 * 24, // 24 heures de cache
  });
}
