import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { PAGINATION } from "@/constants";
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
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  timeZone: string = SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
): UseQueryResult<BookingHistoryResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () =>
      fetchBookingHistory(businessId, filters, page, pageSize, timeZone),
    queryKey: scheduleQueryKeys.history(businessId, filters, page),
  });
};
