import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchBookingList, type BookingListResult } from "./fetchBookingList";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export const useBookingListQuery = (
  businessId: string,
  page = 1,
  pageSize = 10,
): UseQueryResult<BookingListResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchBookingList(businessId, pageSize),
    queryKey: scheduleQueryKeys.upcoming(businessId, page),
  });
};
