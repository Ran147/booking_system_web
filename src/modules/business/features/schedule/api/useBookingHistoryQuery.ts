import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { SCHEDULE_CONSTANTS } from "../constants";
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
  timeZone: string = SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
): UseQueryResult<BookingHistoryResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchBookingHistory(businessId, filters, pageSize, timeZone),
    queryKey: scheduleQueryKeys.history(businessId, filters, page),
  });
};
