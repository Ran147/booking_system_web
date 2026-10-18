import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { fetchBookingBusiness } from "./fetchBookingBusiness";
import { myBookingsQueryKeys } from "./myBookingsQueryKeys";
import type { BookingBusiness } from "../models";

// One query per distinct business: the cache shares them across lists.
export const useBookingBusinessesQueries = (
  businessIds: readonly string[],
): UseQueryResult<BookingBusiness>[] =>
  useQueries({
    queries: [...new Set(businessIds)].map((businessId) => ({
      queryFn: (): Promise<BookingBusiness> => fetchBookingBusiness(businessId),
      queryKey: myBookingsQueryKeys.business(businessId),
    })),
  });
