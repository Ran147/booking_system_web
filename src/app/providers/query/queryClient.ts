import { QueryClient } from "@tanstack/react-query";
import { QUERY_DEFAULTS } from "@/shared/constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      gcTime: QUERY_DEFAULTS.GARBAGE_COLLECTION_TIME_MS,
      refetchOnWindowFocus: false,
      retry: QUERY_DEFAULTS.RETRY_COUNT,
      staleTime: QUERY_DEFAULTS.STALE_TIME_MS,
    },
  },
});
