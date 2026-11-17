import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/types";
import { availabilityQueryKeys } from "./availabilityQueryKeys";
import { fetchAvailability } from "./fetchAvailability";
import type {
  AvailabilityQueryParams,
  DayAvailability,
} from "../models/availability.model";

/**
 * Free slots of one day (spec P5-3). One key per date, so a late answer for
 * a day the customer left never replaces the current one (AC-KAN-140-08).
 * Always fetched fresh; an error is not retried, the screen offers a retry.
 */
export const useAvailabilityQuery = (
  params: Nullable<AvailabilityQueryParams>,
): UseQueryResult<DayAvailability> =>
  useQuery({
    enabled: params !== null,
    queryFn: () => fetchAvailability(params as AvailabilityQueryParams),
    queryKey: params
      ? availabilityQueryKeys.day(params)
      : availabilityQueryKeys.all(),
    retry: false,
    staleTime: 0,
  });
