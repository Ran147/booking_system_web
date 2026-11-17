import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/types";
import { availabilityQueryKeys } from "./availabilityQueryKeys";
import {
  findFirstAvailableDate,
  type FirstAvailableDateParams,
} from "./findFirstAvailableDate";

/**
 * The first open day with a free slot (AC-KAN-140-07). Disabled when the URL
 * already has a date. TanStack Query aborts the signal when nobody needs the
 * answer anymore, which stops the day-by-day search.
 */
export const useFirstAvailableDateQuery = (
  params: Nullable<FirstAvailableDateParams>,
): UseQueryResult<string> =>
  useQuery({
    enabled: params !== null,
    queryFn: ({ signal }): Promise<string> =>
      findFirstAvailableDate(params as FirstAvailableDateParams, signal),
    queryKey: params
      ? availabilityQueryKeys.firstAvailableDate(
          params.businessId,
          params.serviceId,
          params.collaboratorId,
        )
      : availabilityQueryKeys.all(),
    retry: false,
    staleTime: 0,
  });
