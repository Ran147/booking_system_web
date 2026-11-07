import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Booking } from "@/domain";
import { fetchBookingDetail } from "./fetchBookingDetail";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export const useBookingDetailQuery = (
  businessId: string,
  bookingId: string,
): UseQueryResult<Booking, Error> => {
  return useQuery({
    enabled: Boolean(businessId && bookingId),
    queryFn: () => fetchBookingDetail(businessId, bookingId),
    queryKey: scheduleQueryKeys.detail(businessId, bookingId),
  });
};
