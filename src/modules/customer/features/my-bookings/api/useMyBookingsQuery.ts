import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CursorPage } from "@/shared/types";
import { fetchMyBookingsPage } from "./fetchMyBookingsPage";
import { myBookingsQueryKeys, readListKeyTab } from "./myBookingsQueryKeys";
import { NO_CUSTOMER_USER_ID } from "../constants";
import type { MyBooking, MyBookingsQueryParams } from "../models";

// isReady lets the caller hold the request back: while the time zone of the
// business filter loads, or when the date range is invalid (AC-KAN-154-06).
export const useMyBookingsQuery = (
  myBookingsQueryParams: MyBookingsQueryParams,
  isReady: boolean,
): UseQueryResult<CursorPage<MyBooking>> =>
  useQuery({
    enabled:
      isReady && myBookingsQueryParams.customerUserId !== NO_CUSTOMER_USER_ID,
    // The previous page stays while the next one loads, but not when the tab
    // changes: upcoming bookings must not stay under "History".
    placeholderData: (previousData, previousQuery) =>
      previousQuery &&
      readListKeyTab(previousQuery.queryKey) === myBookingsQueryParams.tab
        ? keepPreviousData(previousData)
        : undefined,
    queryFn: () => fetchMyBookingsPage(myBookingsQueryParams),
    queryKey: myBookingsQueryKeys.list(myBookingsQueryParams),
  });
