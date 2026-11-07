import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { BookingHistoryFilterValues } from "../models";
import {
  fetchBookingHistory,
  type BookingHistoryResult,
} from "./fetchBookingHistory";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export const useBookingHistoryQuery = (
  businessId: string,
  filters: BookingHistoryFilterValues,
  page = 1,
  pageSize = 10,
): UseQueryResult<BookingHistoryResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchBookingHistory(businessId, filters, pageSize),
    queryKey: scheduleQueryKeys.history(businessId, filters, page),
  });
};
