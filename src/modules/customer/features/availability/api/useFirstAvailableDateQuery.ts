import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Nullable } from "@/types";
import { availabilityQueryKeys } from "./availabilityQueryKeys";
import { fetchAvailability } from "./fetchAvailability";

interface FirstAvailableDateParams {
  readonly businessId: string;
  readonly collaboratorId: Nullable<string>;
  /** Open days from today to the end of the window, in order. */
  readonly openDays: readonly string[];
  readonly serviceId: string;
  /** Today in the business time zone, used when no day has a slot. */
  readonly today: string;
}

/**
 * AC-KAN-140-07, AS-2: asks the open days one by one and stops at the first
 * with a free slot; with none in the window it falls back to today, which then
 * shows the empty state. Disabled when the URL already has a date.
 */
export const useFirstAvailableDateQuery = (
  params: Nullable<FirstAvailableDateParams>,
): UseQueryResult<string> =>
  useQuery({
    enabled: params !== null,
    queryFn: async (): Promise<string> => {
      const { businessId, collaboratorId, openDays, serviceId, today } =
        params as FirstAvailableDateParams;
      for (const date of openDays) {
        const day = await fetchAvailability({
          businessId,
          collaboratorId,
          date,
          serviceId,
        });
        if (day.slots.length > 0) return date;
      }
      return today;
    },
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
