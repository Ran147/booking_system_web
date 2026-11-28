import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { PAGINATION } from "@/constants";
import type { Nullable } from "@/types";
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
  restrictedCollaboratorId?: Nullable<string>,
  enabled = true,
): UseQueryResult<BookingHistoryResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId) && enabled,
    queryFn: () =>
      restrictedCollaboratorId
        ? fetchBookingHistory(
            businessId,
            filters,
            page,
            pageSize,
            timeZone,
            restrictedCollaboratorId,
          )
        : fetchBookingHistory(businessId, filters, page, pageSize, timeZone),
    queryKey: scheduleQueryKeys.history(
      businessId,
      filters,
      page,
      restrictedCollaboratorId,
    ),
  });
};
