import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { PAGINATION } from "@/constants";
import type { Nullable } from "@/types";
import { fetchBookingList, type BookingListResult } from "./fetchBookingList";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export const useBookingListQuery = (
  businessId: string,
  page = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  restrictedCollaboratorId?: Nullable<string>,
  enabled = true,
): UseQueryResult<BookingListResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId) && enabled,
    queryFn: () =>
      restrictedCollaboratorId
        ? fetchBookingList(businessId, page, pageSize, restrictedCollaboratorId)
        : fetchBookingList(businessId, page, pageSize),
    queryKey: scheduleQueryKeys.upcoming(
      businessId,
      page,
      restrictedCollaboratorId,
    ),
  });
};
