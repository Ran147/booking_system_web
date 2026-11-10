import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { PAGINATION } from "@/constants";
import { fetchBookingList, type BookingListResult } from "./fetchBookingList";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export const useBookingListQuery = (
  businessId: string,
  page = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
): UseQueryResult<BookingListResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchBookingList(businessId, page, pageSize),
    queryKey: scheduleQueryKeys.upcoming(businessId, page),
  });
};
